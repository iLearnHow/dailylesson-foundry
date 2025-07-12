// Simple ESM-compatible orchestrator for Cloudflare Workers
export class SimpleOrchestrator {
  private cache: Map<string, any>; // Added property declaration
  constructor() {
    this.cache = new Map();
  }

  async generateLesson(lessonId: string, age: number, tone: string, language: string, options: any = {}) {
    const cacheKey = `${lessonId}_${age}_${tone}_${language}`;
    
    if (this.cache.has(cacheKey) && !options.forceRegenerate) {
      return this.cache.get(cacheKey);
    }

    // Load lesson DNA from static data
    const lessonDNA = await this.loadLessonDNA(lessonId);
    
    // Generate lesson using simplified logic
    const lesson = await this.generateSimpleLesson(lessonDNA, age, tone, language);
    
    // Cache the result
    this.cache.set(cacheKey, lesson);
    
    return lesson;
  }

  private async loadLessonDNA(lessonId: string) {
    // For now, return a basic lesson structure
    // In production, this would load from KV or static imports
    return {
      lesson_id: lessonId,
      title: "Daily Lesson",
      core_principle: "Learning through experience",
      age_expressions: {
        youth: {
          concept_name: "Learning",
          complexity_level: "basic",
          attention_span: "5-10 minutes"
        },
        young_adult: {
          concept_name: "Skill Development",
          complexity_level: "intermediate", 
          attention_span: "10-15 minutes"
        },
        midlife: {
          concept_name: "Wisdom Application",
          complexity_level: "advanced",
          attention_span: "15-20 minutes"
        }
      },
      core_lesson_structure: {
        question_1: {
          question: "What did you learn today?",
          option_a: "Something new",
          option_b: "Reinforced existing knowledge"
        }
      }
    };
  }

  private async generateSimpleLesson(lessonDNA: any, age: number, tone: string, language: string) {
    const ageCategory = this.mapAgeToCategory(age);
    const ageExpression = lessonDNA.age_expressions[ageCategory] || lessonDNA.age_expressions.youth;
    
    return {
      lesson_metadata: {
        lesson_id: lessonDNA.lesson_id,
        title: lessonDNA.title,
        age_target: age,
        tone,
        language,
        complexity: ageExpression.complexity_level,
        duration: ageExpression.attention_span,
        generated_at: new Date().toISOString()
      },
      scripts: [
        {
          script_number: 1,
          script_type: "question_setup",
          voice_text: `Hello! Today we're going to explore ${ageExpression.concept_name.toLowerCase()}.`,
          on_screen_text: `Today's Topic: ${ageExpression.concept_name}`,
          avatar: this.selectAvatar(tone)
        },
        {
          script_number: 2,
          script_type: "question",
          voice_text: lessonDNA.core_lesson_structure.question_1.question,
          on_screen_text: lessonDNA.core_lesson_structure.question_1.question,
          avatar: this.selectAvatar(tone)
        },
        {
          script_number: 3,
          script_type: "option_a_response",
          voice_text: "Great choice! Learning something new helps us grow.",
          on_screen_text: "Option A: Something new",
          avatar: this.selectAvatar(tone)
        },
        {
          script_number: 4,
          script_type: "option_b_response", 
          voice_text: "Excellent! Reinforcing what we know builds confidence.",
          on_screen_text: "Option B: Reinforced existing knowledge",
          avatar: this.selectAvatar(tone)
        }
      ],
      production_notes: {
        tone_guidance: this.getToneGuidance(tone),
        age_considerations: this.getAgeConsiderations(age),
        language_notes: `Content in ${language}`
      }
    };
  }

  private mapAgeToCategory(age: number): string {
    if (age <= 17) return 'youth';
    if (age <= 35) return 'young_adult';
    return 'midlife';
  }

  private selectAvatar(tone: string): string {
    switch (tone) {
      case 'fun':
        return 'kelly';
      case 'grandmother':
        return 'kelly';
      case 'neutral':
        return 'ken';
      default:
        return 'kelly';
    }
  }

  private getToneGuidance(tone: string): string {
    switch (tone) {
      case 'fun':
        return 'Use energetic, playful delivery with lots of enthusiasm';
      case 'grandmother':
        return 'Use warm, nurturing tone with gentle encouragement';
      case 'neutral':
        return 'Use calm, measured delivery with clear explanations';
      default:
        return 'Use engaging, clear delivery';
    }
  }

  private getAgeConsiderations(age: number): string {
    if (age <= 12) {
      return 'Use simple language, concrete examples, and frequent encouragement';
    } else if (age <= 18) {
      return 'Balance guidance with independence, use relatable examples';
    } else {
      return 'Respect autonomy, use sophisticated examples, encourage reflection';
    }
  }
} 