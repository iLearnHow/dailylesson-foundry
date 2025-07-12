const _ = require('lodash');

class NarrativeWeaver {
  constructor(ageContextualizer, toneDeliveryEngine, languageEngine) {
    this.ageContextualizer = ageContextualizer;
    this.toneDeliveryEngine = toneDeliveryEngine;
    this.languageEngine = languageEngine;
    this.narrativeTemplates = this.loadNarrativeTemplates();
    this.qualityThresholds = this.loadQualityThresholds();
    this.weavingCache = new Map();
  }

  /**
   * Main method: Weave all engine outputs into final coherent lesson
   */
  async generateCompleteLesson(lessonDNA, age, tone, language = 'english', culturalContext = null) {
    const cacheKey = `${lessonDNA.lesson_id}_${age}_${tone}_${language}_${culturalContext}`;
    if (this.weavingCache.has(cacheKey)) {
      return this.weavingCache.get(cacheKey);
    }

    // Step 1: Get outputs from all engines
    const engineOutputs = await this.orchestrateEngines(lessonDNA, age, tone, language, culturalContext);
    
    // Step 2: Validate engine outputs
    const validationResults = await this.validateEngineOutputs(engineOutputs, age, tone, language);
    
    // Step 3: Weave coherent narrative
    const weavedLesson = await this.weaveCoherentNarrative(lessonDNA, engineOutputs, validationResults);
    
    // Step 4: Apply final quality assurance
    const finalLesson = await this.applyFinalQualityAssurance(weavedLesson, lessonDNA, age, tone);
    
    this.weavingCache.set(cacheKey, finalLesson);
    return finalLesson;
  }

  /**
   * Engine Orchestration - Coordinate all engines
   */
  async orchestrateEngines(lessonDNA, age, tone, language, culturalContext) {
    // Step 1: Age Contextualization (foundation)
    const ageContext = this.ageContextualizer.transformContent(lessonDNA, age);
    
    // Step 2: Tone Delivery (personality)
    const toneDelivery = this.toneDeliveryEngine.craftVoice(
      ageContext, 
      tone, 
      age, 
      culturalContext
    );
    
    // Step 3: Language Adaptation (cultural intelligence)
    const languageAdaptation = await this.languageEngine.adaptLesson(
      lessonDNA, 
      language, 
      culturalContext
    );

    return {
      ageContext,
      toneDelivery,
      languageAdaptation,
      integrationMetadata: {
        processingOrder: ['age', 'tone', 'language'],
        integrationComplexity: this.calculateIntegrationComplexity(ageContext, toneDelivery, languageAdaptation),
        coherenceScore: 0 // Will be calculated during weaving
      }
    };
  }

  /**
   * Narrative Weaving - Create coherent lesson structure
   */
  async weaveCoherentNarrative(lessonDNA, engineOutputs, validationResults) {
    const { ageContext, toneDelivery, languageAdaptation } = engineOutputs;
    
    // Create lesson metadata
    const lessonMetadata = this.createLessonMetadata(lessonDNA, ageContext, toneDelivery, languageAdaptation);
    
    // Generate lesson scripts
    const lessonScripts = await this.generateLessonScripts(lessonDNA, engineOutputs);
    
    // Create coherent lesson structure
    const weavedLesson = {
      lesson_metadata: lessonMetadata,
      scripts: lessonScripts,
      production_notes: this.generateProductionNotes(lessonDNA, engineOutputs),
      quality_metrics: this.generateQualityMetrics(validationResults),
      adaptation_log: this.generateAdaptationLog(engineOutputs)
    };

    return weavedLesson;
  }

  /**
   * Lesson Metadata Creation
   */
  createLessonMetadata(lessonDNA, ageContext, toneDelivery, languageAdaptation) {
    return {
      day: lessonDNA.day,
      date: lessonDNA.date,
      title: this.adaptTitle(lessonDNA.title || ageContext.conceptName, toneDelivery, languageAdaptation),
      objective: this.craftObjective(lessonDNA, ageContext, toneDelivery),
      category: lessonDNA.category || this.inferCategory(lessonDNA.universal_concept),
      subject: lessonDNA.subject || this.inferSubject(lessonDNA.universal_concept),
      duration: this.calculateDuration(ageContext.attentionSpan),
      complexity: this.determineComplexity(ageContext.complexityLevel),
      tone: toneDelivery.toneMetadata.appliedTone,
      age_target: ageContext.ageMetadata.targetAge,
      language: languageAdaptation.adaptationMetadata.targetLanguage,
      cultural_context: languageAdaptation.adaptationMetadata.culturalContext
    };
  }

  craftObjective(lessonDNA, ageContext, toneDelivery) {
    const basePrinciple = lessonDNA.core_principle;
    const ageAppropriateConcepts = ageContext.abstractConcepts;
    const toneCharacter = toneDelivery.voiceCharacter;
    
    return this.formulateObjective(basePrinciple, ageAppropriateConcepts, toneCharacter);
  }

  /**
   * Script Generation - Core narrative weaving
   */
  async generateLessonScripts(lessonDNA, engineOutputs) {
    const scripts = [];
    let scriptNumber = 1;
    
    // Generate question sequences
    for (const [questionKey, questionData] of Object.entries(lessonDNA.core_lesson_structure)) {
      const questionSequence = await this.generateQuestionSequence(
        questionKey,
        questionData,
        engineOutputs,
        scriptNumber
      );
      
      scripts.push(...questionSequence);
      scriptNumber += questionSequence.length;
    }
    
    // Generate daily fortune
    const dailyFortune = await this.generateDailyFortune(lessonDNA, engineOutputs, scriptNumber);
    scripts.push(dailyFortune);
    
    return scripts;
  }

  /**
   * Question Sequence Generation
   */
  async generateQuestionSequence(questionKey, questionData, engineOutputs, startingScriptNumber) {
    const { ageContext, toneDelivery, languageAdaptation } = engineOutputs;
    
    const sequence = [];
    
    // Question Setup
    sequence.push(await this.generateQuestionSetup(
      questionKey,
      questionData,
      engineOutputs,
      startingScriptNumber
    ));
    
    // Option A Response
    sequence.push(await this.generateOptionResponse(
      questionKey,
      questionData,
      'option_a',
      engineOutputs,
      startingScriptNumber + 1
    ));
    
    // Option B Response
    sequence.push(await this.generateOptionResponse(
      questionKey,
      questionData,
      'option_b',
      engineOutputs,
      startingScriptNumber + 2
    ));
    
    // No Response Retry
    sequence.push(await this.generateNoResponseRetry(
      questionKey,
      questionData,
      engineOutputs,
      startingScriptNumber + 3
    ));
    
    return sequence;
  }

  /**
   * Individual Script Generation Methods
   */
  async generateQuestionSetup(questionKey, questionData, engineOutputs, scriptNumber) {
    const { ageContext, toneDelivery, languageAdaptation } = engineOutputs;
    
    // Get age-appropriate example
    const example = this.selectExample(questionKey, ageContext, questionData);
    
    // Apply tone delivery
    const toneVoice = this.applyToneToContent(example, toneDelivery, 'question_setup');
    
    // Apply language adaptation
    const languageAdaptedContent = await this.applyLanguageAdaptation(
      toneVoice,
      languageAdaptation,
      'question_setup'
    );
    
    return {
      script_number: scriptNumber,
      type: `intro_question${this.extractQuestionNumber(questionKey)}`,
      voice_text: await this.craftVoiceText(
        questionData,
        example,
        toneDelivery,
        languageAdaptedContent,
        'setup'
      ),
      on_screen_text: await this.craftOnScreenText(
        questionData,
        example,
        toneDelivery,
        languageAdaptedContent,
        'setup'
      ),
      timing_notes: this.generateTimingNotes(
        ageContext.attentionSpan,
        toneDelivery,
        'setup'
      )
    };
  }

  async generateOptionResponse(questionKey, questionData, optionType, engineOutputs, scriptNumber) {
    const { ageContext, toneDelivery, languageAdaptation } = engineOutputs;
    
    // Determine if this is correct or incorrect response
    const isCorrect = this.determineCorrectness(questionData, optionType);
    
    // Get appropriate teaching moment
    const teachingMoment = questionData.teaching_moments[`${optionType}_response`];
    
    // Apply tone delivery
    const toneResponse = this.applyToneToTeachingMoment(
      teachingMoment,
      toneDelivery,
      isCorrect,
      ageContext
    );
    
    // Apply language adaptation
    const languageAdaptedResponse = await this.applyLanguageAdaptation(
      toneResponse,
      languageAdaptation,
      'teaching_response'
    );
    
    return {
      script_number: scriptNumber,
      type: `question${this.extractQuestionNumber(questionKey)}_${optionType}`,
      voice_text: await this.craftTeachingResponse(
        teachingMoment,
        toneResponse,
        languageAdaptedResponse,
        isCorrect
      ),
      on_screen_text: await this.craftTeachingOnScreen(
        teachingMoment,
        toneResponse,
        languageAdaptedResponse,
        isCorrect
      ),
      timing_notes: this.generateTimingNotes(
        ageContext.attentionSpan,
        toneDelivery,
        'teaching_response'
      )
    };
  }

  async generateNoResponseRetry(questionKey, questionData, engineOutputs, scriptNumber) {
    const { ageContext, toneDelivery, languageAdaptation } = engineOutputs;
    
    // Create simplified version of question
    const simplifiedQuestion = this.simplifyQuestion(questionData, ageContext, toneDelivery);
    
    // Apply language adaptation
    const languageAdaptedRetry = await this.applyLanguageAdaptation(
      simplifiedQuestion,
      languageAdaptation,
      'retry'
    );
    
    return {
      script_number: scriptNumber,
      type: `question${this.extractQuestionNumber(questionKey)}_no_response`,
      voice_text: await this.craftRetryVoiceText(
        simplifiedQuestion,
        toneDelivery,
        languageAdaptedRetry
      ),
      on_screen_text: await this.craftRetryOnScreenText(
        simplifiedQuestion,
        toneDelivery,
        languageAdaptedRetry
      ),
      timing_notes: this.generateTimingNotes(
        ageContext.attentionSpan,
        toneDelivery,
        'retry'
      )
    };
  }

  /**
   * Daily Fortune Generation
   */
  async generateDailyFortune(lessonDNA, engineOutputs, scriptNumber) {
    const { ageContext, toneDelivery, languageAdaptation } = engineOutputs;
    
    // Get daily fortune elements
    const fortuneElements = lessonDNA.daily_fortune_elements;
    
    // Apply tone delivery
    const toneAdaptedFortune = this.applyToneToFortune(
      fortuneElements,
      toneDelivery,
      ageContext
    );
    
    // Apply language adaptation
    const languageAdaptedFortune = await this.applyLanguageAdaptation(
      toneAdaptedFortune,
      languageAdaptation,
      'daily_fortune'
    );
    
    return {
      script_number: scriptNumber,
      type: 'daily_fortune',
      voice_text: await this.craftFortuneVoiceText(
        fortuneElements,
        toneAdaptedFortune,
        languageAdaptedFortune,
        ageContext
      ),
      on_screen_text: await this.craftFortuneOnScreenText(
        fortuneElements,
        toneAdaptedFortune,
        languageAdaptedFortune,
        ageContext
      ),
      timing_notes: this.generateTimingNotes(
        ageContext.attentionSpan,
        toneDelivery,
        'daily_fortune'
      )
    };
  }

  /**
   * Content Application Methods
   */
  applyToneToContent(content, toneDelivery, contentType) {
    const tonePatterns = toneDelivery.languagePatterns;
    const emotionalDelivery = toneDelivery.emotionalDelivery;
    
    return {
      originalContent: content,
      toneAppliedContent: this.blendContentWithTone(content, tonePatterns, contentType),
      emotionalLayering: this.applyEmotionalLayering(content, emotionalDelivery, contentType),
      interactionStyle: this.applyInteractionStyle(content, toneDelivery.interactionStyle, contentType)
    };
  }

  async applyLanguageAdaptation(toneContent, languageAdaptation, contentType) {
    const culturalAdaptations = languageAdaptation.culturalAdaptations;
    const linguisticStructure = languageAdaptation.linguisticStructure;
    
    return {
      originalToneContent: toneContent,
      culturallyAdaptedContent: await this.applyCulturalAdaptations(toneContent, culturalAdaptations, contentType),
      linguisticallyStructuredContent: await this.applyLinguisticStructure(toneContent, linguisticStructure, contentType),
      translatedContent: await this.applyTranslation(toneContent, languageAdaptation.directTranslations, contentType)
    };
  }

  /**
   * Voice Text and On-Screen Text Crafting
   */
  async craftVoiceText(questionData, example, toneDelivery, languageContent, scriptType) {
    const tonePatterns = toneDelivery.languagePatterns;
    const opening = this.selectAppropriateOpening(tonePatterns.openings, scriptType);
    const transition = this.selectAppropriateTransition(tonePatterns.transitions, scriptType);
    
    // Build voice text with tone consistency
    const voiceText = this.assembleVoiceText({
      opening,
      conceptIntroduction: this.craftConceptIntroduction(questionData, example, toneDelivery),
      questionFormulation: this.craftQuestionFormulation(questionData, example, toneDelivery),
      transition,
      culturalAdaptation: languageContent.culturallyAdaptedContent
    });
    
    return this.ensureVoiceTextQuality(voiceText, toneDelivery, languageContent);
  }

  async craftOnScreenText(questionData, example, toneDelivery, languageContent, scriptType) {
    // Create concise on-screen version
    const onScreenText = this.createOnScreenVersion({
      questionCore: this.extractQuestionCore(questionData, example),
      options: this.formatOptions(example, toneDelivery),
      culturalAdaptation: languageContent.culturallyAdaptedContent
    });
    
    return this.ensureOnScreenTextQuality(onScreenText, toneDelivery, languageContent);
  }

  /**
   * Production Notes Generation
   */
  generateProductionNotes(lessonDNA, engineOutputs) {
    const { ageContext, toneDelivery, languageAdaptation } = engineOutputs;
    
    return {
      voice_personality: this.describeVoicePersonality(toneDelivery),
      key_themes: this.extractKeyThemes(lessonDNA, ageContext),
      difficulty_progression: this.describeDifficultyProgression(lessonDNA, ageContext),
      real_world_applications: this.describeRealWorldApplications(lessonDNA, ageContext),
      cultural_considerations: this.describeCulturalConsiderations(languageAdaptation),
      age_specific_notes: this.generateAgeSpecificNotes(ageContext),
      user_state_logic: 'Uses {{WELCOME_MESSAGE}} placeholder for dynamic first-time vs returning user detection',
      conversation_flow: this.describeConversationFlow(toneDelivery, ageContext),
      adaptation_summary: this.generateAdaptationSummary(engineOutputs)
    };
  }

  /**
   * Quality Validation Methods
   */
  async validateEngineOutputs(engineOutputs, age, tone, language) {
    const validationResults = {};
    
    // Validate age contextualization
    validationResults.ageValidation = this.ageContextualizer.validateAgeAppropriateness(
      engineOutputs.ageContext,
      age
    );
    
    // Validate tone delivery
    validationResults.toneValidation = this.toneDeliveryEngine.validateToneAuthenticity(
      engineOutputs.toneDelivery,
      tone,
      age
    );
    
    // Validate language adaptation
    validationResults.languageValidation = this.languageEngine.validateCulturalAdaptation(
      engineOutputs.languageAdaptation,
      engineOutputs.languageAdaptation.adaptationMetadata.culturalContext
    );
    
    // Cross-engine coherence validation
    validationResults.coherenceValidation = this.validateCrossEngineCoherence(engineOutputs);
    
    return validationResults;
  }

  validateCrossEngineCoherence(engineOutputs) {
    return {
      ageToToneAlignment: this.assessAgeToToneAlignment(
        engineOutputs.ageContext,
        engineOutputs.toneDelivery
      ),
      toneToLanguageAlignment: this.assessToneToLanguageAlignment(
        engineOutputs.toneDelivery,
        engineOutputs.languageAdaptation
      ),
      ageToLanguageAlignment: this.assessAgeToLanguageAlignment(
        engineOutputs.ageContext,
        engineOutputs.languageAdaptation
      ),
      overallCoherence: 0 // Calculated from above metrics
    };
  }

  /**
   * Final Quality Assurance
   */
  async applyFinalQualityAssurance(weavedLesson, lessonDNA, age, tone) {
    // Check lesson completeness
    const completenessCheck = this.validateLessonCompleteness(weavedLesson);
    
    // Check narrative flow
    const narrativeFlow = this.validateNarrativeFlow(weavedLesson);
    
    // Check educational integrity
    const educationalIntegrity = this.validateEducationalIntegrity(weavedLesson, lessonDNA);
    
    // Apply final polish
    const polishedLesson = await this.applyFinalPolish(weavedLesson, completenessCheck, narrativeFlow);
    
    return polishedLesson;
  }

  /**
   * Helper Methods
   */
  calculateIntegrationComplexity(ageContext, toneDelivery, languageAdaptation) {
    const ageComplexity = ageContext.complexityLevel === 'concrete_actions_and_feelings' ? 0.3 : 0.8;
    const toneComplexity = toneDelivery.toneMetadata.authenticityScore || 0.5;
    const languageComplexity = languageAdaptation.adaptationMetadata.adaptationLevel || 0.5;
    
    return (ageComplexity + toneComplexity + languageComplexity) / 3;
  }

  extractQuestionNumber(questionKey) {
    const match = questionKey.match(/question_(\d+)/);
    return match ? match[1] : '1';
  }

  determineCorrectness(questionData, optionType) {
    // Logic to determine which option is "correct" based on question data
    // This would be encoded in the lesson DNA structure
    return optionType === 'option_b'; // Placeholder logic
  }

  selectExample(questionKey, ageContext, questionData) {
    const ageCategory = ageContext.ageMetadata.ageCategory;
    const examples = ageContext.examples;
    
    // Select most appropriate example for this question and age
    return examples[0] || { scenario: 'default_scenario', option_a: 'option_a', option_b: 'option_b' };
  }

  // Placeholder implementations for complex methods
  formulateObjective(basePrinciple, ageAppropriateConcepts, toneCharacter) {
    return `Learn ${basePrinciple} through ${Object.keys(ageAppropriateConcepts).join(', ')} with ${toneCharacter} guidance`;
  }

  calculateDuration(attentionSpan) {
    return typeof attentionSpan === 'object' ? `${Math.floor(attentionSpan.optimal / 60)} minutes` : '6 minutes';
  }

  determineComplexity(complexityLevel) {
    return complexityLevel.includes('concrete') ? 'Foundation' : 'Intermediate';
  }

  // Additional placeholder methods for completeness
  adaptTitle(title, toneDelivery, languageAdaptation) { return title; }
  inferCategory(concept) { return 'life_skills'; }
  inferSubject(concept) { return 'Personal Development'; }
  blendContentWithTone(content, patterns, type) { return content; }
  applyEmotionalLayering(content, delivery, type) { return content; }
  applyInteractionStyle(content, style, type) { return content; }
  applyCulturalAdaptations(content, adaptations, type) { return content; }
  applyLinguisticStructure(content, structure, type) { return content; }
  applyTranslation(content, translations, type) { return content; }
  
  // Assessment method placeholders
  assessAgeToToneAlignment(ageContext, toneDelivery) { return 0.87; }
  assessToneToLanguageAlignment(toneDelivery, languageAdaptation) { return 0.85; }
  assessAgeToLanguageAlignment(ageContext, languageAdaptation) { return 0.89; }
  validateLessonCompleteness(lesson) { return { complete: true, score: 0.95 }; }
  validateNarrativeFlow(lesson) { return { coherent: true, score: 0.88 }; }
  validateEducationalIntegrity(lesson, dna) { return { maintained: true, score: 0.92 }; }
  applyFinalPolish(lesson, completeness, flow) { return lesson; }
}

module.exports = NarrativeWeaver;