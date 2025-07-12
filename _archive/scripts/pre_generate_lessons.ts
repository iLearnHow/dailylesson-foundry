import { SimpleOrchestrator } from '../api/simple-orchestrator';
import { DatabaseService } from '../services/video-generation/DatabaseService';
import { loadDailyLessonDNA } from '../api/index';

// These should match the production API's valid options
const validAges = ['5', '12', '25', '45', '75'];
const validTones = ['fun', 'grandmother', 'neutral'];
const validLanguages = ['english', 'spanish', 'french', 'german', 'chinese'];

async function main(env: { KV: any }) {
  const orchestrator = new SimpleOrchestrator();
  const database = new DatabaseService({ KV: env.KV });

  // For now, only generate for July 11 (day 192, acoustics)
  const dayOfYear = 192;
  const lessonDNA = await loadDailyLessonDNA(dayOfYear);
  const dateStr = '2024-07-11';
  const lessonId = lessonDNA.lesson_id;

  let count = 0;
  for (const age of validAges) {
    for (const tone of validTones) {
      for (const language of validLanguages) {
        const variationId = `daily_lesson_${dateStr.replace(/-/g, '')}_${dayOfYear}_${age}_${tone}_${language}`;
        // Check if already exists
        const existing = await database.getLesson(variationId);
        if (existing) {
          console.log(`Already exists: ${variationId}`);
          continue;
        }
        // Generate lesson
        const generatedLesson = await orchestrator.generateLesson(
          lessonId,
          parseInt(age),
          tone,
          language,
          { forceRegenerate: true }
        );
        const lesson = {
          lesson_id: variationId,
          lesson_metadata: {
            ...generatedLesson.lesson_metadata,
            day: dayOfYear,
            date: dateStr,
            age_target: parseInt(age),
            tone,
            language,
            generated_at: new Date().toISOString()
          },
          scripts: generatedLesson.scripts,
          audio_url: null,
          video_url: null,
          production_notes: generatedLesson.production_notes
        };
        await database.saveLesson(lesson);
        count++;
        console.log(`Generated and saved: ${variationId}`);
      }
    }
  }
  console.log(`Done. Total generated: ${count}`);
}

// Cloudflare Workers/Miniflare entry point
if (typeof global !== 'undefined' && (global as any).ENV && (global as any).ENV.KV) {
  main((global as any).ENV).catch(console.error);
}

export { main }; 