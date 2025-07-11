// services/api/src/index.ts - Main Cloudflare Worker
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { UniversalLessonOrchestrator } from '../services/video-generation/UniversalLessonOrchestrator';
import { VideoGenerationService } from '../services/video-generation/VideoGenerationService';
import { DatabaseService } from '../services/video-generation/DatabaseService';
import { AuthService } from '../services/video-generation/AuthService';
import { RateLimitService } from '../services/video-generation/RateLimitService';
import type { D1Database, KVNamespace, R2Bucket, Queue } from '@cloudflare/workers-types';
import { Context } from 'hono';

interface ContextBindings {
  orchestrator: UniversalLessonOrchestrator;
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
      orchestrator: UniversalLessonOrchestrator;
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

// Add interface for lesson type
interface Lesson {
  lesson_id: string;
  lesson_metadata: any;
  scripts: any;
  audio_url?: string | null;
  video_url?: string | null;
  production_notes: any;
}

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://dailylesson.org', 'https://mynextlesson.org', 'https://ilearn.how', 'https://cms.ilearn.how'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize services
app.use('/v1/*', async (c, next) => {
  c.services = {
    orchestrator: new UniversalLessonOrchestrator(),
    videoService: new VideoGenerationService(c.env),
    database: new DatabaseService(c.env.DB),
    auth: new AuthService(c.env.DB),
    rateLimit: new RateLimitService(c.env.KV)
  };
  await next();
});

// Authentication middleware
app.use('/v1/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      error: {
        code: 'unauthorized',
        message: 'Invalid API key provided',
        type: 'authentication_error',
        documentation_url: 'https://docs.ilearn.how/authentication'
      }
    }, 401);
  }

  const apiKey = authHeader.substring(7);
  const auth = c.services.auth;
  
  try {
    const keyData = await auth.validateAPIKey(apiKey);
    c.services.apiKeyData = keyData;
  } catch (error) {
    return c.json({
      error: {
        code: 'unauthorized',
        message: 'Invalid API key',
        type: 'authentication_error'
      }
    }, 401);
  }

  await next();
});

// Rate limiting middleware
app.use('/v1/*', async (c, next) => {
  const keyData = c.services.apiKeyData;
  const rateLimit = c.services.rateLimit;
  
  const isAllowed = await rateLimit.checkRateLimit(keyData.key_id, keyData.rate_limit_per_hour);
  
  if (!isAllowed) {
    return c.json({
      error: {
        code: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Limit: ${keyData.rate_limit_per_hour} requests per hour`,
        type: 'rate_limit_error'
      }
    }, 429);
  }

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
    let lesson: Lesson | null = await database.getLesson(variationId) as Lesson | null;
    
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
      
      // Queue video generation if not exists
      const videoService = c.services.videoService;
      await videoService.queueVideoGeneration(lesson, { age: parseInt(age), tone, language });
    }

    // Remove media URLs if not requested
    if (include_media === 'false') {
      delete lesson.audio_url;
      delete lesson.video_url;
    }

    // Log usage
    await database.logAPIUsage({
      key_id: c.services.apiKeyData.key_id,
      endpoint: '/v1/daily-lesson',
      method: 'GET',
      status_code: 200,
      response_time_ms: Date.now() - startTime,
      request_timestamp: new Date().toISOString(),
      request_ip: c.req.header('CF-Connecting-IP') || 'unknown',
      user_agent: c.req.header('User-Agent') || 'unknown'
    });

    return c.json(lesson);
    
  } catch (error) {
    console.error('Daily lesson error:', error);
    
    // Fix the error_message access in analytics logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await c.services.database.logAPIUsage({
      key_id: c.services.apiKeyData.key_id,
      endpoint: '/v1/daily-lesson',
      method: 'GET',
      status_code: 500,
      response_time_ms: Date.now() - startTime,
      request_timestamp: new Date().toISOString(),
      error_message: errorMessage
    });
    
    return c.json({
      error: {
        code: 'internal_error',
        message: 'Failed to generate lesson',
        type: 'server_error'
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
    const lesson = await database.getLesson(lessonId) as any;
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return c.json({
      error: {
        code: 'generation_failed',
        message: 'Failed to generate lesson',
        type: 'server_error',
        error_message: errorMessage
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return c.json({ error: { code: 'internal_error', message: errorMessage } }, 500);
  }
});

app.post('/v1/cms/lesson-dna', async (c) => {
  try {
    const lessonDNA = await c.req.json();
    const database = c.services.database;
    
    await database.saveLessonDNA(lessonDNA);
    return c.json({ success: true, lesson_id: lessonDNA.lesson_id }, 201);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return c.json({ error: { code: 'save_failed', message: errorMessage } }, 500);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return c.json({ error: { code: 'queue_failed', message: errorMessage } }, 500);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return c.json({ error: { code: 'analytics_failed', message: errorMessage } }, 500);
  }
});

// Helper functions
function validateLessonParams({ age, tone, language }: any) {
  if (!age) {
    return { code: 'missing_parameter', message: 'Age parameter is required', type: 'validation_error' };
  }
  
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 2 || ageNum > 102) {
    return { code: 'invalid_parameter', message: 'Age must be between 2 and 102', type: 'validation_error' };
  }
  
  if (!['grandmother', 'fun', 'neutral'].includes(tone)) {
    return { code: 'invalid_parameter', message: 'Tone must be one of: grandmother, fun, neutral', type: 'validation_error' };
  }
  
  if (!language) {
    return { code: 'missing_parameter', message: 'Language parameter is required', type: 'validation_error' };
  }
  
  return null;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function loadDailyLessonDNA(dayOfYear: number) {
  // This would load from your 366 pre-created lesson DNA files
  // For now, using a placeholder structure
  return {
    lesson_id: `daily_lesson_${dayOfYear}`,
    day: dayOfYear,
    universal_concept: 'daily_learning_growth',
    core_principle: 'Every day offers opportunity for growth and understanding',
    learning_essence: 'Develop knowledge and wisdom through structured learning',
    // ... rest of DNA structure
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