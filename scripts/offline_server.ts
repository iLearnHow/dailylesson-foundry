import * as fs from 'fs/promises';
import * as path from 'path';
import * as http from 'http';
import * as url from 'url';

interface ServerConfig {
  port: number;
  lessonsDir: string;
  indexDir: string;
  staticDir?: string;
}

class OfflineLessonServer {
  private config: ServerConfig;
  private searchIndex: any;
  private metadata: any;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  async start() {
    console.log('🚀 Starting offline lesson server...');
    
    try {
      // Load indexes
      await this.loadIndexes();
      
      // Create HTTP server
      const server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });
      
      server.listen(this.config.port, () => {
        console.log(`✅ Server running at http://localhost:${this.config.port}`);
        console.log(`📚 Serving ${this.metadata.total_lessons.toLocaleString()} lessons`);
        console.log(`📅 Days available: ${this.metadata.total_days}/365`);
        console.log('\n📋 Available endpoints:');
        console.log(`  GET / - Server info`);
        console.log(`  GET /lessons - List all lessons`);
        console.log(`  GET /lessons/{lesson_id} - Get specific lesson`);
        console.log(`  GET /days/{day} - Get lessons for specific day`);
        console.log(`  GET /search?q={query} - Search lessons`);
        console.log(`  GET /calendar - Get calendar view`);
        console.log(`  GET /indexes - Get all indexes`);
        console.log('\n🛑 Press Ctrl+C to stop server');
      });
      
    } catch (error) {
      console.error('❌ Error starting server:', error);
      process.exit(1);
    }
  }

  private async loadIndexes() {
    try {
      // Load metadata
      const metadataPath = path.join(this.config.indexDir, 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      this.metadata = JSON.parse(metadataContent);
      
      // Load search index
      const searchIndexPath = path.join(this.config.indexDir, 'search-index.json');
      const searchIndexContent = await fs.readFile(searchIndexPath, 'utf8');
      this.searchIndex = JSON.parse(searchIndexContent);
      
      console.log('✅ Indexes loaded successfully');
    } catch (error) {
      console.error('❌ Error loading indexes:', error);
      throw error;
    }
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname || '';
    const query = parsedUrl.query;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    try {
      if (req.method === 'GET') {
        await this.handleGetRequest(pathname, query, res);
      } else {
        this.sendError(res, 405, 'Method not allowed');
      }
    } catch (error) {
      console.error('❌ Request error:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }

  private async handleGetRequest(pathname: string, query: any, res: http.ServerResponse) {
    // Root endpoint - server info
    if (pathname === '/' || pathname === '') {
      await this.handleRoot(res);
      return;
    }
    
    // Lessons endpoint
    if (pathname.startsWith('/lessons/')) {
      const lessonId = pathname.replace('/lessons/', '');
      await this.handleLessonRequest(lessonId, res);
      return;
    }
    
    // Days endpoint
    if (pathname.startsWith('/days/')) {
      const dayStr = pathname.replace('/days/', '');
      const day = parseInt(dayStr);
      await this.handleDayRequest(day, res);
      return;
    }
    
    // Search endpoint
    if (pathname === '/search') {
      const searchQuery = query.q as string;
      await this.handleSearchRequest(searchQuery, res);
      return;
    }
    
    // Calendar endpoint
    if (pathname === '/calendar') {
      await this.handleCalendarRequest(res);
      return;
    }
    
    // Indexes endpoint
    if (pathname === '/indexes') {
      await this.handleIndexesRequest(res);
      return;
    }
    
    // List all lessons
    if (pathname === '/lessons') {
      await this.handleLessonsList(res);
      return;
    }
    
    // Static files
    if (this.config.staticDir && pathname.startsWith('/static/')) {
      await this.handleStaticFile(pathname, res);
      return;
    }
    
    // Not found
    this.sendError(res, 404, 'Endpoint not found');
  }

  private async handleRoot(res: http.ServerResponse) {
    const info = {
      server: 'DailyLesson Offline Server',
      version: '1.0.0',
      status: 'running',
      metadata: this.metadata,
      endpoints: {
        '/': 'Server information',
        '/lessons': 'List all lessons',
        '/lessons/{lesson_id}': 'Get specific lesson',
        '/days/{day}': 'Get lessons for specific day (1-365)',
        '/search?q={query}': 'Search lessons by title, subject, or tags',
        '/calendar': 'Get calendar view of all days',
        '/indexes': 'Get all search indexes'
      },
      generated_at: new Date().toISOString()
    };
    
    this.sendJson(res, info);
  }

  private async handleLessonRequest(lessonId: string, res: http.ServerResponse) {
    try {
      const lessonPath = path.join(this.config.lessonsDir, `${lessonId}.json`);
      const lessonContent = await fs.readFile(lessonPath, 'utf8');
      const lesson = JSON.parse(lessonContent);
      
      this.sendJson(res, lesson);
    } catch (error) {
      this.sendError(res, 404, `Lesson not found: ${lessonId}`);
    }
  }

  private async handleDayRequest(day: number, res: http.ServerResponse) {
    if (isNaN(day) || day < 1 || day > 365) {
      this.sendError(res, 400, 'Invalid day. Must be between 1 and 365.');
      return;
    }
    
    const dayLessons = this.searchIndex.by_day[day] || [];
    
    const response = {
      day_of_year: day,
      date: this.getDateFromDayOfYear(day),
      total_lessons: dayLessons.length,
      lessons: dayLessons.map((lesson: any) => ({
        lesson_id: lesson.lesson_id,
        title: lesson.title,
        age_target: lesson.age_target,
        tone: lesson.tone,
        language: lesson.language,
        category: lesson.category,
        subject: lesson.subject
      }))
    };
    
    this.sendJson(res, response);
  }

  private async handleSearchRequest(query: string, res: http.ServerResponse) {
    if (!query || query.trim().length === 0) {
      this.sendError(res, 400, 'Search query is required');
      return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results: any[] = [];
    
    // Search in titles, subjects, and tags
    for (const lesson of this.searchIndex.all_lessons) {
      const titleMatch = lesson.title.toLowerCase().includes(searchTerm);
      const subjectMatch = lesson.subject.toLowerCase().includes(searchTerm);
      const tagMatch = lesson.tags.some((tag: string) => 
        tag.toLowerCase().includes(searchTerm)
      );
      
      if (titleMatch || subjectMatch || tagMatch) {
        results.push({
          lesson_id: lesson.lesson_id,
          title: lesson.title,
          age_target: lesson.age_target,
          tone: lesson.tone,
          language: lesson.language,
          category: lesson.category,
          subject: lesson.subject,
          day_of_year: lesson.day_of_year,
          date: lesson.date
        });
      }
    }
    
    const response = {
      query: searchTerm,
      total_results: results.length,
      results: results.slice(0, 100) // Limit to 100 results
    };
    
    this.sendJson(res, response);
  }

  private async handleCalendarRequest(res: http.ServerResponse) {
    try {
      const calendarIndexPath = path.join(this.config.indexDir, 'calendar-index.json');
      const calendarContent = await fs.readFile(calendarIndexPath, 'utf8');
      const calendar = JSON.parse(calendarContent);
      
      this.sendJson(res, calendar);
    } catch (error) {
      this.sendError(res, 500, 'Error loading calendar index');
    }
  }

  private async handleIndexesRequest(res: http.ServerResponse) {
    const indexes = {
      metadata: this.metadata,
      total_lessons: this.searchIndex.all_lessons.length,
      by_day: Object.keys(this.searchIndex.by_day).length,
      by_age: Object.keys(this.searchIndex.by_age).length,
      by_tone: Object.keys(this.searchIndex.by_tone).length,
      by_language: Object.keys(this.searchIndex.by_language).length,
      by_category: Object.keys(this.searchIndex.by_category).length,
      by_subject: Object.keys(this.searchIndex.by_subject).length,
      by_complexity: Object.keys(this.searchIndex.by_complexity).length
    };
    
    this.sendJson(res, indexes);
  }

  private async handleLessonsList(res: http.ServerResponse) {
    const lessons = this.searchIndex.all_lessons.map((lesson: any) => ({
      lesson_id: lesson.lesson_id,
      title: lesson.title,
      day_of_year: lesson.day_of_year,
      date: lesson.date,
      age_target: lesson.age_target,
      tone: lesson.tone,
      language: lesson.language,
      category: lesson.category,
      subject: lesson.subject
    }));
    
    const response = {
      total_lessons: lessons.length,
      lessons: lessons.slice(0, 100) // Limit to 100 for performance
    };
    
    this.sendJson(res, response);
  }

  private async handleStaticFile(pathname: string, res: http.ServerResponse) {
    try {
      const filePath = path.join(this.config.staticDir!, pathname.replace('/static/', ''));
      const content = await fs.readFile(filePath);
      
      // Set appropriate content type
      const ext = path.extname(filePath);
      const contentType = this.getContentType(ext);
      res.setHeader('Content-Type', contentType);
      
      res.writeHead(200);
      res.end(content);
    } catch (error) {
      this.sendError(res, 404, 'Static file not found');
    }
  }

  private getContentType(ext: string): string {
    const contentTypes: { [key: string]: string } = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  private getDateFromDayOfYear(dayOfYear: number): string {
    const date = new Date(2024, 0, dayOfYear);
    return date.toISOString().split('T')[0];
  }

  private sendJson(res: http.ServerResponse, data: any) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(data, null, 2));
  }

  private sendError(res: http.ServerResponse, statusCode: number, message: string) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(statusCode);
    res.end(JSON.stringify({
      error: {
        code: statusCode,
        message: message
      }
    }, null, 2));
  }
}

// Main execution function
async function main() {
  const config: ServerConfig = {
    port: parseInt(process.env.PORT || '3000'),
    lessonsDir: process.env.LESSONS_DIR || './offline-lessons/lessons',
    indexDir: process.env.INDEX_DIR || './offline-lessons/index',
    staticDir: process.env.STATIC_DIR || './offline-lessons/static'
  };
  
  const server = new OfflineLessonServer(config);
  
  try {
    await server.start();
  } catch (error) {
    console.error('❌ Fatal error starting server:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { OfflineLessonServer, main }; 