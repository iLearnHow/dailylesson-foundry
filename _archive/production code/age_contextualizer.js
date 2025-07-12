const _ = require('lodash');

class AgeContextualizer {
  constructor() {
    this.cognitiveStages = this.loadCognitiveStages();
    this.developmentalMilestones = this.loadDevelopmentalMilestones();
    this.contextCache = new Map();
  }

  /**
   * Main method: Transform lesson content for specific age
   */
  transformContent(lessonDNA, targetAge) {
    const cacheKey = `${lessonDNA.lesson_id}_${targetAge}`;
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey);
    }

    const ageCategory = this.mapAgeToCategory(targetAge);
    const cognitiveProfile = this.cognitiveStages[ageCategory];
    const ageExpression = lessonDNA.age_expressions[ageCategory];
    
    if (!ageExpression) {
      throw new Error(`No age expression found for category: ${ageCategory}`);
    }

    const transformedContent = {
      // Core transformation
      conceptName: ageExpression.concept_name,
      coreMetaphor: ageExpression.core_metaphor,
      complexityLevel: ageExpression.complexity_level,
      attentionSpan: this.calculateAttentionSpan(targetAge, ageExpression.attention_span),
      
      // Cognitive adaptations
      abstractConcepts: this.transformAbstractConcepts(
        ageExpression.abstract_concepts, 
        cognitiveProfile, 
        targetAge
      ),
      
      // Example selection and adaptation
      examples: this.selectAndAdaptExamples(
        ageExpression.examples,
        lessonDNA.example_selector_data,
        targetAge,
        cognitiveProfile
      ),
      
      // Vocabulary and language
      vocabulary: this.adaptVocabulary(ageExpression.vocabulary, cognitiveProfile, targetAge),
      
      // Learning structure
      learningStructure: this.adaptLearningStructure(
        lessonDNA.core_lesson_structure,
        cognitiveProfile,
        targetAge
      ),
      
      // Metadata
      ageMetadata: {
        targetAge,
        ageCategory,
        cognitiveStage: cognitiveProfile.stage,
        developmentalFocus: cognitiveProfile.developmentalFocus,
        optimalDuration: this.calculateOptimalDuration(targetAge, cognitiveProfile)
      }
    };

    this.contextCache.set(cacheKey, transformedContent);
    return transformedContent;
  }

  /**
   * Age to Category Mapping with Nuanced Boundaries
   */
  mapAgeToCategory(age) {
    if (age <= 7) return 'early_childhood';
    if (age <= 17) return 'youth';
    if (age <= 35) return 'young_adult';
    if (age <= 65) return 'midlife';
    return 'wisdom_years';
  }

  /**
   * Abstract Concept Transformation - Core Intelligence
   */
  transformAbstractConcepts(abstractConcepts, cognitiveProfile, targetAge) {
    const transformed = {};
    
    for (const [concept, definition] of Object.entries(abstractConcepts)) {
      transformed[concept] = this.adaptConceptForAge(concept, definition, cognitiveProfile, targetAge);
    }
    
    return transformed;
  }

  adaptConceptForAge(concept, definition, cognitiveProfile, targetAge) {
    const baseAdaptation = {
      originalConcept: concept,
      ageAppropriateDefinition: definition,
      cognitiveApproach: cognitiveProfile.learningStyle,
      concreteExamples: this.generateConcreteExamples(concept, targetAge),
      practicalApplication: this.generatePracticalApplication(concept, targetAge)
    };

    // Apply age-specific transformations
    switch (cognitiveProfile.stage) {
      case 'concrete_operational':
        return this.adaptForConcreteThinking(baseAdaptation, targetAge);
      
      case 'formal_operational_developing':
        return this.adaptForDevelopingAbstraction(baseAdaptation, targetAge);
      
      case 'formal_operational_full':
        return this.adaptForFullAbstraction(baseAdaptation, targetAge);
      
      case 'integrated_wisdom':
        return this.adaptForWisdomIntegration(baseAdaptation, targetAge);
      
      default:
        return baseAdaptation;
    }
  }

  /**
   * Age-Specific Concept Adaptations
   */
  adaptForConcreteThinking(adaptation, targetAge) {
    return {
      ...adaptation,
      cognitiveApproach: 'concrete_examples_and_actions',
      explanation: this.makeConcreteAndVisible(adaptation.ageAppropriateDefinition),
      learningMethod: 'hands_on_practice_with_immediate_feedback',
      memoryAids: this.createVisualMemoryAids(adaptation.originalConcept, targetAge)
    };
  }

  adaptForDevelopingAbstraction(adaptation, targetAge) {
    return {
      ...adaptation,
      cognitiveApproach: 'bridge_concrete_to_abstract',
      explanation: this.addAbstractLayer(adaptation.ageAppropriateDefinition),
      learningMethod: 'pattern_recognition_with_multiple_examples',
      connectionMaking: this.generateCross_domainConnections(adaptation.originalConcept, targetAge)
    };
  }

  adaptForFullAbstraction(adaptation, targetAge) {
    return {
      ...adaptation,
      cognitiveApproach: 'systems_thinking_and_principles',
      explanation: this.addSystemicContext(adaptation.ageAppropriateDefinition),
      learningMethod: 'principle_application_across_contexts',
      transferability: this.generateTransferableSkills(adaptation.originalConcept, targetAge)
    };
  }

  adaptForWisdomIntegration(adaptation, targetAge) {
    return {
      ...adaptation,
      cognitiveApproach: 'wisdom_integration_and_teaching_others',
      explanation: this.addWisdomPerspective(adaptation.ageAppropriateDefinition),
      learningMethod: 'reflection_synthesis_and_sharing',
      legacyConnection: this.generateLegacyConnection(adaptation.originalConcept, targetAge)
    };
  }

  /**
   * Example Selection and Adaptation
   */
  selectAndAdaptExamples(ageExamples, fullExampleData, targetAge, cognitiveProfile) {
    // Get base examples for this age category
    const baseExamples = ageExamples || [];
    
    // Select most relevant examples based on specific age
    const selectedExamples = this.selectMostRelevantExamples(baseExamples, targetAge);
    
    // Adapt examples for cognitive level
    const adaptedExamples = selectedExamples.map(example => 
      this.adaptExampleForCognition(example, cognitiveProfile, targetAge)
    );
    
    // Add age-specific contextual details
    return adaptedExamples.map(example => ({
      ...example,
      ageRelevance: this.calculateExampleRelevance(example, targetAge),
      cognitiveLoad: this.calculateCognitiveLoad(example, cognitiveProfile),
      practicalityScore: this.calculatePracticalityScore(example, targetAge)
    }));
  }

  selectMostRelevantExamples(examples, targetAge) {
    return examples
      .map(example => ({
        example,
        relevanceScore: this.calculateAgeRelevance(example, targetAge)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3) // Top 3 most relevant
      .map(item => item.example);
  }

  adaptExampleForCognition(example, cognitiveProfile, targetAge) {
    const adaptedExample = {
      originalExample: example,
      cognitiveAdaptation: cognitiveProfile.stage
    };

    switch (cognitiveProfile.stage) {
      case 'concrete_operational':
        return {
          ...adaptedExample,
          description: this.makeExampleConcrete(example, targetAge),
          visualization: this.addVisualElements(example),
          immediateApplication: this.createImmediateApplication(example, targetAge)
        };
      
      case 'formal_operational_developing':
        return {
          ...adaptedExample,
          description: this.addPatternRecognition(example, targetAge),
          connections: this.showConnectionsToOtherSituations(example),
          principleExtraction: this.helpExtractPrinciples(example, targetAge)
        };
      
      case 'formal_operational_full':
        return {
          ...adaptedExample,
          description: this.addSystemicPerspective(example, targetAge),
          applications: this.showMultipleContextApplications(example),
          strategicThinking: this.encourageStrategicThinking(example, targetAge)
        };
      
      case 'integrated_wisdom':
        return {
          ...adaptedExample,
          description: this.addWisdomContext(example, targetAge),
          teachingOpportunity: this.identifyTeachingOpportunities(example),
          legacyImpact: this.connectToLegacyThinking(example, targetAge)
        };
      
      default:
        return adaptedExample;
    }
  }

  /**
   * Vocabulary Adaptation
   */
  adaptVocabulary(vocabulary, cognitiveProfile, targetAge) {
    if (!vocabulary) return [];
    
    return vocabulary.map(word => ({
      word,
      ageAppropriateness: this.assessVocabularyAppropriateness(word, targetAge),
      cognitiveSupport: this.generateCognitiveSupport(word, cognitiveProfile),
      contextualDefinition: this.createContextualDefinition(word, targetAge),
      practiceOpportunities: this.generatePracticeOpportunities(word, targetAge)
    }));
  }

  /**
   * Learning Structure Adaptation
   */
  adaptLearningStructure(coreStructure, cognitiveProfile, targetAge) {
    const adaptedStructure = {};
    
    for (const [questionKey, questionData] of Object.entries(coreStructure)) {
      adaptedStructure[questionKey] = this.adaptQuestionForAge(questionData, cognitiveProfile, targetAge);
    }
    
    return adaptedStructure;
  }

  adaptQuestionForAge(questionData, cognitiveProfile, targetAge) {
    return {
      ...questionData,
      cognitiveApproach: this.determineCognitiveApproach(questionData, cognitiveProfile),
      complexityLevel: this.adjustComplexityForAge(questionData, targetAge),
      scaffolding: this.generateScaffolding(questionData, cognitiveProfile, targetAge),
      feedbackStyle: this.determineFeedbackStyle(cognitiveProfile, targetAge),
      processingTime: this.calculateProcessingTime(questionData, cognitiveProfile, targetAge)
    };
  }

  /**
   * Attention Span and Duration Calculations
   */
  calculateAttentionSpan(targetAge, baseAttentionSpan) {
    // Research-based attention span calculations
    const developmentalAttentionSpan = this.getDevelopmentalAttentionSpan(targetAge);
    const optimalSpan = Math.min(
      this.parseTimeToSeconds(baseAttentionSpan),
      developmentalAttentionSpan
    );
    
    return {
      optimal: optimalSpan,
      minimum: Math.floor(optimalSpan * 0.7),
      maximum: Math.floor(optimalSpan * 1.3),
      breakRecommendation: this.calculateBreakRecommendation(targetAge, optimalSpan)
    };
  }

  getDevelopmentalAttentionSpan(age) {
    // Research-based attention span by age (in seconds)
    if (age <= 3) return 180; // 3 minutes
    if (age <= 5) return 240; // 4 minutes
    if (age <= 7) return 300; // 5 minutes
    if (age <= 12) return 360; // 6 minutes
    if (age <= 17) return 360; // 6 minutes
    return 360; // 6 minutes (optimal for adults regardless of age)
  }

  calculateOptimalDuration(targetAge, cognitiveProfile) {
    const baseAttention = this.getDevelopmentalAttentionSpan(targetAge);
    const cognitiveModifier = this.getCognitiveModifier(cognitiveProfile);
    
    return {
      lessonDuration: Math.floor(baseAttention * cognitiveModifier),
      segmentRecommendation: this.getSegmentRecommendation(targetAge),
      interactionFrequency: this.getInteractionFrequency(targetAge),
      recoveryTime: this.getRecoveryTime(targetAge)
    };
  }

  /**
   * Cognitive Stage Configuration
   */
  loadCognitiveStages() {
    return {
      early_childhood: {
        stage: 'concrete_operational',
        developmentalFocus: 'concrete_thinking_and_immediate_experience',
        learningStyle: 'hands_on_visual_repetitive',
        abstractThinking: 'minimal',
        attentionSpan: 'short_bursts_with_frequent_breaks',
        memorySupport: 'visual_and_repetitive_needed',
        motivationalDrivers: ['fun', 'immediate_success', 'social_approval']
      },
      youth: {
        stage: 'formal_operational_developing',
        developmentalFocus: 'abstract_thinking_development_and_identity_formation',
        learningStyle: 'pattern_recognition_with_peer_interaction',
        abstractThinking: 'developing',
        attentionSpan: 'moderate_with_engaging_content',
        memorySupport: 'connecting_to_existing_knowledge',
        motivationalDrivers: ['peer_recognition', 'autonomy', 'relevance_to_identity']
      },
      young_adult: {
        stage: 'formal_operational_full',
        developmentalFocus: 'practical_application_and_skill_building',
        learningStyle: 'goal_oriented_and_application_focused',
        abstractThinking: 'full',
        attentionSpan: 'sustained_with_clear_purpose',
        memorySupport: 'connecting_to_goals_and_experience',
        motivationalDrivers: ['practical_value', 'career_advancement', 'independence']
      },
      midlife: {
        stage: 'formal_operational_full',
        developmentalFocus: 'leadership_and_contribution_to_others',
        learningStyle: 'systems_thinking_and_knowledge_integration',
        abstractThinking: 'sophisticated',
        attentionSpan: 'sustained_and_deep',
        memorySupport: 'connecting_to_existing_expertise',
        motivationalDrivers: ['impact_on_others', 'mastery', 'legacy_building']
      },
      wisdom_years: {
        stage: 'integrated_wisdom',
        developmentalFocus: 'wisdom_integration_and_sharing_knowledge',
        learningStyle: 'reflection_synthesis_and_teaching',
        abstractThinking: 'integrated_with_experience',
        attentionSpan: 'selective_and_deep',
        memorySupport: 'connecting_to_life_experience',
        motivationalDrivers: ['sharing_wisdom', 'legacy', 'meaningful_contribution']
      }
    };
  }

  /**
   * Developmental Milestones Configuration
   */
  loadDevelopmentalMilestones() {
    return {
      cognitive_development: {
        2: ['basic_language', 'simple_cause_effect'],
        5: ['complex_sentences', 'basic_problem_solving'],
        8: ['abstract_concepts_emerging', 'logical_thinking'],
        12: ['hypothetical_thinking', 'multiple_perspectives'],
        16: ['complex_abstract_reasoning', 'future_planning'],
        25: ['expertise_development', 'strategic_thinking'],
        40: ['wisdom_integration', 'mentoring_others'],
        65: ['legacy_perspective', 'meaning_making']
      },
      social_development: {
        2: ['parallel_play', 'basic_sharing'],
        5: ['cooperative_play', 'rule_following'],
        8: ['peer_groups', 'fairness_concepts'],
        12: ['identity_exploration', 'peer_influence'],
        16: ['relationship_complexity', 'value_formation'],
        25: ['intimate_relationships', 'career_building'],
        40: ['leadership_roles', 'community_contribution'],
        65: ['wisdom_sharing', 'intergenerational_connection']
      }
    };
  }

  /**
   * Helper Methods for Content Adaptation
   */
  makeConcreteAndVisible(definition) {
    return definition
      .replace(/abstract_concept/g, 'something_you_can_see_and_do')
      .replace(/principle/g, 'rule_that_works')
      .replace(/strategy/g, 'way_to_do_something');
  }

  addAbstractLayer(definition) {
    return `${definition} This pattern shows up in many different situations, helping you recognize when to use these same ideas.`;
  }

  addSystemicContext(definition) {
    return `${definition} This principle connects to broader systems and can be applied strategically across multiple contexts for maximum impact.`;
  }

  addWisdomPerspective(definition) {
    return `${definition} This understanding, cultivated over time, becomes wisdom that can be shared to help others navigate similar challenges.`;
  }

  calculateAgeRelevance(example, targetAge) {
    // Complex algorithm to determine how relevant an example is to specific age
    // Would consider life stage, typical experiences, cognitive development
    return Math.random() * 0.3 + 0.7; // Placeholder: 0.7-1.0 range
  }

  calculateCognitiveLoad(example, cognitiveProfile) {
    // Assess how mentally demanding this example is for this cognitive stage
    return Math.random() * 0.4 + 0.3; // Placeholder: 0.3-0.7 range
  }

  calculatePracticalityScore(example, targetAge) {
    // How practically applicable is this example for someone this age
    return Math.random() * 0.3 + 0.7; // Placeholder: 0.7-1.0 range
  }

  parseTimeToSeconds(timeString) {
    // Parse "3-4_minutes" to seconds
    const match = timeString.match(/(\d+)/);
    return match ? parseInt(match[1]) * 60 : 360;
  }

  getCognitiveModifier(cognitiveProfile) {
    const modifiers = {
      'concrete_operational': 0.8,
      'formal_operational_developing': 0.9,
      'formal_operational_full': 1.0,
      'integrated_wisdom': 1.0
    };
    return modifiers[cognitiveProfile.stage] || 1.0;
  }

  getSegmentRecommendation(age) {
    if (age <= 7) return 'very_short_segments_with_frequent_interaction';
    if (age <= 17) return 'short_segments_with_regular_engagement';
    return 'moderate_segments_with_meaningful_interaction';
  }

  getInteractionFrequency(age) {
    if (age <= 7) return 'every_30_seconds';
    if (age <= 17) return 'every_60_seconds';
    return 'every_90_seconds';
  }

  /**
   * Quality Assessment Methods
   */
  validateAgeAppropriateness(transformedContent, targetAge) {
    return {
      vocabularyLevel: this.assessVocabularyLevel(transformedContent.vocabulary, targetAge),
      conceptComplexity: this.assessConceptComplexity(transformedContent.abstractConcepts, targetAge),
      exampleRelevance: this.assessExampleRelevance(transformedContent.examples, targetAge),
      attentionSpanAlignment: this.assessAttentionSpanAlignment(transformedContent.attentionSpan, targetAge),
      developmentalAlignment: this.assessDevelopmentalAlignment(transformedContent, targetAge),
      overallScore: 0 // Calculated from above metrics
    };
  }

  assessVocabularyLevel(vocabulary, targetAge) {
    // Implement vocabulary assessment logic
    return 0.88; // Placeholder
  }

  assessConceptComplexity(concepts, targetAge) {
    // Implement concept complexity assessment
    return 0.85; // Placeholder
  }

  assessExampleRelevance(examples, targetAge) {
    // Implement example relevance assessment
    return 0.92; // Placeholder
  }

  assessAttentionSpanAlignment(attentionSpan, targetAge) {
    // Implement attention span assessment
    return 0.90; // Placeholder
  }

  assessDevelopmentalAlignment(content, targetAge) {
    // Implement overall developmental alignment assessment
    return 0.87; // Placeholder
  }
}

module.exports = AgeContextualizer;