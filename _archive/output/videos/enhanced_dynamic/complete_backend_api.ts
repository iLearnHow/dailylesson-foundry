// services/api/src/index.ts - Main Cloudflare Worker
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { UniversalLessonOrchestrator } from './orchestrator/UniversalLessonOrchestrator';
import { VideoGenerationService } from './services/VideoGenerationService';
import { DatabaseService } from './services/DatabaseService';
import { AuthService } from './services/AuthService';
import { RateLimitService } from './services/RateLimitService';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  HEYGEN_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  WEBHOOK_QUEUE: Queue;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://dailylesson.org', 'https://mynextlesson.org', 'https://ilearn.how', 'https://cms.ilearn.how'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize services
app.use('/v1/*', async (c, next) => {
  // Initialize services and attach to context
  c.set('orchestrator', new UniversalLessonOrchestrator());
  c.set('videoService', new VideoGenerationService(c.env));
  c.set('database', new DatabaseService(c.env.DB));
  c.set('auth', new AuthService(c.env.DB));
  c.set('rateLimit', new RateLimitService(c.env.KV));
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
  const auth = c.get('auth') as AuthService;
  
  try {
    const keyData = await auth.validateAPIKey(apiKey);
    c.set('apiKeyData', keyData);
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
  const keyData = c.get('apiKeyData');
  const rateLimit = c.get('rateLimit') as RateLimitService;
  
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

    const orchestrator = c.get('orchestrator') as UniversalLessonOrchestrator;
    const database = c.get('database') as DatabaseService;
    
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
      
      // Queue video generation if not exists
      const videoService = c.get('videoService') as VideoGenerationService;
      await videoService.queueVideoGeneration(lesson, { age: parseInt(age), tone, language });
    }

    // Remove media URLs if not requested
    if (include_media === 'false') {
      delete lesson.audio_url;
      delete lesson.video_url;
    }

    // Log usage
    await database.logAPIUsage({
      key_id: c.get('apiKeyData').key_id,
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
    
    await c.get('database').logAPIUsage({
      key_id: c.get('apiKeyData').key_id,
      endpoint: '/v1/daily-lesson',
      method: 'GET',
      status_code: 500,
      response_time_ms: Date.now() - startTime,
      request_timestamp: new Date().toISOString(),
      error_message: error.message
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
    
    const database = c.get('database') as DatabaseService;
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

    const orchestrator = c.get('orchestrator') as UniversalLessonOrchestrator;
    const database = c.get('database') as DatabaseService;
    
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
    const videoService = c.get('videoService') as VideoGenerationService;
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
  const database = c.get('database') as DatabaseService;
  
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
    const database = c.get('database') as DatabaseService;
    
    await database.saveLessonDNA(lessonDNA);
    return c.json({ success: true, lesson_id: lessonDNA.lesson_id }, 201);
  } catch (error) {
    return c.json({ error: { code: 'save_failed', message: error.message } }, 500);
  }
});

app.post('/v1/cms/generate-videos', async (c) => {
  try {
    const { lesson_id, variations } = await c.req.json();
    const videoService = c.get('videoService') as VideoGenerationService;
    const database = c.get('database') as DatabaseService;
    
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
      const database = c.get('database') as DatabaseService;
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
    const database = c.get('database') as DatabaseService;
    
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

async function loadDailyLessonDNA(dayOfYear: number) {
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

// services/api/src/services/DatabaseService.ts
export class DatabaseService {
  constructor(private db: D1Database) {}

  async getLesson(lessonId: string) {
    const result = await this.db.prepare(`
      SELECT * FROM lessons WHERE lesson_id = ?
    `).bind(lessonId).first();
    
    if (!result) return null;
    
    return {
      lesson_id: result.lesson_id,
      lesson_metadata: JSON.parse(result.metadata),
      scripts: JSON.parse(result.scripts),
      audio_url: result.audio_url,
      video_url: result.video_url,
      production_notes: JSON.parse(result.production_notes || '{}')
    };
  }

  async saveLesson(lesson: any) {
    await this.db.prepare(`
      INSERT OR REPLACE INTO lessons (
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

  async updateLessonVideo(lessonId: string, videoUrl: string) {
    await this.db.prepare(`
      UPDATE lessons SET video_url = ?, status = 'ready' WHERE lesson_id = ?
    `).bind(videoUrl, lessonId).run();
  }

  async getLessonDNA(lessonId: string) {
    const result = await this.db.prepare(`
      SELECT * FROM lesson_dna WHERE lesson_id = ?
    `).bind(lessonId).first();
    
    return result ? JSON.parse(result.dna_content) : null;
  }

  async saveLessonDNA(lessonDNA: any) {
    await this.db.prepare(`
      INSERT OR REPLACE INTO lesson_dna (
        lesson_id, dna_content, created_at, updated_at
      ) VALUES (?, ?, ?, ?)
    `).bind(
      lessonDNA.lesson_id,
      JSON.stringify(lessonDNA),
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
  }

  async logAPIUsage(usage: any) {
    await this.db.prepare(`
      INSERT INTO api_usage (
        key_id, endpoint, method, status_code, response_time_ms,
        request_timestamp, request_ip, user_agent, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      usage.key_id,
      usage.endpoint,
      usage.method,
      usage.status_code,
      usage.response_time_ms,
      usage.request_timestamp,
      usage.request_ip,
      usage.user_agent,
      usage.error_message || null
    ).run();
  }

  async getUsageAnalytics(params: { startDate?: string; endDate?: string; keyId?: string }) {
    let query = `
      SELECT 
        DATE(request_timestamp) as date,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests,
        AVG(response_time_ms) as avg_response_time
      FROM api_usage 
      WHERE 1=1
    `;
    
    const bindings = [];
    
    if (params.startDate) {
      query += ` AND DATE(request_timestamp) >= ?`;
      bindings.push(params.startDate);
    }
    
    if (params.endDate) {
      query += ` AND DATE(request_timestamp) <= ?`;
      bindings.push(params.endDate);
    }
    
    if (params.keyId) {
      query += ` AND key_id = ?`;
      bindings.push(params.keyId);
    }
    
    query += ` GROUP BY DATE(request_timestamp) ORDER BY date DESC`;
    
    const results = await this.db.prepare(query).bind(...bindings).all();
    return results.results;
  }
}

// services/api/src/services/VideoGenerationService.ts
export class VideoGenerationService {
  constructor(private env: any) {}

  async queueVideoGeneration(lesson: any, variation: { age: number; tone: string; language: string }) {
    const queueId = `${lesson.lesson_id}_${variation.age}_${variation.tone}_${variation.language}`;
    
    try {
      // Add to video generation queue
      await this.env.WEBHOOK_QUEUE.send({
        type: 'video.generate',
        queue_id: queueId,
        lesson_id: lesson.lesson_id,
        scripts: lesson.scripts,
        variation,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        queue_id: queueId,
        estimated_completion: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      };
    } catch (error) {
      console.error('Failed to queue video generation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateVideo(lesson: any, variation: any) {
    // This would integrate with HeyGen API
    const heygenResponse = await this.callHeyGenAPI(lesson, variation);
    return heygenResponse;
  }

  private async callHeyGenAPI(lesson: any, variation: any) {
    // Implementation would go here
    // For now, returning a mock response
    return {
      video_id: `heygen_${Date.now()}`,
      status: 'processing',
      estimated_duration: 600 // 10 minutes
    };
  }
}

// services/api/src/services/AuthService.ts
export class AuthService {
  constructor(private db: D1Database) {}

  async validateAPIKey(apiKey: string) {
    const keyHash = await this.hashAPIKey(apiKey);
    
    const result = await this.db.prepare(`
      SELECT * FROM api_keys 
      WHERE key_hash = ? AND is_active = true
    `).bind(keyHash).first();
    
    if (!result) {
      throw new Error('Invalid API key');
    }
    
    // Update last used timestamp
    await this.db.prepare(`
      UPDATE api_keys SET last_used_at = ? WHERE key_id = ?
    `).bind(new Date().toISOString(), result.key_id).run();
    
    return result;
  }

  private async hashAPIKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// services/api/src/services/RateLimitService.ts
export class RateLimitService {
  constructor(private kv: KVNamespace) {}

  async checkRateLimit(keyId: string, limit: number): Promise<boolean> {
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const rateLimitKey = `rate_limit:${keyId}:${currentHour}`;
    
    const current = await this.kv.get(rateLimitKey);
    const requests = current ? parseInt(current) : 0;
    
    if (requests >= limit) {
      return false;
    }
    
    await this.kv.put(rateLimitKey, (requests + 1).toString(), {
      expirationTtl: 3600 // 1 hour
    });
    
    return true;
  }
}