const _ = require('lodash');

class ToneDeliveryEngine {
  constructor() {
    this.toneProfiles = this.loadToneProfiles();
    this.ageToToneAdaptations = this.loadAgeToToneAdaptations();
    this.languagePatternLibrary = this.loadLanguagePatternLibrary();
    this.deliveryCache = new Map();
  }

  /**
   * Main method: Apply authentic tone to age-contextualized content
   */
  craftVoice(ageContextualizedContent, tone, targetAge, culturalContext = 'neutral') {
    const cacheKey = `${tone}_${targetAge}_${culturalContext}_${JSON.stringify(ageContextualizedContent).slice(0, 50)}`;
    if (this.deliveryCache.has(cacheKey)) {
      return this.deliveryCache.get(cacheKey);
    }

    const toneProfile = this.getToneProfile(tone);
    const ageAdaptation = this.getAgeToToneAdaptation(tone, targetAge);
    const culturalSensitivity = this.getCulturalSensitivity(tone, culturalContext);

    const craftedVoice = {
      // Core voice characteristics
      voiceCharacter: this.adaptVoiceCharacter(toneProfile, ageAdaptation, culturalSensitivity),
      
      // Language pattern application
      languagePatterns: this.applyLanguagePatterns(
        ageContextualizedContent, 
        toneProfile, 
        ageAdaptation
      ),
      
      // Emotional delivery
      emotionalDelivery: this.craftEmotionalDelivery(
        ageContextualizedContent,
        toneProfile,
        targetAge
      ),
      
      // Interactive elements
      interactionStyle: this.craftInteractionStyle(
        toneProfile,
        ageAdaptation,
        ageContextualizedContent.ageMetadata
      ),
      
      // Content-specific adaptations
      contentAdaptations: this.adaptContentForTone(
        ageContextualizedContent,
        toneProfile,
        targetAge
      ),
      
      // Quality metadata
      toneMetadata: {
        appliedTone: tone,
        targetAge,
        culturalContext,
        authenticityScore: this.calculateAuthenticityScore(toneProfile, ageAdaptation),
        engagementPotential: this.calculateEngagementPotential(toneProfile, targetAge)
      }
    };

    this.deliveryCache.set(cacheKey, craftedVoice);
    return craftedVoice;
  }

  /**
   * Voice Character Adaptation - The personality core
   */
  adaptVoiceCharacter(toneProfile, ageAdaptation, culturalSensitivity) {
    const baseCharacter = toneProfile.voice_character;
    
    return {
      corePersonality: this.adaptPersonalityForAge(baseCharacter, ageAdaptation),
      emotionalTemperature: this.adjustEmotionalTemperature(
        toneProfile.emotional_temperature, 
        ageAdaptation
      ),
      authorityLevel: this.determineAuthorityLevel(toneProfile, ageAdaptation),
      intimacyLevel: this.determineIntimacyLevel(toneProfile, ageAdaptation),
      energyLevel: this.adjustEnergyLevel(toneProfile, ageAdaptation),
      culturalAdaptation: this.applyCulturalSensitivity(toneProfile, culturalSensitivity)
    };
  }

  adaptPersonalityForAge(basePersonality, ageAdaptation) {
    const ageSpecificTraits = ageAdaptation.personalityModifications || {};
    
    // Blend base personality with age-specific modifications
    return {
      primary: basePersonality,
      ageSpecificModifications: ageSpecificTraits,
      blendedCharacteristics: this.blendPersonalityTraits(basePersonality, ageSpecificTraits)
    };
  }

  /**
   * Language Pattern Application - The voice in action
   */
  applyLanguagePatterns(content, toneProfile, ageAdaptation) {
    const patterns = toneProfile.language_patterns;
    const agePatterns = ageAdaptation.languageAdaptations || {};
    
    return {
      openings: this.adaptOpenings(patterns.openings, content, ageAdaptation),
      transitions: this.adaptTransitions(patterns.transitions, content, ageAdaptation),
      encouragements: this.adaptEncouragements(patterns.encouragements, content, ageAdaptation),
      explanations: this.adaptExplanations(content.abstractConcepts, toneProfile, ageAdaptation),
      questionFraming: this.adaptQuestionFraming(content.learningStructure, toneProfile, ageAdaptation),
      closings: this.adaptClosings(patterns.closings, content, ageAdaptation)
    };
  }

  adaptOpenings(baseOpenings, content, ageAdaptation) {
    return baseOpenings.map(opening => ({
      originalOpening: opening,
      ageAdaptedOpening: this.applyAgeAdaptation(opening, ageAdaptation, 'opening'),
      contextualFit: this.assessContextualFit(opening, content),
      usageRecommendation: this.getUsageRecommendation(opening, ageAdaptation)
    }));
  }

  adaptTransitions(baseTransitions, content, ageAdaptation) {
    return baseTransitions.map(transition => ({
      originalTransition: transition,
      ageAdaptedTransition: this.applyAgeAdaptation(transition, ageAdaptation, 'transition'),
      conceptualBridge: this.createConceptualBridge(transition, content),
      cognitiveSupport: this.addCognitiveSupport(transition, ageAdaptation)
    }));
  }

  adaptEncouragements(baseEncouragements, content, ageAdaptation) {
    return baseEncouragements.map(encouragement => ({
      originalEncouragement: encouragement,
      ageAdaptedEncouragement: this.applyAgeAdaptation(encouragement, ageAdaptation, 'encouragement'),
      motivationalAlignment: this.alignWithMotivation(encouragement, ageAdaptation),
      personalizedVariations: this.createPersonalizedVariations(encouragement, content, ageAdaptation)
    }));
  }

  /**
   * Emotional Delivery Crafting
   */
  craftEmotionalDelivery(content, toneProfile, targetAge) {
    const emotionalMap = this.createEmotionalMap(toneProfile, targetAge);
    
    return {
      overallEmotionalArc: this.designEmotionalArc(content, emotionalMap),
      momentToMomentEmotions: this.mapMomentToMomentEmotions(content, emotionalMap),
      emotionalSupports: this.createEmotionalSupports(content, toneProfile, targetAge),
      energyManagement: this.designEnergyManagement(content, emotionalMap, targetAge)
    };
  }

  createEmotionalMap(toneProfile, targetAge) {
    const baseEmotions = toneProfile.emotional_range || [];
    const ageAppropriateEmotions = this.filterAgeAppropriateEmotions(baseEmotions, targetAge);
    
    return {
      primaryEmotions: ageAppropriateEmotions.slice(0, 3),
      supportingEmotions: ageAppropriateEmotions.slice(3, 6),
      intensityRange: this.calculateIntensityRange(toneProfile, targetAge),
      emotionalTransitions: this.designEmotionalTransitions(ageAppropriateEmotions, targetAge)
    };
  }

  /**
   * Interaction Style Crafting
   */
  craftInteractionStyle(toneProfile, ageAdaptation, ageMetadata) {
    return {
      questionApproach: this.designQuestionApproach(toneProfile, ageAdaptation),
      responseHandling: this.designResponseHandling(toneProfile, ageAdaptation),
      encouragementTiming: this.designEncouragementTiming(ageMetadata, toneProfile),
      errorHandling: this.designErrorHandling(toneProfile, ageAdaptation),
      successCelebration: this.designSuccessCelebration(toneProfile, ageAdaptation),
      redirectionStrategy: this.designRedirectionStrategy(toneProfile, ageAdaptation)
    };
  }

  designQuestionApproach(toneProfile, ageAdaptation) {
    return {
      questionStyle: this.adaptQuestionStyle(toneProfile.question_approach, ageAdaptation),
      waitTime: this.calculateOptimalWaitTime(ageAdaptation),
      promptingStrategy: this.designPromptingStrategy(toneProfile, ageAdaptation),
      scaffoldingLevel: this.determineScaffoldingLevel(ageAdaptation)
    };
  }

  /**
   * Content-Specific Tone Adaptations
   */
  adaptContentForTone(content, toneProfile, targetAge) {
    return {
      conceptExplanations: this.adaptConceptExplanations(content.abstractConcepts, toneProfile, targetAge),
      exampleDelivery: this.adaptExampleDelivery(content.examples, toneProfile, targetAge),
      vocabularyPresentation: this.adaptVocabularyPresentation(content.vocabulary, toneProfile, targetAge),
      practiceActivities: this.adaptPracticeActivities(content.learningStructure, toneProfile, targetAge),
      assessmentStyle: this.adaptAssessmentStyle(content.learningStructure, toneProfile, targetAge)
    };
  }

  adaptConceptExplanations(concepts, toneProfile, targetAge) {
    const adaptedConcepts = {};
    
    for (const [conceptName, conceptData] of Object.entries(concepts)) {
      adaptedConcepts[conceptName] = {
        toneAdaptedExplanation: this.applyToneToExplanation(conceptData, toneProfile),
        metaphorDelivery: this.adaptMetaphorDelivery(conceptData, toneProfile, targetAge),
        reinforcementStrategy: this.designReinforcementStrategy(conceptData, toneProfile, targetAge),
        practicalConnection: this.createPracticalConnection(conceptData, toneProfile, targetAge)
      };
    }
    
    return adaptedConcepts;
  }

  adaptExampleDelivery(examples, toneProfile, targetAge) {
    return examples.map(example => ({
      ...example,
      toneAdaptedPresentation: this.applyToneToExample(example, toneProfile),
      emotionalFraming: this.addEmotionalFraming(example, toneProfile, targetAge),
      interactiveElements: this.addInteractiveElements(example, toneProfile, targetAge),
      connectionPrompts: this.createConnectionPrompts(example, toneProfile, targetAge)
    }));
  }

  /**
   * Tone Profile Configuration
   */
  loadToneProfiles() {
    return {
      grandmother: {
        voice_character: 'loving_wise_elder_sharing_life_lessons',
        emotional_temperature: 'warm_patient_nurturing',
        emotional_range: ['love', 'pride', 'gentle_concern', 'warm_joy', 'peaceful_wisdom'],
        authority_level: 'gentle_guidance',
        intimacy_level: 'close_family',
        energy_level: 'calm_steady',
        language_patterns: {
          openings: ['Oh sweetheart,', 'My dear one,', 'Precious,', 'Come sit with me,'],
          transitions: ['Now let me share something beautiful', 'Here\'s what I\'ve learned', 'Let me tell you what I\'ve discovered'],
          encouragements: ['What a wise soul you are!', 'You have such beautiful insight!', 'Oh, what a treasure you are!'],
          closings: ['Rest well tonight, dear heart', 'What a blessing you are', 'See you tomorrow, precious one']
        },
        metaphor_style: 'heart_centered_nature_garden_home_based',
        question_approach: 'gentle_caring_curiosity_that_honors_feelings',
        validation_style: 'deep_affirmation_of_character_and_wisdom',
        cultural_adaptability: 'high' // Grandmother love is universal
      },
      
      fun: {
        voice_character: 'enthusiastic_adventure_guide_and_cheerleader',
        emotional_temperature: 'high_energy_celebratory_playful',
        emotional_range: ['excitement', 'joy', 'pride', 'enthusiasm', 'playful_challenge'],
        authority_level: 'encouraging_coach',
        intimacy_level: 'enthusiastic_friend',
        energy_level: 'high_dynamic',
        language_patterns: {
          openings: ['Alright, superstar!', 'Ready to level up?', 'Time for some magic!', 'Welcome to the adventure!'],
          transitions: ['Plot twist!', 'Here\'s where it gets epic', 'Time for the secret weapon', 'BOOM! Next level'],
          encouragements: ['YES! You nailed it!', 'Legendary status achieved!', 'You\'re crushing this!', 'BOOM! Activated!'],
          closings: ['You\'re going to crush it!', 'This is going to be incredible!', 'See you tomorrow, champion!']
        },
        metaphor_style: 'gaming_superhero_adventure_sports_achievement_based',
        question_approach: 'exciting_challenges_and_strategic_missions',
        validation_style: 'achievement_celebration_and_skill_mastery_recognition',
        cultural_adaptability: 'medium' // Energy levels vary by culture
      },
      
      neutral: {
        voice_character: 'knowledgeable_professional_mentor_and_guide',
        emotional_temperature: 'calm_confident_respectful',
        emotional_range: ['confidence', 'respect', 'satisfaction', 'professional_warmth', 'focused_interest'],
        authority_level: 'knowledgeable_guide',
        intimacy_level: 'professional_mentor',
        energy_level: 'steady_focused',
        language_patterns: {
          openings: ['Today we\'re exploring', 'Let\'s examine', 'Here\'s an important principle', 'Consider this'],
          transitions: ['Building on that understanding', 'The next principle', 'Now let\'s consider', 'This leads us to'],
          encouragements: ['Excellent thinking', 'You understand the key principle', 'That\'s exactly right', 'You\'ve grasped it'],
          closings: ['These skills will serve you well', 'You\'ve built a solid foundation', 'This understanding will benefit you']
        },
        metaphor_style: 'strategic_practical_professional_relationship_building_based',
        question_approach: 'thoughtful_analytical_inquiry',
        validation_style: 'competence_recognition_and_skill_acknowledgment',
        cultural_adaptability: 'high' // Professional tone translates well
      }
    };
  }

  /**
   * Age-to-Tone Adaptation Configuration
   */
  loadAgeToToneAdaptations() {
    return {
      grandmother: {
        early_childhood: {
          personalityModifications: {
            extra_gentleness: 'speaks_even_more_softly_and_patiently',
            simple_wisdom: 'shares_wisdom_in_very_simple_ways',
            protective_care: 'extra_protective_and_nurturing_language'
          },
          languageAdaptations: {
            vocabulary_simplification: 'uses_simplest_loving_words',
            sentence_length: 'very_short_loving_sentences',
            repetition_style: 'gentle_loving_repetition'
          },
          emotionalAdaptations: {
            intensity_reduction: 'softer_emotions_to_avoid_overwhelming',
            safety_emphasis: 'extra_emphasis_on_emotional_safety',
            patience_increase: 'infinite_patience_for_learning'
          }
        },
        youth: {
          personalityModifications: {
            understanding_tone: 'acknowledges_growing_independence',
            wisdom_sharing: 'shares_deeper_wisdom_about_relationships',
            respectful_guidance: 'guides_while_respecting_emerging_autonomy'
          },
          languageAdaptations: {
            complexity_increase: 'uses_more_sophisticated_loving_language',
            story_integration: 'shares_relevant_life_stories_and_examples',
            choice_acknowledgment: 'acknowledges_their_developing_decision_making'
          }
        },
        young_adult: {
          personalityModifications: {
            peer_wisdom: 'shares_wisdom_more_as_peer_than_authority',
            life_experience: 'draws_on_rich_life_experience_to_guide',
            supportive_presence: 'supportive_presence_for_life_challenges'
          }
        },
        midlife: {
          personalityModifications: {
            mutual_respect: 'acknowledges_their_wisdom_and_experience',
            deep_sharing: 'shares_deeper_life_insights_and_perspectives',
            collaborative_wisdom: 'collaborates_in_wisdom_sharing'
          }
        },
        wisdom_years: {
          personalityModifications: {
            peer_to_peer: 'speaks_as_peer_with_shared_life_experience',
            mutual_learning: 'acknowledges_learning_from_each_other',
            legacy_connection: 'connects_around_shared_legacy_thinking'
          }
        }
      },
      
      fun: {
        early_childhood: {
          personalityModifications: {
            playful_energy: 'maintains_high_energy_but_age_appropriate',
            wonder_focus: 'emphasizes_wonder_and_discovery',
            celebration_style: 'celebrates_small_wins_with_big_enthusiasm'
          },
          languageAdaptations: {
            simple_excitement: 'uses_simple_but_enthusiastic_language',
            action_oriented: 'focuses_on_doing_and_moving',
            immediate_rewards: 'celebrates_immediate_accomplishments'
          }
        },
        youth: {
          personalityModifications: {
            peer_energy: 'matches_their_natural_enthusiasm_level',
            achievement_focus: 'focuses_on_skill_building_and_mastery',
            social_awareness: 'acknowledges_peer_relationships_and_identity'
          }
        },
        young_adult: {
          personalityModifications: {
            goal_oriented_energy: 'channels_energy_toward_practical_goals',
            confidence_building: 'builds_confidence_for_life_challenges',
            strategic_excitement: 'gets_excited_about_strategic_thinking'
          }
        },
        midlife: {
          personalityModifications: {
            leadership_energy: 'celebrates_leadership_and_impact_potential',
            mastery_excitement: 'gets_excited_about_deep_skill_mastery',
            contribution_focus: 'emphasizes_contributing_to_others'
          }
        },
        wisdom_years: {
          personalityModifications: {
            vitality_celebration: 'celebrates_continued_vitality_and_growth',
            wisdom_appreciation: 'gets_excited_about_sharing_wisdom',
            legacy_enthusiasm: 'enthusiastic_about_legacy_and_impact'
          }
        }
      },
      
      neutral: {
        early_childhood: {
          personalityModifications: {
            gentle_professionalism: 'maintains_professionalism_but_very_gentle',
            clear_structure: 'provides_clear_structure_and_expectations',
            patient_guidance: 'patient_professional_guidance'
          }
        },
        youth: {
          personalityModifications: {
            respectful_teaching: 'teaches_while_respecting_developing_autonomy',
            skill_focus: 'focuses_on_practical_skill_development',
            future_orientation: 'connects_to_future_applications'
          }
        },
        young_adult: {
          personalityModifications: {
            peer_professionalism: 'professional_but_peer_like_approach',
            practical_focus: 'emphasizes_immediate_practical_application',
            competence_building: 'builds_sense_of_competence_and_capability'
          }
        }
      }
    };
  }

  /**
   * Helper Methods for Tone Application
   */
  applyAgeAdaptation(baseContent, ageAdaptation, contentType) {
    const adaptations = ageAdaptation.languageAdaptations || {};
    let adapted = baseContent;
    
    // Apply specific adaptations based on content type
    if (contentType === 'opening' && adaptations.vocabulary_simplification) {
      adapted = this.simplifyVocabulary(adapted);
    }
    
    if (adaptations.sentence_length === 'very_short_loving_sentences') {
      adapted = this.shortenSentences(adapted);
    }
    
    return adapted;
  }

  blendPersonalityTraits(basePersonality, ageSpecificTraits) {
    // Complex blending algorithm for personality traits
    return {
      dominantTraits: this.identifyDominantTraits(basePersonality, ageSpecificTraits),
      balancingFactors: this.identifyBalancingFactors(basePersonality, ageSpecificTraits),
      expressionStyle: this.determineExpressionStyle(basePersonality, ageSpecificTraits)
    };
  }

  calculateAuthenticityScore(toneProfile, ageAdaptation) {
    // Calculate how authentic this tone feels for this age
    const baseAuthenticity = 0.85;
    const ageAlignment = this.assessAgeAlignment(toneProfile, ageAdaptation);
    const consistencyScore = this.assessConsistency(toneProfile, ageAdaptation);
    
    return (baseAuthenticity + ageAlignment + consistencyScore) / 3;
  }

  calculateEngagementPotential(toneProfile, targetAge) {
    // Calculate how engaging this tone is likely to be for this age
    const energyAlignment = this.assessEnergyAlignment(toneProfile, targetAge);
    const emotionalResonance = this.assessEmotionalResonance(toneProfile, targetAge);
    const motivationalAlignment = this.assessMotivationalAlignment(toneProfile, targetAge);
    
    return (energyAlignment + emotionalResonance + motivationalAlignment) / 3;
  }

  /**
   * Quality Assessment Methods
   */
  validateToneAuthenticity(craftedVoice, originalTone, targetAge) {
    return {
      toneConsistency: this.assessToneConsistency(craftedVoice, originalTone),
      ageAppropriateness: this.assessToneAgeAppropriateness(craftedVoice, targetAge),
      emotionalAlignment: this.assessEmotionalAlignment(craftedVoice, originalTone),
      languagePatternCoherence: this.assessLanguagePatternCoherence(craftedVoice),
      interactionStyleEffectiveness: this.assessInteractionStyleEffectiveness(craftedVoice, targetAge),
      overallAuthenticity: 0 // Calculated from above metrics
    };
  }

  // Placeholder implementations for assessment methods
  assessToneConsistency(craftedVoice, originalTone) { return 0.88; }
  assessToneAgeAppropriateness(craftedVoice, targetAge) { return 0.85; }
  assessEmotionalAlignment(craftedVoice, originalTone) { return 0.90; }
  assessLanguagePatternCoherence(craftedVoice) { return 0.87; }
  assessInteractionStyleEffectiveness(craftedVoice, targetAge) { return 0.89; }
  assessAgeAlignment(toneProfile, ageAdaptation) { return 0.86; }
  assessConsistency(toneProfile, ageAdaptation) { return 0.88; }
  assessEnergyAlignment(toneProfile, targetAge) { return 0.85; }
  assessEmotionalResonance(toneProfile, targetAge) { return 0.87; }
  assessMotivationalAlignment(toneProfile, targetAge) { return 0.84; }
}

module.exports = ToneDeliveryEngine;