import { loadDailyLessonDNA } from '../api/index';

// Universal age support - every age from 1-100+
export interface AgeAdaptation {
  cognitiveLevel: 'preoperational' | 'concrete' | 'formal' | 'postformal';
  languageComplexity: number; // 1-10 scale
  abstractThinking: number; // 1-10 scale
  attentionSpan: number; // minutes
  priorKnowledge: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  conceptDepth: 'simple' | 'moderate' | 'complex' | 'sophisticated';
  exampleType: 'concrete' | 'abstract' | 'metaphorical' | 'philosophical';
  interactionLevel: 'passive' | 'guided' | 'interactive' | 'collaborative';
}

export interface AdaptedContent {
  title: string;
  introduction: string;
  mainContent: string[];
  examples: string[];
  activities: string[];
  summary: string;
  vocabulary: string[];
  complexity: number;
  estimatedDuration: number;
  ageSpecificNotes: string;
}

export class UniversalAgeEngine {
  private cognitiveStages = {
    preoperational: { min: 1, max: 7, characteristics: ['egocentric', 'symbolic', 'intuitive'] },
    concrete: { min: 7, max: 12, characteristics: ['logical', 'systematic', 'hands-on'] },
    formal: { min: 12, max: 25, characteristics: ['abstract', 'hypothetical', 'analytical'] },
    postformal: { min: 25, max: 100, characteristics: ['contextual', 'pragmatic', 'wisdom-based'] }
  };

  private vocabularyLevels = {
    basic: { min: 1, max: 8, words: ['simple', 'basic', 'easy', 'clear'] },
    intermediate: { min: 8, max: 15, words: ['moderate', 'standard', 'common', 'familiar'] },
    advanced: { min: 15, max: 25, words: ['complex', 'sophisticated', 'nuanced', 'detailed'] },
    expert: { min: 25, max: 100, words: ['specialized', 'technical', 'comprehensive', 'expert-level'] }
  };

  calculateAgeAdaptation(age: number): AgeAdaptation {
    // Validate age range
    if (age < 1) age = 1;
    if (age > 100) age = 100;

    // Determine cognitive stage
    let cognitiveLevel: AgeAdaptation['cognitiveLevel'] = 'concrete';
    for (const [stage, range] of Object.entries(this.cognitiveStages)) {
      if (age >= range.min && age <= range.max) {
        cognitiveLevel = stage as AgeAdaptation['cognitiveLevel'];
        break;
      }
    }

    // Calculate language complexity (1-10 scale)
    const languageComplexity = this.calculateLanguageComplexity(age);

    // Calculate abstract thinking capability (1-10 scale)
    const abstractThinking = this.calculateAbstractThinking(age);

    // Calculate attention span in minutes
    const attentionSpan = this.calculateAttentionSpan(age);

    // Determine prior knowledge based on age
    const priorKnowledge = this.determinePriorKnowledge(age);

    // Determine learning style preference
    const learningStyle = this.determineLearningStyle(age);

    // Determine vocabulary level
    const vocabularyLevel = this.determineVocabularyLevel(age);

    // Determine concept depth
    const conceptDepth = this.determineConceptDepth(age);

    // Determine example type
    const exampleType = this.determineExampleType(age);

    // Determine interaction level
    const interactionLevel = this.determineInteractionLevel(age);

    return {
      cognitiveLevel,
      languageComplexity,
      abstractThinking,
      attentionSpan,
      priorKnowledge,
      learningStyle,
      vocabularyLevel,
      conceptDepth,
      exampleType,
      interactionLevel
    };
  }

  private calculateLanguageComplexity(age: number): number {
    if (age <= 3) return 1;
    if (age <= 6) return 2;
    if (age <= 9) return 3;
    if (age <= 12) return 4;
    if (age <= 15) return 5;
    if (age <= 18) return 6;
    if (age <= 25) return 7;
    if (age <= 40) return 8;
    if (age <= 60) return 9;
    return 10;
  }

  private calculateAbstractThinking(age: number): number {
    if (age <= 7) return 1;
    if (age <= 11) return 2;
    if (age <= 14) return 3;
    if (age <= 17) return 4;
    if (age <= 20) return 5;
    if (age <= 25) return 6;
    if (age <= 35) return 7;
    if (age <= 50) return 8;
    if (age <= 70) return 9;
    return 10;
  }

  private calculateAttentionSpan(age: number): number {
    // Base attention span in minutes
    if (age <= 3) return 5;
    if (age <= 6) return 10;
    if (age <= 9) return 15;
    if (age <= 12) return 20;
    if (age <= 15) return 25;
    if (age <= 18) return 30;
    if (age <= 25) return 35;
    if (age <= 40) return 40;
    if (age <= 60) return 35;
    return 30; // Slight decrease in very old age
  }

  private determinePriorKnowledge(age: number): string[] {
    const knowledgeAreas = [
      'basic_life_skills',
      'school_subjects',
      'technology',
      'social_interactions',
      'work_experience',
      'family_life',
      'health_wellness',
      'financial_literacy',
      'cultural_knowledge',
      'historical_context',
      'scientific_thinking',
      'artistic_appreciation',
      'environmental_awareness',
      'global_perspective',
      'wisdom_experience'
    ];

    const knowledgeMap: { [key: number]: string[] } = {
      1: ['basic_life_skills'],
      3: ['basic_life_skills', 'family_life'],
      5: ['basic_life_skills', 'family_life', 'social_interactions'],
      7: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects'],
      10: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects', 'artistic_appreciation'],
      13: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects', 'artistic_appreciation', 'technology'],
      16: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects', 'artistic_appreciation', 'technology', 'scientific_thinking'],
      19: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects', 'artistic_appreciation', 'technology', 'scientific_thinking', 'financial_literacy'],
      25: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects', 'artistic_appreciation', 'technology', 'scientific_thinking', 'financial_literacy', 'work_experience'],
      35: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects', 'artistic_appreciation', 'technology', 'scientific_thinking', 'financial_literacy', 'work_experience', 'health_wellness'],
      50: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects', 'artistic_appreciation', 'technology', 'scientific_thinking', 'financial_literacy', 'work_experience', 'health_wellness', 'cultural_knowledge', 'historical_context'],
      70: ['basic_life_skills', 'family_life', 'social_interactions', 'school_subjects', 'artistic_appreciation', 'technology', 'scientific_thinking', 'financial_literacy', 'work_experience', 'health_wellness', 'cultural_knowledge', 'historical_context', 'environmental_awareness', 'global_perspective'],
      100: knowledgeAreas // All knowledge areas
    };

    // Find the appropriate knowledge set
    const ages = Object.keys(knowledgeMap).map(Number).sort((a, b) => a - b);
    let selectedAge = ages[0];
    
    for (const ageKey of ages) {
      if (age >= ageKey) {
        selectedAge = ageKey;
      } else {
        break;
      }
    }

    return knowledgeMap[selectedAge] || knowledgeAreas;
  }

  private determineLearningStyle(age: number): AgeAdaptation['learningStyle'] {
    if (age <= 6) return 'kinesthetic';
    if (age <= 12) return 'visual';
    if (age <= 18) return 'mixed';
    if (age <= 30) return 'auditory';
    return 'mixed'; // Adults prefer mixed learning styles
  }

  private determineVocabularyLevel(age: number): AgeAdaptation['vocabularyLevel'] {
    if (age <= 8) return 'basic';
    if (age <= 15) return 'intermediate';
    if (age <= 25) return 'advanced';
    return 'expert';
  }

  private determineConceptDepth(age: number): AgeAdaptation['conceptDepth'] {
    if (age <= 7) return 'simple';
    if (age <= 12) return 'moderate';
    if (age <= 20) return 'complex';
    return 'sophisticated';
  }

  private determineExampleType(age: number): AgeAdaptation['exampleType'] {
    if (age <= 7) return 'concrete';
    if (age <= 12) return 'concrete';
    if (age <= 18) return 'abstract';
    return 'metaphorical';
  }

  private determineInteractionLevel(age: number): AgeAdaptation['interactionLevel'] {
    if (age <= 5) return 'guided';
    if (age <= 12) return 'interactive';
    if (age <= 18) return 'interactive';
    return 'collaborative';
  }

  async adaptLessonContent(lessonDNA: any, age: number): Promise<AdaptedContent> {
    // For now, just return the lessonDNA fields mapped to AdaptedContent
    return {
      title: lessonDNA.title || lessonDNA.lesson_id,
      introduction: lessonDNA.introduction || '',
      mainContent: lessonDNA.mainContent || [],
      examples: lessonDNA.examples || [],
      activities: lessonDNA.activities || [],
      summary: lessonDNA.summary || '',
      vocabulary: lessonDNA.vocabulary || [],
      complexity: this.calculateAgeAdaptation(age).languageComplexity,
      estimatedDuration: this.calculateAgeAdaptation(age).attentionSpan,
      ageSpecificNotes: 'Adapted for age ' + age
    };
  }

  private adaptTitle(title: string, adaptation: AgeAdaptation): string {
    // Simplify title for younger ages
    if (adaptation.languageComplexity <= 3) {
      return title.replace(/[A-Z][a-z]+/g, (match) => {
        return match.toLowerCase();
      }).replace(/[^\w\s]/g, '');
    }
    return title;
  }

  private adaptIntroduction(intro: string, adaptation: AgeAdaptation): string {
    // Adapt introduction based on age
    if (adaptation.languageComplexity <= 2) {
      return `Today we're going to learn about something really cool! ${intro}`;
    } else if (adaptation.languageComplexity <= 5) {
      return `Let's explore an interesting topic together. ${intro}`;
    } else if (adaptation.languageComplexity <= 8) {
      return `In this lesson, we'll examine ${intro}`;
    } else {
      return `This comprehensive exploration will delve into ${intro}`;
    }
  }

  private adaptMainContent(content: string[], adaptation: AgeAdaptation): string[] {
    return content.map(paragraph => {
      // Simplify language for younger ages
      if (adaptation.languageComplexity <= 3) {
        return this.simplifyLanguage(paragraph);
      } else if (adaptation.languageComplexity <= 6) {
        return this.standardizeLanguage(paragraph);
      } else {
        return this.enhanceLanguage(paragraph);
      }
    });
  }

  private adaptExamples(examples: string[], adaptation: AgeAdaptation): string[] {
    return examples.map(example => {
      // Make examples more age-appropriate
      if (adaptation.exampleType === 'concrete') {
        return this.makeConcrete(example);
      } else if (adaptation.exampleType === 'abstract') {
        return this.makeAbstract(example);
      } else {
        return this.makeMetaphorical(example);
      }
    });
  }

  private adaptActivities(activities: string[], adaptation: AgeAdaptation): string[] {
    return activities.map(activity => {
      // Adapt activity complexity based on age
      if (adaptation.interactionLevel === 'guided') {
        return `With help from a grown-up: ${activity}`;
      } else if (adaptation.interactionLevel === 'interactive') {
        return `Try this: ${activity}`;
      } else {
        return `Explore this: ${activity}`;
      }
    });
  }

  private adaptSummary(summary: string, adaptation: AgeAdaptation): string {
    if (adaptation.languageComplexity <= 3) {
      return `We learned about ${summary}`;
    } else if (adaptation.languageComplexity <= 6) {
      return `In summary: ${summary}`;
    } else {
      return `To conclude: ${summary}`;
    }
  }

  private generateVocabulary(lessonDNA: any, adaptation: AgeAdaptation): string[] {
    // Extract key terms and adapt them for the age level
    const baseVocabulary = lessonDNA.vocabulary || [];
    
    if (adaptation.vocabularyLevel === 'basic') {
      return baseVocabulary.map((term: string) => this.simplifyTerm(term));
    } else if (adaptation.vocabularyLevel === 'intermediate') {
      return baseVocabulary;
    } else {
      return baseVocabulary.map((term: string) => this.enhanceTerm(term));
    }
  }

  private generateAgeSpecificNotes(adaptation: AgeAdaptation): string {
    const notes = [];
    
    if (adaptation.cognitiveLevel === 'preoperational') {
      notes.push('Use concrete examples and visual aids');
    } else if (adaptation.cognitiveLevel === 'concrete') {
      notes.push('Provide hands-on activities and real-world examples');
    } else if (adaptation.cognitiveLevel === 'formal') {
      notes.push('Encourage abstract thinking and hypothesis testing');
    } else {
      notes.push('Connect to life experience and wisdom');
    }

    if (adaptation.attentionSpan < 15) {
      notes.push('Keep activities short and engaging');
    }

    if (adaptation.learningStyle === 'kinesthetic') {
      notes.push('Include movement and hands-on activities');
    }

    return notes.join('. ');
  }

  // Helper methods for language adaptation
  private simplifyLanguage(text: string): string {
    // Replace complex words with simpler alternatives
    const simplifications: { [key: string]: string } = {
      'comprehensive': 'complete',
      'sophisticated': 'smart',
      'utilize': 'use',
      'facilitate': 'help',
      'implement': 'do',
      'methodology': 'way',
      'paradigm': 'idea',
      'synthesize': 'put together',
      'analyze': 'look at',
      'evaluate': 'check'
    };

    let simplified = text;
    for (const [complex, simple] of Object.entries(simplifications)) {
      simplified = simplified.replace(new RegExp(complex, 'gi'), simple);
    }

    return simplified;
  }

  private standardizeLanguage(text: string): string {
    // Keep standard language, just ensure clarity
    return text;
  }

  private enhanceLanguage(text: string): string {
    // Add sophistication for older learners
    return text;
  }

  private makeConcrete(example: string): string {
    // Add concrete, tangible elements
    return `Imagine you're holding ${example}`;
  }

  private makeAbstract(example: string): string {
    // Make more abstract and conceptual
    return `Consider the concept of ${example}`;
  }

  private makeMetaphorical(example: string): string {
    // Add metaphorical elements
    return `Think of ${example} as a metaphor for...`;
  }

  private simplifyTerm(term: string): string {
    // Simplify complex terms
    const simplifications: { [key: string]: string } = {
      'photosynthesis': 'how plants make food'
    };
    return simplifications[term.toLowerCase()] || term;
  }

  private enhanceTerm(term: string): string {
    // Add more sophisticated context
    return `${term} (technical term)`;
  }
}

export default UniversalAgeEngine; 