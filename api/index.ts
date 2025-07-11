// services/api/src/index.ts - Main Cloudflare Worker
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { SimpleOrchestrator } from './simple-orchestrator';
import { VideoGenerationService } from '../services/video-generation/VideoGenerationService';
import { DatabaseService } from '../services/video-generation/DatabaseService';
import { AuthService } from '../services/video-generation/AuthService';
import { RateLimitService } from '../services/video-generation/RateLimitService';
import type { D1Database, KVNamespace, R2Bucket, Queue } from '@cloudflare/workers-types';
import { Context } from 'hono';

interface ContextBindings {
  orchestrator: SimpleOrchestrator;
  videoService: VideoGenerationService;
  database: DatabaseService;
  auth: AuthService;
  rateLimit: RateLimitService;
  apiKeyData: any;
}

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  HEYGEN_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  WEBHOOK_QUEUE: Queue;
}

const app = new Hono<{ Bindings: Env }>();

// Add this after imports:
declare module 'hono' {
  interface Context {
    services: {
      orchestrator: SimpleOrchestrator;
      videoService: VideoGenerationService;
      database: DatabaseService;
      auth: AuthService;
      rateLimit: RateLimitService;
      apiKeyData?: any;
    };
  }
}

// At the top of the file, define unique symbols for each context key
const orchestratorKey = Symbol('orchestrator');
const videoServiceKey = Symbol('videoService');
const databaseKey = Symbol('database');
const authKey = Symbol('auth');
const rateLimitKey = Symbol('rateLimit');
const apiKeyDataKey = Symbol('apiKeyData');

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://dailylesson.org', 'https://mynextlesson.org', 'https://ilearn.how', 'https://cms.ilearn.how', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize services
app.use('/v1/*', async (c, next) => {
  c.services = {
    orchestrator: new SimpleOrchestrator(),
    videoService: new VideoGenerationService(c.env),
    database: new DatabaseService(c.env.DB),
    auth: new AuthService(c.env.DB),
    rateLimit: new RateLimitService(c.env.KV)
  };
  await next();
});

// Authentication middleware (simplified for development)
app.use('/v1/*', async (c, next) => {
  // For development, skip authentication
  c.services.apiKeyData = {
    key_id: 'dev_key',
    rate_limit_per_hour: 1000
  };
  await next();
});

// Rate limiting middleware (simplified for development)
app.use('/v1/*', async (c, next) => {
  // For development, skip rate limiting
  await next();
});

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'iLearn.how API v1',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    documentation: 'https://docs.ilearn.how'
  });
});

// MAIN ENDPOINT: Get daily lesson
app.get('/v1/daily-lesson', async (c) => {
  const startTime = Date.now();
  
  try {
    const { age, tone, language, include_media = 'true', lesson_date } = c.req.query();
    
    // Validate parameters
    const validationError = validateLessonParams({ age, tone, language });
    if (validationError) {
      return c.json({ error: validationError }, 400);
    }

    const orchestrator = c.services.orchestrator;
    const database = c.services.database;
    
    // Determine lesson date
    const targetDate = lesson_date || new Date().toISOString().split('T')[0];
    const dayOfYear = getDayOfYear(new Date(targetDate));
    
    // Generate lesson ID
    const lessonId = `daily_lesson_${targetDate.replace(/-/g, '')}_${dayOfYear}`;
    const variationId = `${lessonId}_${age}_${tone}_${language}`;
    
    // Check cache first
    let lesson = await database.getLesson(variationId);
    
    if (!lesson) {
      // Generate new lesson
      console.log(`Generating lesson: ${variationId}`);
      
      const lessonDNA = await loadDailyLessonDNA(dayOfYear);
      
      const generatedLesson = await orchestrator.generateLesson(
        lessonDNA.lesson_id,
        parseInt(age),
        tone as any,
        language,
        { forceRegenerate: false }
      );
      
      // Store in database
      lesson = {
        lesson_id: variationId,
        lesson_metadata: {
          ...generatedLesson.lesson_metadata,
          day: dayOfYear,
          date: targetDate,
          age_target: parseInt(age),
          tone,
          language,
          generated_at: new Date().toISOString()
        },
        scripts: generatedLesson.scripts,
        audio_url: null, // Will be populated after generation
        video_url: null, // Will be populated after generation
        production_notes: generatedLesson.production_notes
      };
      
      await database.saveLesson(lesson);
    }
    
    const responseTime = Date.now() - startTime;
    
    return c.json({
      lesson,
      metadata: {
        generated_at: new Date().toISOString(),
        response_time_ms: responseTime,
        cache_status: lesson ? 'hit' : 'miss',
        day_of_year: dayOfYear,
        target_date: targetDate
      }
    });
    
  } catch (error) {
    console.error('Error generating lesson:', error);
    return c.json({
      error: {
        code: 'lesson_generation_failed',
        message: 'Failed to generate lesson',
        details: error.message
      }
    }, 500);
  }
});

// TEST ENDPOINT: Get July 11 acoustics lesson specifically
app.get('/v1/test-acoustics', async (c) => {
  try {
    const { age = '25', tone = 'fun', language = 'english' } = c.req.query();
    
    const orchestrator = c.services.orchestrator;
    
    // Load the July 11 acoustics lesson DNA
    const lessonDNA = await loadAcousticsLessonDNA();
    
    console.log(`Generating acoustics lesson: age=${age}, tone=${tone}, language=${language}`);
    
    const generatedLesson = await orchestrator.generateLesson(
      lessonDNA.lesson_id,
      parseInt(age),
      tone as any,
      language,
      { forceRegenerate: false }
    );
    
    return c.json({
      lesson: generatedLesson,
      metadata: {
        generated_at: new Date().toISOString(),
        lesson_id: lessonDNA.lesson_id,
        test_lesson: true
      }
    });
    
  } catch (error) {
    console.error('Error generating acoustics lesson:', error);
    return c.json({
      error: {
        code: 'test_lesson_failed',
        message: 'Failed to generate test lesson',
        details: error.message
      }
    }, 500);
  }
});

// Get lesson by ID
app.get('/v1/lessons/:lessonId', async (c) => {
  try {
    const lessonId = c.req.param('lessonId');
    const includeMedia = c.req.query('include_media') !== 'false';
    
    const database = c.services.database;
    const lesson = await database.getLesson(lessonId);
    
    if (!lesson) {
      return c.json({
        error: {
          code: 'lesson_not_found',
          message: `Lesson '${lessonId}' does not exist`,
          type: 'not_found'
        }
      }, 404);
    }

    if (!includeMedia) {
      delete lesson.audio_url;
      delete lesson.video_url;
    }

    return c.json(lesson);
    
  } catch (error) {
    console.error('Get lesson error:', error);
    return c.json({
      error: {
        code: 'internal_error',
        message: 'Failed to retrieve lesson',
        type: 'server_error'
      }
    }, 500);
  }
});

// Generate custom lesson
app.post('/v1/lessons/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { topic, age, tone, language, custom_instructions } = body;
    
    if (!topic || !age || !tone || !language) {
      return c.json({
        error: {
          code: 'missing_parameters',
          message: 'Required parameters: topic, age, tone, language',
          type: 'validation_error'
        }
      }, 400);
    }

    const orchestrator = c.services.orchestrator;
    const database = c.services.database;
    
    // Generate unique lesson ID
    const timestamp = Date.now();
    const lessonId = `custom_${topic.replace(/\s+/g, '_').toLowerCase()}_${timestamp}`;
    
    // Create custom lesson DNA
    const customLessonDNA = await createCustomLessonDNA(topic, custom_instructions);
    
    // Generate lesson
    const generatedLesson = await orchestrator.generateLesson(
      customLessonDNA.lesson_id,
      parseInt(age),
      tone as any,
      language
    );
    
    const lesson = {
      lesson_id: lessonId,
      lesson_metadata: {
        ...generatedLesson.lesson_metadata,
        title: `Custom: ${topic}`,
        category: 'custom',
        subject: topic,
        age_target: parseInt(age),
        tone,
        language,
        generated_at: new Date().toISOString()
      },
      scripts: generatedLesson.scripts,
      audio_url: null,
      video_url: null,
      production_notes: {
        ...generatedLesson.production_notes,
        custom_instructions
      }
    };
    
    await database.saveLesson(lesson);
    
    // Queue video generation
    const videoService = c.services.videoService;
    await videoService.queueVideoGeneration(lesson, { age: parseInt(age), tone, language });
    
    return c.json(lesson, 201);
    
  } catch (error) {
    console.error('Generate lesson error:', error);
    return c.json({
      error: {
        code: 'generation_failed',
        message: 'Failed to generate custom lesson',
        type: 'server_error'
      }
    }, 500);
  }
});

// CMS Endpoints (protected)
app.get('/v1/cms/lesson-dna/:lessonId', async (c) => {
  const lessonId = c.req.param('lessonId');
  const database = c.services.database;
  
  try {
    const lessonDNA = await database.getLessonDNA(lessonId);
    if (!lessonDNA) {
      return c.json({ error: { code: 'not_found', message: 'Lesson DNA not found' } }, 404);
    }
    return c.json(lessonDNA);
  } catch (error) {
    return c.json({ error: { code: 'internal_error', message: error.message } }, 500);
  }
});

app.post('/v1/cms/lesson-dna', async (c) => {
  try {
    const lessonDNA = await c.req.json();
    const database = c.services.database;
    
    await database.saveLessonDNA(lessonDNA);
    return c.json({ success: true, lesson_id: lessonDNA.lesson_id }, 201);
  } catch (error) {
    return c.json({ error: { code: 'save_failed', message: error.message } }, 500);
  }
});

app.post('/v1/cms/generate-videos', async (c) => {
  try {
    const { lesson_id, variations } = await c.req.json();
    const videoService = c.services.videoService;
    const database = c.services.database;
    
    // Get lesson
    const lesson = await database.getLesson(lesson_id);
    if (!lesson) {
      return c.json({ error: { code: 'lesson_not_found' } }, 404);
    }
    
    // Queue video generation for each variation
    const queueResults = [];
    for (const variation of variations) {
      const result = await videoService.queueVideoGeneration(lesson, variation);
      queueResults.push(result);
    }
    
    return c.json({
      success: true,
      queued_videos: queueResults.length,
      results: queueResults
    });
  } catch (error) {
    return c.json({ error: { code: 'queue_failed', message: error.message } }, 500);
  }
});

// Webhook endpoints
app.post('/v1/webhooks/heygen', async (c) => {
  try {
    const body = await c.req.json();
    const { video_id, status, video_url, lesson_id } = body;
    
    if (status === 'completed' && video_url && lesson_id) {
      const database = c.services.database;
      await database.updateLessonVideo(lesson_id, video_url);
      
      // Queue any follow-up processing
      await c.env.WEBHOOK_QUEUE.send({
        type: 'lesson.media_ready',
        lesson_id,
        video_url,
        timestamp: Date.now()
      });
    }
    
    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Analytics endpoint
app.get('/v1/analytics/usage', async (c) => {
  try {
    const { start_date, end_date, key_id } = c.req.query();
    const database = c.services.database;
    
    const analytics = await database.getUsageAnalytics({
      startDate: start_date,
      endDate: end_date,
      keyId: key_id
    });
    
    return c.json(analytics);
  } catch (error) {
    return c.json({ error: { code: 'analytics_failed', message: error.message } }, 500);
  }
});

// Helper functions
function validateLessonParams({ age, tone, language }: any) {
  if (!age || !tone || !language) {
    return {
      code: 'missing_parameters',
      message: 'age, tone, and language are required'
    };
  }
  
  const validAges = ['5', '12', '25', '45', '75'];
  const validTones = ['fun', 'grandmother', 'neutral'];
  const validLanguages = ['english', 'spanish', 'french', 'german', 'chinese'];
  
  if (!validAges.includes(age)) {
    return {
      code: 'invalid_age',
      message: `Age must be one of: ${validAges.join(', ')}`
    };
  }
  
  if (!validTones.includes(tone)) {
    return {
      code: 'invalid_tone',
      message: `Tone must be one of: ${validTones.join(', ')}`
    };
  }
  
  if (!validLanguages.includes(language)) {
    return {
      code: 'invalid_language',
      message: `Language must be one of: ${validLanguages.join(', ')}`
    };
  }
  
  return null;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

async function loadDailyLessonDNA(dayOfYear: number) {
  // For now, return the acoustics lesson for July 11 (day 192)
  if (dayOfYear === 192) {
    return await loadAcousticsLessonDNA();
  }
  
  // Fallback to a basic lesson structure
  return {
    lesson_id: `daily_lesson_${dayOfYear}`,
    universal_concept: 'learning',
    core_principle: 'knowledge_empowers',
    learning_essence: 'Every day brings new opportunities to learn and grow.',
    age_expressions: {},
    core_lesson_structure: {},
    tone_delivery_dna: {},
    language_adaptation_framework: {},
    example_selector_data: {},
    daily_fortune_elements: {}
  };
}

async function loadAcousticsLessonDNA() {
  // In a real implementation, this would load from a file or database
  // For now, return the hardcoded acoustics lesson DNA
  return {
    lesson_id: "acoustics_july11_192",
    day_of_year: 192,
    date: "July 11",
    universal_concept: "acoustics",
    core_principle: "sound_physics_enables_communication_and_accessibility",
    learning_essence: "Sound is everywhere - from the music we love to the voices we hear. Understanding how sound works helps us build better technology, design better spaces, and help people who can't hear well.",
    
    age_expressions: {
      early_childhood: {
        concept_name: "Sounds Around Us",
        core_metaphor: "Sound is like invisible waves that tickle our ears",
        complexity_level: "beginner",
        attention_span: 180,
        abstract_concepts: {
          sound: "Something we hear with our ears",
          vibration: "When something shakes back and forth",
          echo: "When sound bounces back to us"
        },
        examples: [
          {
            scenario: "When you clap your hands",
            option_a: "The sound travels through the air like ripples in water",
            option_b: "The sound stays right where your hands are"
          },
          {
            scenario: "When you talk in a big empty room",
            option_a: "Your voice echoes because sound bounces off the walls",
            option_b: "Your voice gets louder because the room is big"
          }
        ],
        vocabulary: ["sound", "loud", "quiet", "echo", "hear"]
      },
      
      youth: {
        concept_name: "The Science of Sound",
        core_metaphor: "Sound is energy traveling through air like waves in the ocean",
        complexity_level: "intermediate",
        attention_span: 300,
        abstract_concepts: {
          sound_waves: "Patterns of air pressure that carry sound",
          frequency: "How fast sound waves vibrate",
          amplitude: "How big or small the sound waves are",
          acoustics: "How sound behaves in different spaces"
        },
        examples: [
          {
            scenario: "Why do some rooms sound echoey and others don't?",
            option_a: "Hard surfaces like walls bounce sound back, soft surfaces like carpets absorb it",
            option_b: "Big rooms always have echoes, small rooms never do"
          },
          {
            scenario: "How do hearing aids help people hear better?",
            option_a: "They make sound waves bigger and clearer for damaged ears",
            option_b: "They create new sounds that replace the ones people can't hear"
          }
        ],
        vocabulary: ["sound waves", "frequency", "amplitude", "acoustics", "hearing aid"]
      },
      
      young_adult: {
        concept_name: "Acoustics and Technology",
        core_metaphor: "Sound physics is the foundation of modern communication and accessibility technology",
        complexity_level: "advanced",
        attention_span: 360,
        abstract_concepts: {
          wave_propagation: "How sound energy travels through different materials",
          resonance: "When objects vibrate at their natural frequency",
          noise_cancellation: "Using opposite sound waves to reduce unwanted noise",
          acoustic_engineering: "Designing spaces and technology for optimal sound"
        },
        examples: [
          {
            scenario: "How do noise-canceling headphones work?",
            option_a: "They create sound waves that are the opposite of unwanted noise, canceling it out",
            option_b: "They block all sound from reaching your ears with physical barriers"
          },
          {
            scenario: "Why do concert halls have special shapes?",
            option_a: "The curved surfaces help sound waves reach every seat clearly and evenly",
            option_b: "The shapes look more interesting and artistic than straight walls"
          }
        ],
        vocabulary: ["wave propagation", "resonance", "noise cancellation", "acoustic engineering", "frequency response"]
      },
      
      midlife: {
        concept_name: "Acoustic Innovation and Impact",
        core_metaphor: "Understanding sound physics enables technologies that connect people and improve lives",
        complexity_level: "expert",
        attention_span: 360,
        abstract_concepts: {
          acoustic_optimization: "Fine-tuning sound environments for specific purposes",
          accessibility_technology: "Using sound science to help people with hearing challenges",
          communication_infrastructure: "How sound physics enables global connectivity",
          environmental_acoustics: "Managing sound pollution and creating healthy soundscapes"
        },
        examples: [
          {
            scenario: "How does acoustic design help people with hearing loss?",
            option_a: "By reducing background noise and focusing sound where it's needed, making speech clearer",
            option_b: "By making everything louder so people can hear better"
          },
          {
            scenario: "Why is sound important in virtual reality?",
            option_a: "3D sound helps our brains understand where things are in virtual space, making it feel real",
            option_b: "Sound makes virtual reality more entertaining and less boring"
          }
        ],
        vocabulary: ["acoustic optimization", "accessibility technology", "communication infrastructure", "environmental acoustics", "spatial audio"]
      },
      
      wisdom_years: {
        concept_name: "The Wisdom of Sound",
        core_metaphor: "Sound connects us across generations and cultures, and understanding it helps us build a more accessible world",
        complexity_level: "master",
        attention_span: 360,
        abstract_concepts: {
          acoustic_heritage: "How sound shapes cultural identity and memory",
          intergenerational_communication: "Using sound technology to bridge age gaps",
          acoustic_legacy: "Designing sound environments that serve future generations",
          sound_wisdom: "Understanding how sound affects human wellbeing and connection"
        },
        examples: [
          {
            scenario: "How can acoustic design help communities stay connected?",
            option_a: "By creating spaces where people of all ages can hear each other clearly and feel included",
            option_b: "By making public spaces quieter so people can talk more easily"
          },
          {
            scenario: "Why is preserving natural soundscapes important?",
            option_a: "Natural sounds connect us to our environment and provide peace that technology can't replace",
            option_b: "Natural sounds are prettier than man-made sounds"
          }
        ],
        vocabulary: ["acoustic heritage", "intergenerational communication", "acoustic legacy", "sound wisdom", "soundscape preservation"]
      }
    },
    
    core_lesson_structure: {
      question_1: {
        concept_focus: "sound_wave_basics",
        universal_principle: "Sound travels through air as waves that our ears can detect",
        cognitive_target: "understanding_how_sound_moves",
        choice_architecture: {
          option_a: "Sound waves travel through air like ripples in water, getting smaller as they go farther",
          option_b: "Sound stays in one place and doesn't move anywhere"
        }
      },
      question_2: {
        concept_focus: "acoustic_design",
        universal_principle: "Different materials and shapes affect how sound behaves in spaces",
        cognitive_target: "applying_sound_physics_to_design",
        choice_architecture: {
          option_a: "Soft materials absorb sound while hard surfaces bounce it back, affecting how rooms sound",
          option_b: "The size of a room is the only thing that matters for how it sounds"
        }
      },
      question_3: {
        concept_focus: "accessibility_technology",
        universal_principle: "Understanding sound physics helps create technology that makes life better for everyone",
        cognitive_target: "connecting_science_to_human_benefit",
        choice_architecture: {
          option_a: "Hearing aids and acoustic design help people with hearing challenges by making sound clearer and easier to understand",
          option_b: "Technology can completely replace the need for hearing by creating new ways to communicate"
        }
      }
    },
    
    tone_delivery_dna: {
      fun: {
        voice_character: "energetic_explorer",
        language_patterns: {
          openings: ["Hey there!", "Ready for some sound science?", "Let's discover something amazing!"],
          transitions: ["Here's the cool part...", "But wait, there's more!", "Now for the really fun stuff..."],
          encouragements: ["You're getting it!", "That's exactly right!", "You're a sound scientist now!"],
          closings: ["You just learned something awesome!", "Keep exploring the world of sound!", "You're ready to share this knowledge!"]
        },
        emotional_delivery: "excitement_and_wonder"
      },
      grandmother: {
        voice_character: "wise_nurturer",
        language_patterns: {
          openings: ["Come here, dear one...", "Let me share something wonderful with you...", "You know, there's something beautiful about..."],
          transitions: ["And here's what's truly special...", "But the most important thing is...", "What I want you to remember..."],
          encouragements: ["You understand this so well...", "That's exactly right, my dear...", "You have such wisdom..."],
          closings: ["Remember this always...", "You carry this knowledge with you...", "Share this understanding with others..."]
        },
        emotional_delivery: "warm_guidance"
      },
      neutral: {
        voice_character: "knowledgeable_guide",
        language_patterns: {
          openings: ["Today we'll explore...", "Let's examine...", "We'll investigate..."],
          transitions: ["Furthermore...", "Additionally...", "Moreover..."],
          encouragements: ["That's correct.", "You're on the right track.", "Good observation."],
          closings: ["You now understand...", "This knowledge enables...", "You can apply this to..."]
        },
        emotional_delivery: "professional_clarity"
      }
    },
    
    language_adaptation_framework: {
      cultural_intelligence_markers: {
        sound_cultural_significance: "varies_by_culture",
        communication_style: "respects_local_norms",
        example_relevance: "culturally_appropriate"
      },
      translation_guidance: {
        technical_terms: "adapt_to_local_equivalents",
        metaphors: "use_culturally_familiar_analogies",
        examples: "select_culturally_relevant_scenarios"
      }
    },
    
    example_selector_data: {
      universal_examples: [
        "clapping_hands",
        "echo_in_room",
        "music_through_speakers",
        "voice_on_phone"
      ],
      age_specific_examples: {
        early_childhood: ["animal_sounds", "musical_toys", "singing_songs"],
        youth: ["headphones", "school_announcements", "video_games"],
        young_adult: ["noise_cancellation", "concert_venues", "recording_studios"],
        midlife: ["office_acoustics", "medical_imaging", "urban_planning"],
        wisdom_years: ["community_spaces", "natural_soundscapes", "intergenerational_communication"]
      }
    },
    
    daily_fortune_elements: {
      identity_reinforcement: "You are someone who understands how the world works and uses that knowledge to help others.",
      capability_affirmation: "You can apply sound science to solve real problems and make life better for people.",
      future_orientation: "Your understanding of acoustics helps you build a world where everyone can communicate clearly and feel included."
    }
  };
}

async function createCustomLessonDNA(topic: string, customInstructions?: string) {
  // Generate dynamic lesson DNA based on topic
  return {
    lesson_id: `custom_${topic.replace(/\s+/g, '_').toLowerCase()}`,
    universal_concept: topic.toLowerCase().replace(/\s+/g, '_'),
    core_principle: `Understanding ${topic} enhances human capability and connection`,
    learning_essence: `Learn about ${topic} in a way that builds practical understanding and application`,
    custom_instructions: customInstructions,
    // ... rest of DNA structure would be generated
  };
}

export default app;