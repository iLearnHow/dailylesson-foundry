import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { UniversalAgeEngine } from './universal-age-engine';
import { loadDailyLessonDNA } from '../api/index';
import * as path from 'path';

interface ServerConfig {
  port: number;
  environment: 'development' | 'staging' | 'production';
  enableCaching: boolean;
  enableCompression: boolean;
  enableRateLimiting: boolean;
  corsOrigins: string[];
  maxAge: number;
}

interface LessonRequest {
  day: number;
  age: number;
  tone: 'fun' | 'grandmother' | 'neutral';
  language: string;
  avatar: 'ken' | 'kelly';
  format: 'text' | 'audio' | 'video';
  quality: 'low' | 'medium' | 'high';
}

interface LessonResponse {
  lesson: any;
  audio?: any;
  video?: any;
  metadata: {
    day: number;
    age: number;
    tone: string;
    language: string;
    avatar: string;
    format: string;
    quality: string;
    generated_at: string;
    cache_hit: boolean;
  };
  next_lesson?: string;
  related_lessons?: string[];
}

class ProductionServer {
  private app: express.Application;
  private config: ServerConfig;
  private ageEngine: UniversalAgeEngine;
  private lessonCache: Map<string, any> = new Map();
  private stats: {
    totalRequests: number;
    cacheHits: number;
    errors: number;
    startTime: number;
  };

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      port: parseInt(process.env.PORT || '3000'),
      environment: (process.env.NODE_ENV as any) || 'development',
      enableCaching: true,
      enableCompression: true,
      enableRateLimiting: true,
      corsOrigins: ['*'],
      maxAge: 3600,
      ...config
    };

    this.ageEngine = new UniversalAgeEngine();
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      errors: 0,
      startTime: Date.now()
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      }
    }));

    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Compression
    if (this.config.enableCompression) {
      this.app.use(compression());
    }

    // Rate limiting
    if (this.config.enableRateLimiting) {
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        message: {
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false
      });
      this.app.use('/api/', limiter);
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Date.now() - this.stats.startTime,
        environment: this.config.environment,
        timestamp: new Date().toISOString()
      });
    });

    // API routes
    this.app.get('/api/lessons/:day', this.getLesson.bind(this));
    this.app.get('/api/lessons/:day/:age', this.getLessonByAge.bind(this));
    this.app.get('/api/calendar', this.getCalendar.bind(this));
    this.app.get('/api/search', this.searchLessons.bind(this));
    this.app.get('/api/stats', this.getStats.bind(this));
    this.app.get('/api/metadata', this.getMetadata.bind(this));

    // Universal lesson endpoint
    this.app.post('/api/lessons/generate', this.generateLesson.bind(this));

    // Static file serving
    this.app.use('/assets', express.static(path.join(__dirname, '../assets'), {
      maxAge: this.config.maxAge * 1000,
      etag: true,
      lastModified: true
    }));

    // Catch-all for SPA
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  private setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      res.status(404).json({
        error: {
          code: 'not_found',
          message: 'Endpoint not found',
          path: req.path
        }
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', error);
      
      this.stats.errors++;
      
      res.status(500).json({
        error: {
          code: 'internal_error',
          message: this.config.environment === 'production' 
            ? 'Internal server error' 
            : error.message,
          timestamp: new Date().toISOString()
        }
      });
    });
  }

  private async getLesson(req: express.Request, res: express.Response) {
    try {
      this.stats.totalRequests++;
      
      const day = parseInt(req.params.day);
      if (isNaN(day) || day < 1 || day > 365) {
        return res.status(400).json({
          error: {
            code: 'invalid_day',
            message: 'Day must be between 1 and 365'
          }
        });
      }

      const lessonDNA = await loadDailyLessonDNA(day);
      if (!lessonDNA) {
        return res.status(404).json({
          error: {
            code: 'lesson_not_found',
            message: `Lesson not found for day ${day}`
          }
        });
      }

      res.json({
        lesson: lessonDNA,
        metadata: {
          day,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting lesson:', error);
      res.status(500).json({
        error: {
          code: 'server_error',
          message: 'Failed to retrieve lesson'
        }
      });
    }
  }

  private async getLessonByAge(req: express.Request, res: express.Response) {
    try {
      this.stats.totalRequests++;
      
      const day = parseInt(req.params.day);
      const age = parseInt(req.params.age);
      
      if (isNaN(day) || day < 1 || day > 365) {
        return res.status(400).json({
          error: {
            code: 'invalid_day',
            message: 'Day must be between 1 and 365'
          }
        });
      }

      if (isNaN(age) || age < 1 || age > 100) {
        return res.status(400).json({
          error: {
            code: 'invalid_age',
            message: 'Age must be between 1 and 100'
          }
        });
      }

      const cacheKey = `lesson_${day}_${age}`;
      let lesson = this.lessonCache.get(cacheKey);
      let cacheHit = false;

      if (!lesson && this.config.enableCaching) {
        const lessonDNA = await loadDailyLessonDNA(day);
        if (!lessonDNA) {
          return res.status(404).json({
            error: {
              code: 'lesson_not_found',
              message: `Lesson not found for day ${day}`
            }
          });
        }

        lesson = await this.ageEngine.adaptLessonContent(lessonDNA, age);
        this.lessonCache.set(cacheKey, lesson);
      } else if (lesson) {
        cacheHit = true;
        this.stats.cacheHits++;
      }

      res.json({
        lesson,
        metadata: {
          day,
          age,
          generated_at: new Date().toISOString(),
          cache_hit: cacheHit
        }
      });

    } catch (error) {
      console.error('Error getting lesson by age:', error);
      res.status(500).json({
        error: {
          code: 'server_error',
          message: 'Failed to retrieve lesson'
        }
      });
    }
  }

  private async generateLesson(req: express.Request, res: express.Response) {
    try {
      this.stats.totalRequests++;
      
      const request: LessonRequest = req.body;
      
      // Validate request
      const validation = this.validateLessonRequest(request);
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: 'validation_error',
            message: validation.message
          }
        });
      }

      // Load lesson DNA
      const lessonDNA = await loadDailyLessonDNA(request.day);
      if (!lessonDNA) {
        return res.status(404).json({
          error: {
            code: 'lesson_not_found',
            message: `Lesson not found for day ${request.day}`
          }
        });
      }

      // Generate adapted lesson
      const adaptedLesson = await this.ageEngine.adaptLessonContent(lessonDNA, request.age);

      // Build response
      const response: LessonResponse = {
        lesson: adaptedLesson,
        metadata: {
          day: request.day,
          age: request.age,
          tone: request.tone,
          language: request.language,
          avatar: request.avatar,
          format: request.format,
          quality: request.quality,
          generated_at: new Date().toISOString(),
          cache_hit: false
        }
      };

      // Add next lesson info
      const nextDay = request.day === 365 ? 1 : request.day + 1;
      response.next_lesson = `/api/lessons/${nextDay}/${request.age}`;

      // Add related lessons
      response.related_lessons = this.getRelatedLessons(request.day, request.age);

      res.json(response);

    } catch (error) {
      console.error('Error generating lesson:', error);
      res.status(500).json({
        error: {
          code: 'server_error',
          message: 'Failed to generate lesson'
        }
      });
    }
  }

  private async getCalendar(req: express.Request, res: express.Response) {
    try {
      this.stats.totalRequests++;
      
      const calendar = {};
      
      for (let day = 1; day <= 365; day++) {
        const lessonDNA = await loadDailyLessonDNA(day);
        if (lessonDNA) {
          const date = this.getDateFromDayOfYear(day);
          calendar[date] = {
            day,
            date,
            title: lessonDNA.title,
            learning_objective: lessonDNA.learning_objective,
            category: lessonDNA.category,
            tags: lessonDNA.tags || []
          };
        }
      }

      res.json({
        calendar,
        metadata: {
          total_days: Object.keys(calendar).length,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting calendar:', error);
      res.status(500).json({
        error: {
          code: 'server_error',
          message: 'Failed to retrieve calendar'
        }
      });
    }
  }

  private async searchLessons(req: express.Request, res: express.Response) {
    try {
      this.stats.totalRequests++;
      
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: {
            code: 'missing_query',
            message: 'Search query is required'
          }
        });
      }

      const results = [];
      const searchTerm = query.toLowerCase().trim();

      // Search through all lessons
      for (let day = 1; day <= 365; day++) {
        const lessonDNA = await loadDailyLessonDNA(day);
        if (lessonDNA) {
          const titleMatch = lessonDNA.title.toLowerCase().includes(searchTerm);
          const objectiveMatch = lessonDNA.learning_objective.toLowerCase().includes(searchTerm);
          const tagMatch = lessonDNA.tags && lessonDNA.tags.some((tag: string) => 
            tag.toLowerCase().includes(searchTerm)
          );

          if (titleMatch || objectiveMatch || tagMatch) {
            results.push({
              day,
              title: lessonDNA.title,
              learning_objective: lessonDNA.learning_objective,
              category: lessonDNA.category,
              tags: lessonDNA.tags || [],
              url: `/api/lessons/${day}`
            });
          }
        }
      }

      res.json({
        query: searchTerm,
        results: results.slice(0, 50), // Limit to 50 results
        total_results: results.length,
        metadata: {
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error searching lessons:', error);
      res.status(500).json({
        error: {
          code: 'server_error',
          message: 'Failed to search lessons'
        }
      });
    }
  }

  private getStats(req: express.Request, res: express.Response) {
    const uptime = Date.now() - this.stats.startTime;
    const cacheHitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2)
      : '0.00';

    res.json({
      stats: {
        total_requests: this.stats.totalRequests,
        cache_hits: this.stats.cacheHits,
        cache_hit_rate: `${cacheHitRate}%`,
        errors: this.stats.errors,
        uptime_ms: uptime,
        uptime_formatted: this.formatUptime(uptime)
      },
      config: {
        environment: this.config.environment,
        port: this.config.port,
        caching_enabled: this.config.enableCaching,
        compression_enabled: this.config.enableCompression,
        rate_limiting_enabled: this.config.enableRateLimiting
      },
      timestamp: new Date().toISOString()
    });
  }

  private getMetadata(req: express.Request, res: express.Response) {
    res.json({
      metadata: {
        name: 'DailyLesson Production Server',
        version: '1.0.0',
        description: 'Universal education server supporting all ages 1-100',
        features: [
          'Universal age support (1-100 years)',
          'Multiple tones (fun, grandmother, neutral)',
          'Avatar switching (Ken & Kelly)',
          'Multiple languages',
          'Offline capability',
          'Global CDN distribution'
        ],
        age_support: {
          min_age: 1,
          max_age: 100,
          cognitive_stages: ['preoperational', 'concrete', 'formal', 'postformal']
        },
        tones: ['fun', 'grandmother', 'neutral'],
        avatars: ['ken', 'kelly'],
        languages: ['english', 'spanish', 'french', 'german', 'chinese'],
        total_lessons: 365,
        generated_at: new Date().toISOString()
      }
    });
  }

  private validateLessonRequest(request: LessonRequest): { valid: boolean; message?: string } {
    if (!request.day || request.day < 1 || request.day > 365) {
      return { valid: false, message: 'Day must be between 1 and 365' };
    }

    if (!request.age || request.age < 1 || request.age > 100) {
      return { valid: false, message: 'Age must be between 1 and 100' };
    }

    if (!['fun', 'grandmother', 'neutral'].includes(request.tone)) {
      return { valid: false, message: 'Tone must be fun, grandmother, or neutral' };
    }

    if (!['ken', 'kelly'].includes(request.avatar)) {
      return { valid: false, message: 'Avatar must be ken or kelly' };
    }

    if (!['text', 'audio', 'video'].includes(request.format)) {
      return { valid: false, message: 'Format must be text, audio, or video' };
    }

    if (!['low', 'medium', 'high'].includes(request.quality)) {
      return { valid: false, message: 'Quality must be low, medium, or high' };
    }

    return { valid: true };
  }

  private getRelatedLessons(day: number, age: number): string[] {
    const related = [];
    
    // Same age, different days
    for (let i = 1; i <= 5; i++) {
      const relatedDay = day + i;
      if (relatedDay <= 365) {
        related.push(`/api/lessons/${relatedDay}/${age}`);
      }
    }

    // Same day, different ages
    const ageVariations = [age - 5, age - 2, age + 2, age + 5];
    ageVariations.forEach(ageVar => {
      if (ageVar >= 1 && ageVar <= 100 && ageVar !== age) {
        related.push(`/api/lessons/${day}/${ageVar}`);
      }
    });

    return related.slice(0, 10); // Limit to 10 related lessons
  }

  private getDateFromDayOfYear(dayOfYear: number): string {
    const date = new Date(2024, 0, dayOfYear);
    return date.toISOString().split('T')[0];
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  start() {
    this.app.listen(this.config.port, () => {
      console.log('🚀 DailyLesson Production Server Started');
      console.log(`📍 Port: ${this.config.port}`);
      console.log(`🌍 Environment: ${this.config.environment}`);
      console.log(`⚡ Caching: ${this.config.enableCaching ? 'Enabled' : 'Disabled'}`);
      console.log(`🗜️  Compression: ${this.config.enableCompression ? 'Enabled' : 'Disabled'}`);
      console.log(`🛡️  Rate Limiting: ${this.config.enableRateLimiting ? 'Enabled' : 'Disabled'}`);
      console.log(`📊 Health Check: http://localhost:${this.config.port}/health`);
      console.log(`📈 Stats: http://localhost:${this.config.port}/api/stats`);
      console.log('\n🎯 Ready to serve universal education!');
    });
  }
}

export default ProductionServer; 