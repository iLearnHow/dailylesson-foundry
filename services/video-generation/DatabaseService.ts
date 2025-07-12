import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

export class DatabaseService {
  private db: D1Database | undefined;
  private kv: KVNamespace | undefined;

  constructor(envOrDb: { DB?: D1Database; KV?: KVNamespace } | D1Database) {
    if (typeof envOrDb === 'object' && 'DB' in envOrDb && 'KV' in envOrDb) {
      this.db = envOrDb.DB;
      this.kv = envOrDb.KV;
    } else {
      this.db = envOrDb as D1Database;
      this.kv = undefined;
    }
  }

  private lessonKey(lessonId: string) {
    return `lesson:${lessonId}`;
  }
  private lessonDNAKey(lessonId: string) {
    return `lessonDNA:${lessonId}`;
  }

  async getLesson(lessonId: string) {
    if (this.kv) {
      const data = await this.kv.get(this.lessonKey(lessonId), 'json');
      return data;
    }
    // fallback stub for D1
    return {
      lesson_id: lessonId,
      lesson_metadata: {},
      scripts: [],
      audio_url: null,
      video_url: null,
      production_notes: {}
    };
  }

  async saveLesson(lesson: any) {
    if (this.kv) {
      await this.kv.put(this.lessonKey(lesson.lesson_id), JSON.stringify(lesson));
      return true;
    }
    return true;
  }

  async updateLessonVideo(lessonId: string, videoUrl: string) {
    if (this.kv) {
      const lesson = await this.getLesson(lessonId) as any;
      if (lesson) {
        lesson.video_url = videoUrl;
        await this.saveLesson(lesson);
        return true;
      }
      return false;
    }
    return true;
  }

  async getLessonDNA(lessonId: string) {
    if (this.kv) {
      const data = await this.kv.get(this.lessonDNAKey(lessonId), 'json');
      return data;
    }
    return {};
  }

  async saveLessonDNA(lessonDNA: any) {
    if (this.kv && lessonDNA && lessonDNA.lesson_id) {
      await this.kv.put(this.lessonDNAKey(lessonDNA.lesson_id), JSON.stringify(lessonDNA));
      return true;
    }
    return true;
  }

  async logAPIUsage(data: any) { return true; }
  async getUsageAnalytics(params: any) { return []; }
} 