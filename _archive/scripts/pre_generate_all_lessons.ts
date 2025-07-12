import { SimpleOrchestrator } from '../api/simple-orchestrator';
import { DatabaseService } from '../services/video-generation/DatabaseService';
import { loadDailyLessonDNA } from '../api/index';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration for all lesson variations
const validAges = ['5', '12', '25', '45', '75'];
const validTones = ['fun', 'grandmother', 'neutral'];
const validLanguages = ['english', 'spanish', 'french', 'german', 'chinese'];

// Total combinations: 365 days × 5 ages × 3 tones × 5 languages = 27,375 lessons
const TOTAL_LESSONS = 365 * validAges.length * validTones.length * validLanguages.length;

interface LessonGenerationResult {
  lesson_id: string;
  day_of_year: number;
  date: string;
  age: string;
  tone: string;
  language: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
  generated_at: string;
}

interface GenerationProgress {
  total: number;
  completed: number;
  successful: number;
  errors: number;
  skipped: number;
  current_day: number;
  start_time: number;
}

class OfflineLessonGenerator {
  private orchestrator: SimpleOrchestrator;
  private database: DatabaseService;
  private outputDir: string;
  private progress: GenerationProgress;
  private results: LessonGenerationResult[] = [];

  constructor(outputDir: string = './offline-lessons') {
    this.orchestrator = new SimpleOrchestrator();
    this.database = new DatabaseService({ KV: {} as any }); // Mock for offline generation
    this.outputDir = outputDir;
    this.progress = {
      total: TOTAL_LESSONS,
      completed: 0,
      successful: 0,
      errors: 0,
      skipped: 0,
      current_day: 1,
      start_time: Date.now()
    };
  }

  async initialize() {
    console.log('🚀 Starting offline lesson generation...');
    console.log(`📊 Total lessons to generate: ${this.progress.total.toLocaleString()}`);
    console.log(`📁 Output directory: ${this.outputDir}`);
    
    // Create output directory structure
    await this.createDirectoryStructure();
    
    // Create progress tracking file
    await this.saveProgress();
  }

  private async createDirectoryStructure() {
    const dirs = [
      this.outputDir,
      `${this.outputDir}/lessons`,
      `${this.outputDir}/metadata`,
      `${this.outputDir}/reports`,
      `${this.outputDir}/index`
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async generateAllLessons() {
    console.log('\n📅 Generating lessons for all 365 days...\n');

    for (let dayOfYear = 1; dayOfYear <= 365; dayOfYear++) {
      this.progress.current_day = dayOfYear;
      
      try {
        console.log(`\n📆 Day ${dayOfYear}/365: Processing...`);
        
        // Load lesson DNA for this day
        const lessonDNA = await loadDailyLessonDNA(dayOfYear);
        if (!lessonDNA) {
          console.log(`⚠️  No lesson DNA found for day ${dayOfYear}, skipping...`);
          this.recordResult(dayOfYear, 'error', `No lesson DNA found for day ${dayOfYear}`);
          continue;
        }

        // Generate date string for this day of year
        const dateStr = this.getDateFromDayOfYear(dayOfYear);
        
        // Generate all variations for this day
        await this.generateDayVariations(dayOfYear, lessonDNA, dateStr);
        
        // Save progress every 10 days
        if (dayOfYear % 10 === 0) {
          await this.saveProgress();
          this.printProgress();
        }

      } catch (error) {
        console.error(`❌ Error processing day ${dayOfYear}:`, error);
        this.recordResult(dayOfYear, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Final save and report
    await this.saveProgress();
    await this.generateFinalReport();
    this.printFinalSummary();
  }

  private async generateDayVariations(dayOfYear: number, lessonDNA: any, dateStr: string) {
    const lessonId = lessonDNA.lesson_id;
    
    for (const age of validAges) {
      for (const tone of validTones) {
        for (const language of validLanguages) {
          const variationId = `daily_lesson_${dateStr.replace(/-/g, '')}_${dayOfYear}_${age}_${tone}_${language}`;
          
          try {
            // Check if already exists
            const existing = await this.database.getLesson(variationId);
            if (existing) {
              console.log(`  ⏭️  Already exists: ${variationId}`);
              this.recordResult(dayOfYear, 'skipped', `Lesson already exists: ${variationId}`);
              this.progress.skipped++;
              this.progress.completed++;
              continue;
            }

            // Generate lesson
            console.log(`  🔄 Generating: ${variationId}`);
            const generatedLesson = await this.orchestrator.generateLesson(
              lessonId,
              parseInt(age),
              tone,
              language,
              { forceRegenerate: true }
            );

            // Create lesson object
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

            // Save to database and file system
            await this.database.saveLesson(lesson);
            await this.saveLessonToFile(lesson);
            
            this.recordResult(dayOfYear, 'success', `Generated successfully: ${variationId}`);
            this.progress.successful++;
            
          } catch (error) {
            console.error(`  ❌ Error generating ${variationId}:`, error);
            this.recordResult(dayOfYear, 'error', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            this.progress.errors++;
          }
          
          this.progress.completed++;
        }
      }
    }
  }

  private async saveLessonToFile(lesson: any) {
    const filename = `${lesson.lesson_id}.json`;
    const filepath = path.join(this.outputDir, 'lessons', filename);
    
    await fs.writeFile(filepath, JSON.stringify(lesson, null, 2), 'utf8');
  }

  private async saveProgress() {
    const progressFile = path.join(this.outputDir, 'metadata', 'generation-progress.json');
    const resultsFile = path.join(this.outputDir, 'metadata', 'generation-results.json');
    
    await fs.writeFile(progressFile, JSON.stringify(this.progress, null, 2), 'utf8');
    await fs.writeFile(resultsFile, JSON.stringify(this.results, null, 2), 'utf8');
  }

  private recordResult(dayOfYear: number, status: 'success' | 'error' | 'skipped', message: string) {
    this.results.push({
      lesson_id: `day_${dayOfYear}`,
      day_of_year: dayOfYear,
      date: this.getDateFromDayOfYear(dayOfYear),
      age: 'all',
      tone: 'all',
      language: 'all',
      status,
      error: status === 'error' ? message : undefined,
      generated_at: new Date().toISOString()
    });
  }

  private getDateFromDayOfYear(dayOfYear: number): string {
    const date = new Date(2024, 0, dayOfYear); // Using 2024 as base year
    return date.toISOString().split('T')[0];
  }

  private printProgress() {
    const elapsed = Date.now() - this.progress.start_time;
    const elapsedMinutes = Math.floor(elapsed / 60000);
    const rate = this.progress.completed / (elapsed / 1000); // lessons per second
    const remaining = this.progress.total - this.progress.completed;
    const etaSeconds = remaining / rate;
    const etaMinutes = Math.floor(etaSeconds / 60);
    
    console.log(`\n📊 Progress: ${this.progress.completed.toLocaleString()}/${this.progress.total.toLocaleString()} (${((this.progress.completed/this.progress.total)*100).toFixed(1)}%)`);
    console.log(`✅ Success: ${this.progress.successful.toLocaleString()}`);
    console.log(`❌ Errors: ${this.progress.errors.toLocaleString()}`);
    console.log(`⏭️  Skipped: ${this.progress.skipped.toLocaleString()}`);
    console.log(`⏱️  Elapsed: ${elapsedMinutes}m | Rate: ${rate.toFixed(1)}/sec | ETA: ${etaMinutes}m`);
  }

  private async generateFinalReport() {
    const report = {
      generation_summary: {
        total_lessons: this.progress.total,
        successful: this.progress.successful,
        errors: this.progress.errors,
        skipped: this.progress.skipped,
        completion_rate: ((this.progress.successful / this.progress.total) * 100).toFixed(2) + '%',
        total_time_minutes: Math.floor((Date.now() - this.progress.start_time) / 60000),
        generated_at: new Date().toISOString()
      },
      configuration: {
        ages: validAges,
        tones: validTones,
        languages: validLanguages,
        total_combinations_per_day: validAges.length * validTones.length * validLanguages.length
      },
      error_summary: this.getErrorSummary(),
      day_summary: this.getDaySummary()
    };

    const reportFile = path.join(this.outputDir, 'reports', 'generation-report.json');
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf8');
  }

  private getErrorSummary() {
    const errors = this.results.filter(r => r.status === 'error');
    const errorCounts: { [key: string]: number } = {};
    
    errors.forEach(error => {
      const errorType = error.error?.split(':')[0] || 'Unknown';
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });
    
    return errorCounts;
  }

  private getDaySummary() {
    const dayStats: { [key: number]: { success: number; errors: number; skipped: number } } = {};
    
    for (let day = 1; day <= 365; day++) {
      const dayResults = this.results.filter(r => r.day_of_year === day);
      dayStats[day] = {
        success: dayResults.filter(r => r.status === 'success').length,
        errors: dayResults.filter(r => r.status === 'error').length,
        skipped: dayResults.filter(r => r.status === 'skipped').length
      };
    }
    
    return dayStats;
  }

  private printFinalSummary() {
    console.log('\n🎉 OFFLINE LESSON GENERATION COMPLETE!');
    console.log('========================================');
    console.log(`📊 Total lessons: ${this.progress.total.toLocaleString()}`);
    console.log(`✅ Successful: ${this.progress.successful.toLocaleString()}`);
    console.log(`❌ Errors: ${this.progress.errors.toLocaleString()}`);
    console.log(`⏭️  Skipped: ${this.progress.skipped.toLocaleString()}`);
    console.log(`📈 Success rate: ${((this.progress.successful / this.progress.total) * 100).toFixed(2)}%`);
    console.log(`⏱️  Total time: ${Math.floor((Date.now() - this.progress.start_time) / 60000)} minutes`);
    console.log(`📁 Output directory: ${this.outputDir}`);
    console.log('\n📋 Files created:');
    console.log(`  📂 ${this.outputDir}/lessons/ - Individual lesson files`);
    console.log(`  📂 ${this.outputDir}/metadata/ - Progress and results`);
    console.log(`  📂 ${this.outputDir}/reports/ - Generation report`);
    console.log(`  📂 ${this.outputDir}/index/ - Search indexes`);
    console.log('\n🚀 Ready for offline deployment!');
  }
}

// Main execution function
async function main() {
  const generator = new OfflineLessonGenerator();
  
  try {
    await generator.initialize();
    await generator.generateAllLessons();
  } catch (error) {
    console.error('❌ Fatal error during generation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { OfflineLessonGenerator, main }; 