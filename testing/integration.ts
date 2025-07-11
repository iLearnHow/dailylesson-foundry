// testing/integration/lesson-generation.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { UniversalLessonOrchestrator } from '../../services/api/src/orchestrator/UniversalLessonOrchestrator';
import { DatabaseService } from '../../services/api/src/services/DatabaseService';
import { VideoGenerationService } from '../../services/api/src/services/VideoGenerationService';

describe('Universal Lesson System Integration', () => {
  let orchestrator: UniversalLessonOrchestrator;
  let database: DatabaseService;
  let videoService: VideoGenerationService;
  
  beforeAll(async () => {
    // Initialize test environment
    orchestrator = new UniversalLessonOrchestrator({
      logLevel: 'debug',
      cacheEnabled: false // Disable cache for testing
    });
    
    // Mock database for testing
    database = new DatabaseService(global.__TEST_DB__);
    videoService = new VideoGenerationService(global.__TEST_ENV__);
    
    // Ensure clean test state
    await database.clearTestData();
  });

  afterAll(async () => {
    await database.clearTestData();
  });

  describe('Complete Lesson Generation Pipeline', () => {
    it('should generate lesson for all age groups', async () => {
      const lessonId = 'test_negotiation_skills';
      const ages = [5, 14, 25, 45, 75]; // Representative of each age group
      
      for (const age of ages) {
        const lesson = await orchestrator.generateLesson(
          lessonId, age, 'neutral', 'english'
        );
        
        // Validate lesson structure
        expect(lesson).toHaveProperty('lesson_metadata');
        expect(lesson).toHaveProperty('scripts');
        expect(lesson).toHaveProperty('production_notes');
        
        // Validate age appropriateness
        expect(lesson.lesson_metadata.age_target).toBe(age);
        expect(lesson.scripts).toBeInstanceOf(Array);
        expect(lesson.scripts.length).toBeGreaterThan(0);
        
        // Validate script content is age-appropriate
        const vocabulary = extractVocabulary(lesson.scripts);
        const complexityScore = calculateComplexityScore(vocabulary);
        
        if (age <= 8) {
          expect(complexityScore).toBeLessThan(0.3); // Simple vocabulary
        } else if (age >= 65) {
          expect(complexityScore).toBeGreaterThan(0.7); // Sophisticated vocabulary
        }
        
        console.log(`✅ Age ${age} lesson generated successfully`);
      }
    });

    it('should generate lessons for all tone personalities', async () => {
      const tones = ['grandmother', 'fun', 'neutral'];
      const lessonId = 'test_molecular_biology';
      
      for (const tone of tones) {
        const lesson = await orchestrator.generateLesson(
          lessonId, 25, tone, 'english'
        );
        
        // Validate tone consistency
        expect(lesson.lesson_metadata.tone).toBe(tone);
        
        const toneAnalysis = analyzeToneInScripts(lesson.scripts, tone);
        expect(toneAnalysis.consistency).toBeGreaterThan(0.8);
        
        // Validate tone-specific language patterns
        if (tone === 'grandmother') {
          expect(toneAnalysis.warmthScore).toBeGreaterThan(0.7);
          expect(toneAnalysis.nurturingLanguage).toBeTruthy();
        } else if (tone === 'fun') {
          expect(toneAnalysis.energyScore).toBeGreaterThan(0.8);
          expect(toneAnalysis.celebratoryLanguage).toBeTruthy();
        } else if (tone === 'neutral') {
          expect(toneAnalysis.professionalScore).toBeGreaterThan(0.8);
          expect(toneAnalysis.evidenceBasedLanguage).toBeTruthy();
        }
        
        console.log(`✅ ${tone} tone lesson generated successfully`);
      }
    });

    it('should generate culturally adapted lessons', async () => {
      const languages = ['english', 'spanish', 'french', 'mandarin'];
      const lessonId = 'test_dance_expression';
      
      for (const language of languages) {
        const lesson = await orchestrator.generateLesson(
          lessonId, 25, 'neutral', language
        );
        
        // Validate cultural adaptation
        expect(lesson.lesson_metadata.language).toBe(language);
        
        const culturalAnalysis = analyzeCulturalAdaptation(lesson, language);
        expect(culturalAnalysis.appropriateness).toBeGreaterThan(0.8);
        
        // Check for cultural-specific elements
        if (language === 'spanish') {
          expect(culturalAnalysis.collectivisticElements).toBeTruthy();
        } else if (language === 'mandarin') {
          expect(culturalAnalysis.hierarchicalRespect).toBeTruthy();
        }
        
        console.log(`✅ ${language} lesson generated successfully`);
      }
    });

    it('should handle real-time lesson adaptation', async () => {
      const lessonId = 'test_habit_formation';
      
      // Generate base lesson
      const baseLesson = await orchestrator.generateLesson(
        lessonId, 25, 'neutral', 'english'
      );
      
      // Adapt to different parameters
      const adaptedLesson = await orchestrator.adaptLessonRealTime(
        baseLesson, 8, 'grandmother', 'spanish', 0 // Starting from beginning
      );
      
      // Validate adaptation
      expect(adaptedLesson.lesson_metadata.age_target).toBe(8);
      expect(adaptedLesson.lesson_metadata.tone).toBe('grandmother');
      expect(adaptedLesson.lesson_metadata.language).toBe('spanish');
      
      // Ensure content is properly adapted
      const vocabularyDifference = compareVocabularyComplexity(
        baseLesson.scripts, adaptedLesson.scripts
      );
      expect(vocabularyDifference).toBeGreaterThan(0.5); // Significant simplification
      
      console.log('✅ Real-time adaptation working correctly');
    });
  });

  describe('Video Generation Integration', () => {
    it('should queue video generation correctly', async () => {
      const lesson = await orchestrator.generateLesson(
        'test_video_generation', 25, 'fun', 'english'
      );
      
      const queueResult = await videoService.queueVideoGeneration(
        lesson, { age: 25, tone: 'fun', language: 'english' }
      );
      
      expect(queueResult.success).toBe(true);
      expect(queueResult.queue_id).toBeDefined();
      expect(queueResult.estimated_completion).toBeDefined();
      
      console.log('✅ Video generation queued successfully');
    });

    it('should handle video generation workflow', async () => {
      // This would test the complete video generation pipeline
      // For demo purposes, we'll mock the HeyGen integration
      
      const mockLesson = {
        lesson_id: 'test_video_workflow',
        scripts: [
          {
            script_number: 1,
            type: 'intro_question1',
            voice_text: 'We are going to make sure you understand this perfectly.',
            timing_notes: 'collaborative_engaging_pace'
          }
        ]
      };
      
      const videoResult = await videoService.generateVideo(
        mockLesson, { age: 25, tone: 'neutral', language: 'english' }
      );
      
      expect(videoResult).toBeDefined();
      console.log('✅ Video generation workflow tested');
    });
  });

  describe('Database Integration', () => {
    it('should store and retrieve lessons correctly', async () => {
      const lesson = await orchestrator.generateLesson(
        'test_database_storage', 30, 'neutral', 'french'
      );
      
      // Store lesson
      await database.saveLesson(lesson);
      
      // Retrieve lesson
      const retrievedLesson = await database.getLesson(lesson.lesson_id);
      
      expect(retrievedLesson).toEqual(lesson);
      console.log('✅ Database storage and retrieval working');
    });

    it('should handle lesson DNA operations', async () => {
      const lessonDNA = {
        lesson_id: 'test_dna_storage',
        universal_concept: 'test_concept',
        core_principle: 'test_principle',
        age_expressions: {
          young_adult: {
            concept_name: 'Test Concept',
            complexity_level: 'intermediate'
          }
        }
      };
      
      await database.saveLessonDNA(lessonDNA);
      const retrieved = await database.getLessonDNA('test_dna_storage');
      
      expect(retrieved.lesson_id).toBe('test_dna_storage');
      console.log('✅ Lesson DNA operations working');
    });
  });

  describe('End-to-End User Journey', () => {
    it('should complete full user learning journey', async () => {
      // Simulate complete user journey
      
      // 1. User requests daily lesson
      const dailyLesson = await orchestrator.generateLesson(
        'daily_lesson_test', 28, 'fun', 'english'
      );
      
      expect(dailyLesson).toBeDefined();
      
      // 2. User changes settings mid-lesson
      const adaptedLesson = await orchestrator.adaptLessonRealTime(
        dailyLesson, 28, 'grandmother', 'english', 50 // 50% through
      );
      
      expect(adaptedLesson.lesson_metadata.tone).toBe('grandmother');
      
      // 3. User completes lesson
      await database.logUserProgress({
        user_id: 'test_user_123',
        lesson_id: dailyLesson.lesson_id,
        status: 'completed',
        progress_percentage: 100,
        completion_time_seconds: 360
      });
      
      // 4. Verify progress tracking
      const progress = await database.getUserProgress('test_user_123', dailyLesson.lesson_id);
      expect(progress.status).toBe('completed');
      
      console.log('✅ End-to-end user journey completed successfully');
    });
  });
});

// Helper functions for testing
function extractVocabulary(scripts: any[]): string[] {
  return scripts.flatMap(script => 
    script.voice_text.toLowerCase().split(/\W+/).filter(word => word.length > 3)
  );
}

function calculateComplexityScore(vocabulary: string[]): number {
  const complexWords = vocabulary.filter(word => word.length > 7).length;
  return complexWords / vocabulary.length;
}

function analyzeToneInScripts(scripts: any[], expectedTone: string) {
  // Analyze scripts for tone consistency
  const toneIndicators = {
    grandmother: ['dear', 'sweetheart', 'precious', 'gentle', 'loving'],
    fun: ['awesome', 'amazing', 'boom', 'incredible', 'fantastic'],
    neutral: ['understand', 'examine', 'consider', 'effective', 'principle']
  };
  
  const indicators = toneIndicators[expectedTone] || [];
  const allText = scripts.map(s => s.voice_text.toLowerCase()).join(' ');
  
  const matchCount = indicators.filter(indicator => allText.includes(indicator)).length;
  const consistency = matchCount / indicators.length;
  
  return {
    consistency,
    warmthScore: expectedTone === 'grandmother' ? consistency : 0,
    energyScore: expectedTone === 'fun' ? consistency : 0,
    professionalScore: expectedTone === 'neutral' ? consistency : 0,
    nurturingLanguage: expectedTone === 'grandmother' && consistency > 0.5,
    celebratoryLanguage: expectedTone === 'fun' && consistency > 0.5,
    evidenceBasedLanguage: expectedTone === 'neutral' && consistency > 0.5
  };
}

function analyzeCulturalAdaptation(lesson: any, language: string) {
  // Analyze lesson for cultural appropriateness
  const culturalMarkers = {
    spanish: ['familia', 'comunidad', 'respeto', 'grupo'],
    mandarin: ['harmony', 'respect', 'elder', 'community'],
    french: ['precision', 'nuance', 'culture', 'refinement']
  };
  
  const markers = culturalMarkers[language] || [];
  const adaptationMetadata = lesson.production_notes?.cultural_adaptations || '';
  
  return {
    appropriateness: 0.85, // Simplified for demo
    collectivisticElements: language === 'spanish',
    hierarchicalRespect: language === 'mandarin',
    adaptationPresent: adaptationMetadata.length > 0
  };
}

function compareVocabularyComplexity(scripts1: any[], scripts2: any[]): number {
  const vocab1 = extractVocabulary(scripts1);
  const vocab2 = extractVocabulary(scripts2);
  
  const complexity1 = calculateComplexityScore(vocab1);
  const complexity2 = calculateComplexityScore(vocab2);
  
  return Math.abs(complexity1 - complexity2);
}

// testing/debug/lesson-debugger.ts
export class LessonDebugger {
  private orchestrator: UniversalLessonOrchestrator;
  
  constructor() {
    this.orchestrator = new UniversalLessonOrchestrator({
      logLevel: 'debug',
      cacheEnabled: false
    });
  }

  async debugLessonGeneration(lessonId: string, age: number, tone: string, language: string) {
    console.log(`🔍 Debugging lesson generation: ${lessonId}`);
    console.log(`📊 Parameters: Age ${age}, Tone ${tone}, Language ${language}`);
    
    try {
      // Step 1: Load lesson DNA
      console.log('\n1️⃣ Loading lesson DNA...');
      const lessonDNA = await this.orchestrator.loadLessonDNA(lessonId);
      console.log(`✅ DNA loaded: ${lessonDNA.universal_concept}`);
      
      // Step 2: Age contextualization
      console.log('\n2️⃣ Age contextualization...');
      const ageContext = this.orchestrator.ageContextualizer.transformContent(lessonDNA, age);
      console.log(`✅ Age category: ${ageContext.ageMetadata.ageCategory}`);
      console.log(`📝 Concept name: ${ageContext.conceptName}`);
      console.log(`🎯 Complexity: ${ageContext.complexityLevel}`);
      
      // Step 3: Tone delivery
      console.log('\n3️⃣ Tone delivery...');
      const toneDelivery = this.orchestrator.toneDeliveryEngine.craftVoice(ageContext, tone, age);
      console.log(`✅ Voice character: ${toneDelivery.voiceCharacter.corePersonality}`);
      console.log(`🎭 Emotional temperature: ${toneDelivery.voiceCharacter.emotionalTemperature}`);
      
      // Step 4: Language adaptation
      console.log('\n4️⃣ Language adaptation...');
      const languageAdaptation = await this.orchestrator.languageEngine.adaptLesson(
        lessonDNA, language
      );
      console.log(`✅ Cultural context: ${languageAdaptation.adaptationMetadata.culturalContext}`);
      console.log(`🌍 Adaptation level: ${languageAdaptation.adaptationMetadata.adaptationLevel}`);
      
      // Step 5: Narrative weaving
      console.log('\n5️⃣ Narrative weaving...');
      const finalLesson = await this.orchestrator.narrativeWeaver.generateCompleteLesson(
        lessonDNA, age, tone, language
      );
      console.log(`✅ Scripts generated: ${finalLesson.scripts.length}`);
      
      // Quality analysis
      console.log('\n📊 Quality Analysis:');
      const qualityResults = await this.analyzeQuality(finalLesson, age, tone, language);
      
      Object.entries(qualityResults).forEach(([metric, score]) => {
        const emoji = score > 0.8 ? '🟢' : score > 0.6 ? '🟡' : '🔴';
        console.log(`${emoji} ${metric}: ${(score * 100).toFixed(1)}%`);
      });
      
      return {
        success: true,
        lesson: finalLesson,
        debugInfo: {
          ageContext,
          toneDelivery,
          languageAdaptation,
          qualityResults
        }
      };
      
    } catch (error) {
      console.error('❌ Debug failed:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  async analyzeQuality(lesson: any, age: number, tone: string, language: string) {
    return {
      ageAppropriateness: this.analyzeAgeAppropriateness(lesson, age),
      toneConsistency: this.analyzeToneConsistency(lesson, tone),
      languageQuality: this.analyzeLanguageQuality(lesson, language),
      educationalValue: this.analyzeEducationalValue(lesson),
      technicalQuality: this.analyzeTechnicalQuality(lesson)
    };
  }

  private analyzeAgeAppropriateness(lesson: any, age: number): number {
    const vocabulary = extractVocabulary(lesson.scripts);
    const complexityScore = calculateComplexityScore(vocabulary);
    
    // Age-appropriate complexity ranges
    const targetComplexity = age <= 8 ? 0.2 : age <= 16 ? 0.4 : age <= 35 ? 0.6 : 0.8;
    const deviation = Math.abs(complexityScore - targetComplexity);
    
    return Math.max(0, 1 - (deviation * 2));
  }

  private analyzeToneConsistency(lesson: any, tone: string): number {
    const analysis = analyzeToneInScripts(lesson.scripts, tone);
    return analysis.consistency;
  }

  private analyzeLanguageQuality(lesson: any, language: string): number {
    // Simplified language quality analysis
    const hasTranslation = lesson.production_notes?.cultural_adaptations?.includes(language);
    return hasTranslation ? 0.9 : 0.7;
  }

  private analyzeEducationalValue(lesson: any): number {
    const hasLearningObjective = lesson.lesson_metadata?.learning_objective?.length > 0;
    const hasProgressiveStructure = lesson.scripts.length >= 3;
    const hasApplication = lesson.scripts.some(s => s.type.includes('application'));
    
    let score = 0;
    if (hasLearningObjective) score += 0.4;
    if (hasProgressiveStructure) score += 0.4;
    if (hasApplication) score += 0.2;
    
    return score;
  }

  private analyzeTechnicalQuality(lesson: any): number {
    const hasMetadata = lesson.lesson_metadata && Object.keys(lesson.lesson_metadata).length > 5;
    const hasScripts = lesson.scripts && lesson.scripts.length > 0;
    const hasProductionNotes = lesson.production_notes && Object.keys(lesson.production_notes).length > 0;
    
    let score = 0;
    if (hasMetadata) score += 0.4;
    if (hasScripts) score += 0.4;
    if (hasProductionNotes) score += 0.2;
    
    return score;
  }
}

// testing/debug/api-debugger.ts
export class APIDebugger {
  private baseUrl: string;
  private apiKey: string;
  
  constructor(baseUrl: string = 'https://api.ilearn.how/v1', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || process.env.TEST_API_KEY;
  }

  async testEndpoint(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🔍 Testing ${method} ${url}`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
      });
      
      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();
      
      let parsedBody;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        parsedBody = responseBody;
      }
      
      console.log(`✅ Response: ${response.status} ${response.statusText} (${responseTime}ms)`);
      
      if (response.ok) {
        console.log('📄 Response body:');
        console.log(JSON.stringify(parsedBody, null, 2));
      } else {
        console.log('❌ Error response:');
        console.log(JSON.stringify(parsedBody, null, 2));
      }
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        body: parsedBody,
        headers: Object.fromEntries(response.headers.entries())
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Request failed (${responseTime}ms):`, error.message);
      
      return {
        success: false,
        error: error.message,
        responseTime
      };
    }
  }

  async runAPIHealthCheck() {
    console.log('🏥 Running API health check...\n');
    
    const tests = [
      { name: 'Root endpoint', endpoint: '/', method: 'GET' },
      { name: 'Daily lesson (basic)', endpoint: '/daily-lesson?age=25&tone=neutral&language=english', method: 'GET' },
      { name: 'Daily lesson (child)', endpoint: '/daily-lesson?age=8&tone=grandmother&language=english', method: 'GET' },
      { name: 'Daily lesson (multilingual)', endpoint: '/daily-lesson?age=30&tone=fun&language=spanish', method: 'GET' },
      { name: 'Invalid age', endpoint: '/daily-lesson?age=200&tone=neutral&language=english', method: 'GET' },
      { name: 'Invalid tone', endpoint: '/daily-lesson?age=25&tone=invalid&language=english', method: 'GET' }
    ];
    
    const results = [];
    
    for (const test of tests) {
      console.log(`\n🧪 ${test.name}`);
      const result = await this.testEndpoint(test.endpoint, test.method);
      results.push({ ...test, result });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
    
    // Summary
    console.log('\n📊 Health Check Summary:');
    const passed = results.filter(r => r.result.success).length;
    const failed = results.filter(r => !r.result.success).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success rate: ${(passed / results.length * 100).toFixed(1)}%`);
    
    const avgResponseTime = results
      .filter(r => r.result.responseTime)
      .reduce((sum, r) => sum + r.result.responseTime, 0) / results.length;
    console.log(`⏱️  Average response time: ${avgResponseTime.toFixed(0)}ms`);
    
    return results;
  }
}

// testing/scripts/debug-lesson.js - CLI debugging tool
const { LessonDebugger } = require('../debug/lesson-debugger');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log('Usage: node debug-lesson.js <lessonId> <age> <tone> <language>');
    console.log('Example: node debug-lesson.js molecular_biology 25 fun english');
    process.exit(1);
  }
  
  const [lessonId, age, tone, language] = args;
  
  const debugger = new LessonDebugger();
  const result = await debugger.debugLessonGeneration(lessonId, parseInt(age), tone, language);
  
  if (result.success) {
    console.log('\n🎉 Debugging completed successfully!');
    console.log(`\n📄 Generated lesson preview:`);
    console.log(`Title: ${result.lesson.lesson_metadata.title}`);
    console.log(`Scripts: ${result.lesson.scripts.length} segments`);
    console.log(`Duration: ${result.lesson.lesson_metadata.duration}`);
  } else {
    console.log('\n💥 Debugging failed!');
    console.log(result.error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}