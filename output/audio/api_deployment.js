// Cloudflare Workers API for iLearn.how
// Deploy this to get your API live immediately

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: ['https://dailylesson.org', 'https://mynextlesson.org', 'https://ilearn.how'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// API Key validation middleware
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
  
  // Validate API key format
  if (!apiKey.startsWith('ilearn_live_sk_') && !apiKey.startsWith('ilearn_test_sk_')) {
    return c.json({
      error: {
        code: 'unauthorized',
        message: 'Invalid API key format',
        type: 'authentication_error'
      }
    }, 401);
  }

  // Store API key info in context for rate limiting
  c.set('apiKey', apiKey);
  c.set('isTestKey', apiKey.startsWith('ilearn_test_sk_'));
  
  await next();
});

// Rate limiting
app.use('/v1/*', async (c, next) => {
  const apiKey = c.get('apiKey');
  const isTestKey = c.get('isTestKey');
  
  // Implement basic rate limiting using Cloudflare KV
  const rateLimitKey = `rate_limit:${apiKey}`;
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const rateLimitData = await c.env.KV.get(rateLimitKey);
  
  let requests = 1;
  if (rateLimitData) {
    const data = JSON.parse(rateLimitData);
    if (data.hour === currentHour) {
      requests = data.requests + 1;
    }
  }
  
  const limit = isTestKey ? 100 : 1000; // Test keys limited to 100/hour
  
  if (requests > limit) {
    return c.json({
      error: {
        code: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Limit: ${limit} requests per hour`,
        type: 'rate_limit_error'
      }
    }, 429);
  }
  
  // Update rate limit counter
  await c.env.KV.put(rateLimitKey, JSON.stringify({
    hour: currentHour,
    requests: requests
  }), { expirationTtl: 3600 }); // Expire in 1 hour
  
  await next();
});

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    message: 'iLearn.how API v1',
    status: 'operational',
    version: '1.0.0',
    documentation: 'https://docs.ilearn.how'
  });
});

// Get daily lesson endpoint
app.get('/v1/daily-lesson', async (c) => {
  try {
    const { age, tone, language } = c.req.query();
    
    // Validate parameters
    const validationError = validateLessonParams({ age, tone, language });
    if (validationError) {
      return c.json({ error: validationError }, 400);
    }

    // Generate lesson ID based on today's date and parameters
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const lessonId = `daily_lesson_${today}_${age}_${tone}_${language}`;
    
    // Check if lesson already exists in database
    let lesson = await getLessonFromDB(c.env.DB, lessonId);
    
    if (!lesson) {
      // Generate new lesson
      lesson = await generateDailyLesson({
        age: parseInt(age),
        tone,
        language,
        lessonId
      });
      
      // Store in database
      await storeLessonInDB(c.env.DB, lesson);
    }

    return c.json(lesson);
    
  } catch (error) {
    console.error('Daily lesson error:', error);
    return c.json({
      error: {
        code: 'internal_error',
        message: 'Failed to generate lesson',
        type: 'server_error'
      }
    }, 500);
  }
});

// Get lesson by ID endpoint
app.get('/v1/lessons/:lessonId', async (c) => {
  try {
    const lessonId = c.req.param('lessonId');
    const includeMedia = c.req.query('include_media') !== 'false';
    
    const lesson = await getLessonFromDB(c.env.DB, lessonId);
    
    if (!lesson) {
      return c.json({
        error: {
          code: 'lesson_not_found',
          message: `Lesson '${lessonId}' does not exist`,
          type: 'not_found',
          documentation_url: 'https://docs.ilearn.how/api-reference/lesson-by-id'
        }
      }, 404);
    }

    // Remove media URLs if requested
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

// List available lessons endpoint
app.get('/v1/lessons', async (c) => {
  try {
    const { language, tone, age, page = 1, limit = 20 } = c.req.query();
    
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;
    
    const { lessons, total } = await listLessonsFromDB(c.env.DB, {
      language,
      tone,
      age,
      limit: limitNum,
      offset
    });
    
    const totalPages = Math.ceil(total / limitNum);
    
    return c.json({
      data: lessons,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total_pages: totalPages,
        total_items: total
      }
    });
    
  } catch (error) {
    console.error('List lessons error:', error);
    return c.json({
      error: {
        code: 'internal_error',
        message: 'Failed to list lessons',
        type: 'server_error'
      }
    }, 500);
  }
});

// Generate custom lesson endpoint
app.post('/v1/lessons/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { topic, age, tone, language, custom_instructions } = body;
    
    // Validate required parameters
    if (!topic || !age || !tone || !language) {
      return c.json({
        error: {
          code: 'missing_parameters',
          message: 'Required parameters: topic, age, tone, language',
          type: 'validation_error'
        }
      }, 400);
    }

    // Generate unique lesson ID
    const timestamp = Date.now();
    const lessonId = `custom_${topic.replace(/\s+/g, '_').toLowerCase()}_${timestamp}_${age}_${tone}_${language}`;
    
    // Generate lesson
    const lesson = await generateCustomLesson({
      lessonId,
      topic,
      age: parseInt(age),
      tone,
      language,
      customInstructions: custom_instructions
    });
    
    // Store in database
    await storeLessonInDB(c.env.DB, lesson);
    
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

// Webhook endpoint for Heygen video completion
app.post('/v1/webhooks/heygen', async (c) => {
  try {
    const body = await c.req.json();
    const { video_id, status, video_url, lesson_id } = body;
    
    if (status === 'completed' && video_url && lesson_id) {
      // Update lesson with video URL
      await updateLessonVideoURL(c.env.DB, lesson_id, video_url);
      
      // Trigger any follow-up processes
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

// Helper functions
function validateLessonParams({ age, tone, language }) {
  if (!age) {
    return {
      code: 'missing_parameter',
      message: 'Age parameter is required',
      type: 'validation_error'
    };
  }
  
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 2 || ageNum > 102) {
    return {
      code: 'invalid_parameter',
      message: 'Age must be between 2 and 102',
      type: 'validation_error'
    };
  }
  
  if (!['grandmother', 'fun', 'neutral'].includes(tone)) {
    return {
      code: 'invalid_parameter',
      message: 'Tone must be one of: grandmother, fun, neutral',
      type: 'validation_error'
    };
  }
  
  if (!language) {
    return {
      code: 'missing_parameter',
      message: 'Language parameter is required',
      type: 'validation_error'
    };
  }
  
  return null;
}

async function generateDailyLesson({ age, tone, language, lessonId }) {
  // This integrates with your existing lesson DNA generation
  const lessonDNA = await generateLessonDNA({
    topic: getDailyTopic(),
    age,
    tone,
    language,
    format: '3x2x1'
  });
  
  // Create lesson object matching your API spec
  return {
    lesson_id: lessonId,
    lesson_metadata: {
      title: lessonDNA.title,
      age_target: age,
      tone: tone,
      language: language,
      duration: lessonDNA.estimated_duration,
      complexity: getComplexityForAge(age),
      cultural_context: getCulturalContext(language),
      date: new Date().toISOString().split('T')[0],
      category: lessonDNA.category,
      subject: lessonDNA.subject
    },
    scripts: lessonDNA.scripts,
    audio_url: null, // Will be populated after generation
    video_url: null, // Will be populated after generation
    production_notes: {
      voice_personality: `${tone}_adapted_for_age_${age}`,
      cultural_adaptations: getCulturalContext(language),
      quality_score: 0.95,
      generated_at: new Date().toISOString()
    }
  };
}

async function generateCustomLesson({ lessonId, topic, age, tone, language, customInstructions }) {
  const lessonDNA = await generateLessonDNA({
    topic,
    age,
    tone,
    language,
    format: '3x2x1',
    customInstructions
  });
  
  return {
    lesson_id: lessonId,
    lesson_metadata: {
      title: lessonDNA.title,
      age_target: age,
      tone: tone,
      language: language,
      duration: lessonDNA.estimated_duration,
      complexity: getComplexityForAge(age),
      cultural_context: getCulturalContext(language),
      date: new Date().toISOString().split('T')[0],
      category: 'custom',
      subject: topic
    },
    scripts: lessonDNA.scripts,
    audio_url: null,
    video_url: null,
    production_notes: {
      voice_personality: `${tone}_adapted_for_age_${age}`,
      cultural_adaptations: getCulturalContext(language),
      quality_score: 0.95,
      generated_at: new Date().toISOString(),
      custom_instructions: customInstructions
    }
  };
}

// Database functions (Cloudflare D1)
async function getLessonFromDB(db, lessonId) {
  const result = await db.prepare(`
    SELECT * FROM lessons WHERE lesson_id = ?
  `).bind(lessonId).first();
  
  if (!result) return null;
  
  return {
    lesson_id: result.lesson_id,
    lesson_metadata: JSON.parse(result.metadata),
    scripts: JSON.parse(result.scripts),
    audio_url: result.audio_url,
    video_url: result.video_url,
    production_notes: JSON.parse(result.production_notes)
  };
}

async function storeLessonInDB(db, lesson) {
  await db.prepare(`
    INSERT INTO lessons (
      lesson_id, metadata, scripts, audio_url, video_url, 
      production_notes, created_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    lesson.lesson_id,
    JSON.stringify(lesson.lesson_metadata),
    JSON.stringify(lesson.scripts),
    lesson.audio_url,
    lesson.video_url,
    JSON.stringify(lesson.production_notes),
    new Date().toISOString(),
    'generated'
  ).run();
}

async function listLessonsFromDB(db, { language, tone, age, limit, offset }) {
  let query = `SELECT lesson_id, metadata, created_at FROM lessons WHERE 1=1`;
  const params = [];
  
  if (language) {
    query += ` AND JSON_EXTRACT(metadata, '$.language') = ?`;
    params.push(language);
  }
  
  if (tone) {
    query += ` AND JSON_EXTRACT(metadata, '$.tone') = ?`;
    params.push(tone);
  }
  
  if (age) {
    query += ` AND JSON_EXTRACT(metadata, '$.age_target') = ?`;
    params.push(parseInt(age));
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const results = await db.prepare(query).bind(...params).all();
  
  const lessons = results.results.map(row => ({
    lesson_id: row.lesson_id,
    title: JSON.parse(row.metadata).title,
    age_target: JSON.parse(row.metadata).age_target,
    tone: JSON.parse(row.metadata).tone,
    language: JSON.parse(row.metadata).language,
    date: JSON.parse(row.metadata).date
  }));
  
  // Get total count
  const countQuery = query.replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '');
  const countResult = await db.prepare(`SELECT COUNT(*) as total FROM (${countQuery.replace('SELECT lesson_id, metadata, created_at', 'SELECT 1')})`).bind(...params.slice(0, -2)).first();
  
  return {
    lessons,
    total: countResult.total
  };
}

async function updateLessonVideoURL(db, lessonId, videoUrl) {
  await db.prepare(`
    UPDATE lessons SET video_url = ?, status = 'ready' WHERE lesson_id = ?
  `).bind(videoUrl, lessonId).run();
}

// Utility functions
function getDailyTopic() {
  // Return today's topic from your 366 topics
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  // You would implement this to return the appropriate topic
  return `Topic ${dayOfYear}`;
}

function getComplexityForAge(age) {
  if (age <= 8) return 'Foundation';
  if (age <= 16) return 'Intermediate';
  if (age <= 25) return 'Advanced';
  return 'Expert';
}

function getCulturalContext(language) {
  const contexts = {
    'english': 'individualistic_direct',
    'spanish': 'collectivistic_warm',
    'french': 'formal_nuanced',
    'german': 'structured_precise'
  };
  return contexts[language] || 'neutral';
}

// Your existing lesson DNA generation function would go here
async function generateLessonDNA({ topic, age, tone, language, format, customInstructions }) {
  // This would integrate with your existing lesson generation pipeline
  // For now, returning a mock structure
  return {
    title: `Learning about ${topic}`,
    estimated_duration: '5 minutes',
    category: 'general',
    subject: topic,
    scripts: [
      {
        script_number: 1,
        type: 'intro_question1',
        voice_text: `Today we're going to explore ${topic}...`,
        on_screen_text: topic,
        timing_notes: `${tone}_engaging_pace`
      }
    ]
  };
}

export default app;

// Deployment commands:
// 1. npm install hono
// 2. wrangler publish
// 3. Set up environment variables:
//    - DB (Cloudflare D1 database)
//    - KV (Cloudflare KV namespace for rate limiting)
//    - WEBHOOK_QUEUE (Cloudflare Queue for webhooks)