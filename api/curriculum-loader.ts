interface DailyTopic {
  day: number;
  date: string;
  title: string;
  learning_objective: string;
}

interface MonthlyCurriculum {
  month: string;
  days: DailyTopic[];
}

export class CurriculumLoader {
  private curriculumCache: Map<string, MonthlyCurriculum> = new Map();

  async loadDailyTopic(dayOfYear: number): Promise<DailyTopic | null> {
    try {
      // Determine which month file to load
      const monthFile = this.getMonthFile(dayOfYear);
      
      if (!monthFile) {
        throw new Error(`Invalid day of year: ${dayOfYear}`);
      }

      // Load curriculum if not cached
      if (!this.curriculumCache.has(monthFile)) {
        const curriculum = await this.loadCurriculumFile(monthFile);
        this.curriculumCache.set(monthFile, curriculum);
      }

      const curriculum = this.curriculumCache.get(monthFile)!;
      
      // Find the specific day
      const topic = curriculum.days.find(day => day.day === dayOfYear);
      
      if (!topic) {
        throw new Error(`Topic not found for day ${dayOfYear}`);
      }

      return topic;
    } catch (error) {
      console.error(`Error loading daily topic for day ${dayOfYear}:`, error);
      return null;
    }
  }

  private getMonthFile(dayOfYear: number): string | null {
    const monthMap: { [key: number]: string } = {
      1: 'january_curriculum.json',
      32: 'february_curriculum.json',
      60: 'march_curriculum.json',
      91: 'april_curriculum.json',
      121: 'may_curriculum.json',
      152: 'june_curriculum.json',
      182: 'july_curriculum.json',
      213: 'august_curriculum.json',
      244: 'september_curriculum.json',
      274: 'october_curriculum.json',
      305: 'november_curriculum.json',
      335: 'december_curriculum.json'
    };

    // Find the appropriate month file
    for (const [startDay, fileName] of Object.entries(monthMap)) {
      const nextStartDay = Object.keys(monthMap).find(day => 
        parseInt(day) > parseInt(startDay)
      );
      
      const endDay = nextStartDay ? parseInt(nextStartDay) - 1 : 366;
      
      if (dayOfYear >= parseInt(startDay) && dayOfYear <= endDay) {
        return fileName;
      }
    }

    return null;
  }

  private async loadCurriculumFile(fileName: string): Promise<MonthlyCurriculum> {
    try {
      // In a Cloudflare Worker environment, we need to handle file loading differently
      // For now, we'll return a mock structure - in production, you'd load from KV or R2
      const mockCurriculum: MonthlyCurriculum = {
        month: fileName.replace('_curriculum.json', ''),
        days: [
          {
            day: 1,
            date: "January 1",
            title: "The Sun - Our Magnificent Life-Giving Star",
            learning_objective: "Understand how scientific observation and measurement create shared global knowledge."
          }
          // In production, this would load the actual curriculum file
        ]
      };

      return mockCurriculum;
    } catch (error) {
      console.error(`Error loading curriculum file ${fileName}:`, error);
      throw error;
    }
  }

  async getCurriculumForMonth(month: string): Promise<MonthlyCurriculum | null> {
    const fileName = `${month.toLowerCase()}_curriculum.json`;
    
    if (!this.curriculumCache.has(fileName)) {
      const curriculum = await this.loadCurriculumFile(fileName);
      this.curriculumCache.set(fileName, curriculum);
    }

    return this.curriculumCache.get(fileName) || null;
  }

  clearCache(): void {
    this.curriculumCache.clear();
  }
} 