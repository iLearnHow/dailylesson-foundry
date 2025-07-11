import * as fs from 'fs/promises';
import * as path from 'path';

interface LessonIndex {
  lesson_id: string;
  day_of_year: number;
  date: string;
  title: string;
  age_target: number;
  tone: string;
  language: string;
  category: string;
  subject: string;
  complexity_level: string;
  tags: string[];
  file_path: string;
}

interface SearchIndex {
  by_day: { [key: number]: LessonIndex[] };
  by_age: { [key: number]: LessonIndex[] };
  by_tone: { [key: string]: LessonIndex[] };
  by_language: { [key: string]: LessonIndex[] };
  by_category: { [key: string]: LessonIndex[] };
  by_subject: { [key: string]: LessonIndex[] };
  by_complexity: { [key: string]: LessonIndex[] };
  all_lessons: LessonIndex[];
  metadata: {
    total_lessons: number;
    total_days: number;
    ages: number[];
    tones: string[];
    languages: string[];
    categories: string[];
    subjects: string[];
    complexity_levels: string[];
    generated_at: string;
  };
}

class OfflineIndexBuilder {
  private lessonsDir: string;
  private indexDir: string;
  private searchIndex: SearchIndex;

  constructor(lessonsDir: string = './offline-lessons/lessons', indexDir: string = './offline-lessons/index') {
    this.lessonsDir = lessonsDir;
    this.indexDir = indexDir;
    this.searchIndex = {
      by_day: {},
      by_age: {},
      by_tone: {},
      by_language: {},
      by_category: {},
      by_subject: {},
      by_complexity: {},
      all_lessons: [],
      metadata: {
        total_lessons: 0,
        total_days: 0,
        ages: [],
        tones: [],
        languages: [],
        categories: [],
        subjects: [],
        complexity_levels: [],
        generated_at: new Date().toISOString()
      }
    };
  }

  async buildIndexes() {
    console.log('🔍 Building offline lesson indexes...');
    
    try {
      // Read all lesson files
      const lessonFiles = await this.getLessonFiles();
      console.log(`📁 Found ${lessonFiles.length} lesson files`);
      
      // Process each lesson file
      for (const file of lessonFiles) {
        await this.processLessonFile(file);
      }
      
      // Build metadata
      this.buildMetadata();
      
      // Save indexes
      await this.saveIndexes();
      
      // Generate additional indexes
      await this.generateDayIndex();
      await this.generateCalendarIndex();
      await this.generateSearchIndex();
      
      console.log('✅ Index building complete!');
      this.printIndexSummary();
      
    } catch (error) {
      console.error('❌ Error building indexes:', error);
      throw error;
    }
  }

  private async getLessonFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.lessonsDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error(`❌ Error reading lessons directory: ${this.lessonsDir}`, error);
      return [];
    }
  }

  private async processLessonFile(filename: string) {
    try {
      const filepath = path.join(this.lessonsDir, filename);
      const content = await fs.readFile(filepath, 'utf8');
      const lesson = JSON.parse(content);
      
      // Extract lesson index data
      const lessonIndex: LessonIndex = {
        lesson_id: lesson.lesson_id,
        day_of_year: lesson.lesson_metadata.day,
        date: lesson.lesson_metadata.date,
        title: lesson.lesson_metadata.title,
        age_target: lesson.lesson_metadata.age_target,
        tone: lesson.lesson_metadata.tone,
        language: lesson.lesson_metadata.language,
        category: lesson.lesson_metadata.category || 'general',
        subject: lesson.lesson_metadata.subject || 'general',
        complexity_level: lesson.lesson_metadata.complexity_level || 'intermediate',
        tags: lesson.lesson_metadata.tags || [],
        file_path: filename
      };
      
      // Add to main index
      this.searchIndex.all_lessons.push(lessonIndex);
      
      // Add to category indexes
      this.addToCategoryIndex(lessonIndex, 'by_day', lessonIndex.day_of_year);
      this.addToCategoryIndex(lessonIndex, 'by_age', lessonIndex.age_target);
      this.addToCategoryIndex(lessonIndex, 'by_tone', lessonIndex.tone);
      this.addToCategoryIndex(lessonIndex, 'by_language', lessonIndex.language);
      this.addToCategoryIndex(lessonIndex, 'by_category', lessonIndex.category);
      this.addToCategoryIndex(lessonIndex, 'by_subject', lessonIndex.subject);
      this.addToCategoryIndex(lessonIndex, 'by_complexity', lessonIndex.complexity_level);
      
    } catch (error) {
      console.error(`❌ Error processing lesson file ${filename}:`, error);
    }
  }

  private addToCategoryIndex(lessonIndex: LessonIndex, categoryKey: keyof SearchIndex, categoryValue: string | number) {
    const categoryIndex = this.searchIndex[categoryKey] as any;
    if (!categoryIndex[categoryValue]) {
      categoryIndex[categoryValue] = [];
    }
    categoryIndex[categoryValue].push(lessonIndex);
  }

  private buildMetadata() {
    const lessons = this.searchIndex.all_lessons;
    
    this.searchIndex.metadata = {
      total_lessons: lessons.length,
      total_days: new Set(lessons.map(l => l.day_of_year)).size,
      ages: [...new Set(lessons.map(l => l.age_target))].sort((a, b) => a - b),
      tones: [...new Set(lessons.map(l => l.tone))].sort(),
      languages: [...new Set(lessons.map(l => l.language))].sort(),
      categories: [...new Set(lessons.map(l => l.category))].sort(),
      subjects: [...new Set(lessons.map(l => l.subject))].sort(),
      complexity_levels: [...new Set(lessons.map(l => l.complexity_level))].sort(),
      generated_at: new Date().toISOString()
    };
  }

  private async saveIndexes() {
    // Save main search index
    const searchIndexFile = path.join(this.indexDir, 'search-index.json');
    await fs.writeFile(searchIndexFile, JSON.stringify(this.searchIndex, null, 2), 'utf8');
    
    // Save individual category indexes for faster access
    const categories = ['by_day', 'by_age', 'by_tone', 'by_language', 'by_category', 'by_subject', 'by_complexity'];
    
    for (const category of categories) {
      const categoryFile = path.join(this.indexDir, `${category}-index.json`);
      await fs.writeFile(categoryFile, JSON.stringify(this.searchIndex[category as keyof SearchIndex], null, 2), 'utf8');
    }
    
    // Save metadata
    const metadataFile = path.join(this.indexDir, 'metadata.json');
    await fs.writeFile(metadataFile, JSON.stringify(this.searchIndex.metadata, null, 2), 'utf8');
  }

  private async generateDayIndex() {
    console.log('📅 Generating day index...');
    
    const dayIndex: { [key: number]: any } = {};
    
    for (let day = 1; day <= 365; day++) {
      const dayLessons = this.searchIndex.by_day[day] || [];
      if (dayLessons.length > 0) {
        dayIndex[day] = {
          day_of_year: day,
          date: this.getDateFromDayOfYear(day),
          total_variations: dayLessons.length,
          variations: dayLessons.map((lesson: LessonIndex) => ({
            lesson_id: lesson.lesson_id,
            age_target: lesson.age_target,
            tone: lesson.tone,
            language: lesson.language,
            title: lesson.title,
            file_path: lesson.file_path
          }))
        };
      }
    }
    
    const dayIndexFile = path.join(this.indexDir, 'day-index.json');
    await fs.writeFile(dayIndexFile, JSON.stringify(dayIndex, null, 2), 'utf8');
  }

  private async generateCalendarIndex() {
    console.log('📆 Generating calendar index...');
    
    const calendarIndex: { [key: string]: any } = {};
    
    for (let day = 1; day <= 365; day++) {
      const date = this.getDateFromDayOfYear(day);
      const dayLessons = this.searchIndex.by_day[day] || [];
      
      if (dayLessons.length > 0) {
        // Get the first lesson to extract common metadata
        const firstLesson = dayLessons[0];
        calendarIndex[date] = {
          day_of_year: day,
          date: date,
          title: firstLesson.title,
          category: firstLesson.category,
          subject: firstLesson.subject,
          complexity_level: firstLesson.complexity_level,
          total_variations: dayLessons.length,
          available_ages: [...new Set(dayLessons.map((l: LessonIndex) => l.age_target))].sort((a, b) => a - b),
          available_tones: [...new Set(dayLessons.map((l: LessonIndex) => l.tone))].sort(),
          available_languages: [...new Set(dayLessons.map((l: LessonIndex) => l.language))].sort(),
          lesson_ids: dayLessons.map((l: LessonIndex) => l.lesson_id)
        };
      }
    }
    
    const calendarIndexFile = path.join(this.indexDir, 'calendar-index.json');
    await fs.writeFile(calendarIndexFile, JSON.stringify(calendarIndex, null, 2), 'utf8');
  }

  private async generateSearchIndex() {
    console.log('🔍 Generating full-text search index...');
    
    const searchIndex: { [key: string]: string[] } = {};
    
    for (const lesson of this.searchIndex.all_lessons) {
      // Index by title words
      const titleWords = lesson.title.toLowerCase().split(/\s+/);
      for (const word of titleWords) {
        if (word.length > 2) { // Skip short words
          if (!searchIndex[word]) searchIndex[word] = [];
          searchIndex[word].push(lesson.lesson_id);
        }
      }
      
      // Index by subject
      const subjectWords = lesson.subject.toLowerCase().split(/\s+/);
      for (const word of subjectWords) {
        if (word.length > 2) {
          if (!searchIndex[word]) searchIndex[word] = [];
          searchIndex[word].push(lesson.lesson_id);
        }
      }
      
      // Index by tags
      for (const tag of lesson.tags) {
        const tagWords = tag.toLowerCase().split(/\s+/);
        for (const word of tagWords) {
          if (word.length > 2) {
            if (!searchIndex[word]) searchIndex[word] = [];
            searchIndex[word].push(lesson.lesson_id);
          }
        }
      }
    }
    
    const searchIndexFile = path.join(this.indexDir, 'fulltext-search-index.json');
    await fs.writeFile(searchIndexFile, JSON.stringify(searchIndex, null, 2), 'utf8');
  }

  private getDateFromDayOfYear(dayOfYear: number): string {
    const date = new Date(2024, 0, dayOfYear); // Using 2024 as base year
    return date.toISOString().split('T')[0];
  }

  private printIndexSummary() {
    const metadata = this.searchIndex.metadata;
    
    console.log('\n📊 INDEX BUILDING SUMMARY');
    console.log('==========================');
    console.log(`📚 Total lessons indexed: ${metadata.total_lessons.toLocaleString()}`);
    console.log(`📅 Days covered: ${metadata.total_days}/365`);
    console.log(`👥 Age groups: ${metadata.ages.join(', ')}`);
    console.log(`🎭 Tones: ${metadata.tones.join(', ')}`);
    console.log(`🌍 Languages: ${metadata.languages.join(', ')}`);
    console.log(`📂 Categories: ${metadata.categories.length}`);
    console.log(`🔬 Subjects: ${metadata.subjects.length}`);
    console.log(`📈 Complexity levels: ${metadata.complexity_levels.join(', ')}`);
    console.log(`📁 Index files created in: ${this.indexDir}`);
  }
}

// Main execution function
async function main() {
  const indexBuilder = new OfflineIndexBuilder();
  
  try {
    await indexBuilder.buildIndexes();
  } catch (error) {
    console.error('❌ Fatal error during index building:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { OfflineIndexBuilder, main }; 