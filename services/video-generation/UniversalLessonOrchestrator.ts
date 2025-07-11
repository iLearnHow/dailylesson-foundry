import { UniversalLessonOrchestrator as JSOrchestrator } from '../../main_orchestrator.js';

export class UniversalLessonOrchestrator {
  private jsOrchestrator: any;

  constructor() {
    // Initialize the JavaScript orchestrator
    this.jsOrchestrator = new JSOrchestrator({
      contentDnaPath: './content-dna',
      outputPath: './generated-lessons',
      cacheEnabled: true,
      qualityThreshold: 0.85,
      maxConcurrentGenerations: 3,
      logLevel: 'info'
    });
  }

  async generateLesson(
    lessonId: string, 
    age: number, 
    tone: 'grandmother' | 'fun' | 'neutral', 
    language: string = 'english', 
    options: any = {}
  ): Promise<any> {
    try {
      const lesson = await this.jsOrchestrator.generateLesson(
        lessonId,
        age,
        tone,
        language,
        options
      );

      return {
        lesson_metadata: lesson.lesson_metadata || {},
        scripts: lesson.scripts || [],
        production_notes: lesson.production_notes || {}
      };
    } catch (error) {
      console.error('Error generating lesson:', error);
      throw error;
    }
  }

  async generateLessonBatch(requests: any[], options: any = {}): Promise<any> {
    return await this.jsOrchestrator.generateLessonBatch(requests, options);
  }

  async getSystemHealth(): Promise<any> {
    return await this.jsOrchestrator.getSystemHealth();
  }

  async getPerformanceStats(): Promise<any> {
    return await this.jsOrchestrator.getPerformanceStats();
  }
} 