export class VideoGenerationService {
  constructor(env: any) {}
  async generate() { return {}; }
  async queueVideoGeneration(lesson: any, variation: { age: number; tone: string; language: string }) { return { success: true }; }
  async generateVideo(lesson: any, variation: any) { return { video_id: 'mock', status: 'processing' }; }
} 