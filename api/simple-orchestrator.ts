// Simplified orchestrator for Cloudflare Workers
export class SimpleOrchestrator {
  async generateLesson(lessonId: string, age: number, tone: string, language: string = 'english', options: any = {}) {
    console.log(`Generating lesson: ${lessonId}, age:${age}, tone:${tone}, language:${language}`);
    
    // Map age to category
    const ageCategory = this.mapAgeToCategory(age);
    
    // Load lesson DNA (hardcoded for July 11 acoustics)
    const lessonDNA = this.getAcousticsLessonDNA();
    
    // Apply age contextualization
    const ageContext = this.applyAgeContextualization(lessonDNA, ageCategory);
    
    // Apply tone delivery
    const toneDelivery = this.applyToneDelivery(ageContext, tone, age);
    
    // Apply language adaptation
    const languageAdaptation = this.applyLanguageAdaptation(toneDelivery, language);
    
    // Generate 3x2x1 lesson structure
    const lessonScripts = this.generateLessonScripts(lessonDNA, ageContext, toneDelivery, languageAdaptation);
    
    return {
      lesson_metadata: {
        lesson_id: lessonId,
        title: ageContext.concept_name,
        objective: this.craftObjective(lessonDNA, ageContext),
        duration: ageContext.attention_span,
        complexity: ageContext.complexity_level,
        age_target: age,
        tone,
        language,
        generated_at: new Date().toISOString()
      },
      scripts: lessonScripts,
      production_notes: {
        voice_personality: toneDelivery.voice_character,
        key_themes: [lessonDNA.universal_concept, lessonDNA.core_principle],
        difficulty_progression: ageContext.complexity_level,
        real_world_applications: ageContext.examples.map((e: any) => e.scenario),
        cultural_considerations: languageAdaptation.cultural_adaptations,
        age_specific_notes: `Adapted for ${ageCategory} (${age} years old)`,
        conversation_flow: toneDelivery.interaction_style
      }
    };
  }
  
  private mapAgeToCategory(age: number): string {
    if (age <= 7) return 'early_childhood';
    if (age <= 17) return 'youth';
    if (age <= 35) return 'young_adult';
    if (age <= 65) return 'midlife';
    return 'wisdom_years';
  }
  
  private getAcousticsLessonDNA() {
    return {
      lesson_id: "acoustics_july11_192",
      universal_concept: "acoustics",
      core_principle: "sound_physics_enables_communication_and_accessibility",
      learning_essence: "Sound is everywhere - from the music we love to the voices we hear. Understanding how sound works helps us build better technology, design better spaces, and help people who can't hear well.",
      
      age_expressions: {
        early_childhood: {
          concept_name: "Sounds Around Us",
          core_metaphor: "Sound is like invisible waves that tickle our ears",
          complexity_level: "beginner",
          attention_span: 180,
          abstract_concepts: {
            sound: "Something we hear with our ears",
            vibration: "When something shakes back and forth",
            echo: "When sound bounces back to us"
          },
          examples: [
            {
              scenario: "When you clap your hands",
              option_a: "The sound travels through the air like ripples in water",
              option_b: "The sound stays right where your hands are"
            },
            {
              scenario: "When you talk in a big empty room",
              option_a: "Your voice echoes because sound bounces off the walls",
              option_b: "Your voice gets louder because the room is big"
            }
          ],
          vocabulary: ["sound", "loud", "quiet", "echo", "hear"]
        },
        
        youth: {
          concept_name: "The Science of Sound",
          core_metaphor: "Sound is energy traveling through air like waves in the ocean",
          complexity_level: "intermediate",
          attention_span: 300,
          abstract_concepts: {
            sound_waves: "Patterns of air pressure that carry sound",
            frequency: "How fast sound waves vibrate",
            amplitude: "How big or small the sound waves are",
            acoustics: "How sound behaves in different spaces"
          },
          examples: [
            {
              scenario: "Why do some rooms sound echoey and others don't?",
              option_a: "Hard surfaces like walls bounce sound back, soft surfaces like carpets absorb it",
              option_b: "Big rooms always have echoes, small rooms never do"
            },
            {
              scenario: "How do hearing aids help people hear better?",
              option_a: "They make sound waves bigger and clearer for damaged ears",
              option_b: "They create new sounds that replace the ones people can't hear"
            }
          ],
          vocabulary: ["sound waves", "frequency", "amplitude", "acoustics", "hearing aid"]
        },
        
        young_adult: {
          concept_name: "Acoustics and Technology",
          core_metaphor: "Sound physics is the foundation of modern communication and accessibility technology",
          complexity_level: "advanced",
          attention_span: 360,
          abstract_concepts: {
            wave_propagation: "How sound energy travels through different materials",
            resonance: "When objects vibrate at their natural frequency",
            noise_cancellation: "Using opposite sound waves to reduce unwanted noise",
            acoustic_engineering: "Designing spaces and technology for optimal sound"
          },
          examples: [
            {
              scenario: "How do noise-canceling headphones work?",
              option_a: "They create sound waves that are the opposite of unwanted noise, canceling it out",
              option_b: "They block all sound from reaching your ears with physical barriers"
            },
            {
              scenario: "Why do concert halls have special shapes?",
              option_a: "The curved surfaces help sound waves reach every seat clearly and evenly",
              option_b: "The shapes look more interesting and artistic than straight walls"
            }
          ],
          vocabulary: ["wave propagation", "resonance", "noise cancellation", "acoustic engineering", "frequency response"]
        },
        
        midlife: {
          concept_name: "Acoustic Innovation and Impact",
          core_metaphor: "Understanding sound physics enables technologies that connect people and improve lives",
          complexity_level: "expert",
          attention_span: 360,
          abstract_concepts: {
            acoustic_optimization: "Fine-tuning sound environments for specific purposes",
            accessibility_technology: "Using sound science to help people with hearing challenges",
            communication_infrastructure: "How sound physics enables global connectivity",
            environmental_acoustics: "Managing sound pollution and creating healthy soundscapes"
          },
          examples: [
            {
              scenario: "How does acoustic design help people with hearing loss?",
              option_a: "By reducing background noise and focusing sound where it's needed, making speech clearer",
              option_b: "By making everything louder so people can hear better"
            },
            {
              scenario: "Why is sound important in virtual reality?",
              option_a: "3D sound helps our brains understand where things are in virtual space, making it feel real",
              option_b: "Sound makes virtual reality more entertaining and less boring"
            }
          ],
          vocabulary: ["acoustic optimization", "accessibility technology", "communication infrastructure", "environmental acoustics", "spatial audio"]
        },
        
        wisdom_years: {
          concept_name: "The Wisdom of Sound",
          core_metaphor: "Sound connects us across generations and cultures, and understanding it helps us build a more accessible world",
          complexity_level: "master",
          attention_span: 360,
          abstract_concepts: {
            acoustic_heritage: "How sound shapes cultural identity and memory",
            intergenerational_communication: "Using sound technology to bridge age gaps",
            acoustic_legacy: "Designing sound environments that serve future generations",
            sound_wisdom: "Understanding how sound affects human wellbeing and connection"
          },
          examples: [
            {
              scenario: "How can acoustic design help communities stay connected?",
              option_a: "By creating spaces where people of all ages can hear each other clearly and feel included",
              option_b: "By making public spaces quieter so people can talk more easily"
            },
            {
              scenario: "Why is preserving natural soundscapes important?",
              option_a: "Natural sounds connect us to our environment and provide peace that technology can't replace",
              option_b: "Natural sounds are prettier than man-made sounds"
            }
          ],
          vocabulary: ["acoustic heritage", "intergenerational communication", "acoustic legacy", "sound wisdom", "soundscape preservation"]
        }
      },
      
      core_lesson_structure: {
        question_1: {
          concept_focus: "sound_wave_basics",
          universal_principle: "Sound travels through air as waves that our ears can detect",
          cognitive_target: "understanding_how_sound_moves",
          choice_architecture: {
            option_a: "Sound waves travel through air like ripples in water, getting smaller as they go farther",
            option_b: "Sound stays in one place and doesn't move anywhere"
          }
        },
        question_2: {
          concept_focus: "acoustic_design",
          universal_principle: "Different materials and shapes affect how sound behaves in spaces",
          cognitive_target: "applying_sound_physics_to_design",
          choice_architecture: {
            option_a: "Soft materials absorb sound while hard surfaces bounce it back, affecting how rooms sound",
            option_b: "The size of a room is the only thing that matters for how it sounds"
          }
        },
        question_3: {
          concept_focus: "accessibility_technology",
          universal_principle: "Understanding sound physics helps create technology that makes life better for everyone",
          cognitive_target: "connecting_science_to_human_benefit",
          choice_architecture: {
            option_a: "Hearing aids and acoustic design help people with hearing challenges by making sound clearer and easier to understand",
            option_b: "Technology can completely replace the need for hearing by creating new ways to communicate"
          }
        }
      }
    };
  }
  
  private applyAgeContextualization(lessonDNA: any, ageCategory: string) {
    const ageExpression = lessonDNA.age_expressions[ageCategory];
    if (!ageExpression) {
      throw new Error(`No age expression found for category: ${ageCategory}`);
    }
    
    return {
      concept_name: ageExpression.concept_name,
      core_metaphor: ageExpression.core_metaphor,
      complexity_level: ageExpression.complexity_level,
      attention_span: ageExpression.attention_span,
      abstract_concepts: ageExpression.abstract_concepts,
      examples: ageExpression.examples,
      vocabulary: ageExpression.vocabulary
    };
  }
  
  private applyToneDelivery(ageContext: any, tone: string, age: number) {
    const toneProfiles = {
      fun: {
        voice_character: "energetic_explorer",
        openings: ["Hey there!", "Ready for some sound science?", "Let's discover something amazing!"],
        transitions: ["Here's the cool part...", "But wait, there's more!", "Now for the really fun stuff..."],
        encouragements: ["You're getting it!", "That's exactly right!", "You're a sound scientist now!"],
        closings: ["You just learned something awesome!", "Keep exploring the world of sound!", "You're ready to share this knowledge!"],
        interaction_style: "excitement_and_wonder"
      },
      grandmother: {
        voice_character: "wise_nurturer",
        openings: ["Come here, dear one...", "Let me share something wonderful with you...", "You know, there's something beautiful about..."],
        transitions: ["And here's what's truly special...", "But the most important thing is...", "What I want you to remember..."],
        encouragements: ["You understand this so well...", "That's exactly right, my dear...", "You have such wisdom..."],
        closings: ["Remember this always...", "You carry this knowledge with you...", "Share this understanding with others..."],
        interaction_style: "warm_guidance"
      },
      neutral: {
        voice_character: "knowledgeable_guide",
        openings: ["Today we'll explore...", "Let's examine...", "We'll investigate..."],
        transitions: ["Furthermore...", "Additionally...", "Moreover..."],
        encouragements: ["That's correct.", "You're on the right track.", "Good observation."],
        closings: ["You now understand...", "This knowledge enables...", "You can apply this to..."],
        interaction_style: "professional_clarity"
      }
    };
    
    return toneProfiles[tone as keyof typeof toneProfiles] || toneProfiles.neutral;
  }
  
  private applyLanguageAdaptation(toneDelivery: any, language: string) {
    // For now, return basic adaptation - in production this would include translation
    return {
      cultural_adaptations: `Adapted for ${language} cultural context`,
      language_specific_terms: "Using appropriate terminology for the target language",
      cultural_sensitivity: "Respecting cultural norms and communication styles"
    };
  }
  
  private generateLessonScripts(lessonDNA: any, ageContext: any, toneDelivery: any, languageAdaptation: any) {
    const scripts = [];
    let scriptNumber = 1;
    
    // Opening script
    scripts.push({
      script_number: scriptNumber++,
      script_type: "opening",
      voice_text: `${toneDelivery.openings[0]} Today we're exploring ${ageContext.concept_name}. ${ageContext.core_metaphor}. ${lessonDNA.learning_essence}`,
      on_screen_text: `Welcome to Today's Lesson\n\n${ageContext.concept_name}\n\n${ageContext.core_metaphor}`,
      duration_seconds: Math.floor(ageContext.attention_span / 60)
    });
    
    // Question 1
    const question1 = lessonDNA.core_lesson_structure.question_1;
    scripts.push({
      script_number: scriptNumber++,
      script_type: "question_1",
      voice_text: `${toneDelivery.transitions[0]} Let's start with a question about ${question1.concept_focus}. ${question1.universal_principle}. Here's the question: ${question1.choice_architecture.option_a} or ${question1.choice_architecture.option_b}?`,
      on_screen_text: `Question 1 of 3\n\n${question1.concept_focus.replace(/_/g, ' ').toUpperCase()}\n\nPrinciple: ${question1.universal_principle}\n\nA) ${question1.choice_architecture.option_a}\n\nB) ${question1.choice_architecture.option_b}`,
      duration_seconds: Math.floor(ageContext.attention_span / 60)
    });
    
    // Question 2
    const question2 = lessonDNA.core_lesson_structure.question_2;
    scripts.push({
      script_number: scriptNumber++,
      script_type: "question_2",
      voice_text: `${toneDelivery.transitions[1]} Now let's explore ${question2.concept_focus}. ${question2.universal_principle}. Here's the question: ${question2.choice_architecture.option_a} or ${question2.choice_architecture.option_b}?`,
      on_screen_text: `Question 2 of 3\n\n${question2.concept_focus.replace(/_/g, ' ').toUpperCase()}\n\nPrinciple: ${question2.universal_principle}\n\nA) ${question2.choice_architecture.option_a}\n\nB) ${question2.choice_architecture.option_b}`,
      duration_seconds: Math.floor(ageContext.attention_span / 60)
    });
    
    // Question 3
    const question3 = lessonDNA.core_lesson_structure.question_3;
    scripts.push({
      script_number: scriptNumber++,
      script_type: "question_3",
      voice_text: `${toneDelivery.transitions[2]} Finally, let's think about ${question3.concept_focus}. ${question3.universal_principle}. Here's the question: ${question3.choice_architecture.option_a} or ${question3.choice_architecture.option_b}?`,
      on_screen_text: `Question 3 of 3\n\n${question3.concept_focus.replace(/_/g, ' ').toUpperCase()}\n\nPrinciple: ${question3.universal_principle}\n\nA) ${question3.choice_architecture.option_a}\n\nB) ${question3.choice_architecture.option_b}`,
      duration_seconds: Math.floor(ageContext.attention_span / 60)
    });
    
    // Daily fortune
    scripts.push({
      script_number: scriptNumber++,
      script_type: "fortune",
      voice_text: `${toneDelivery.closings[0]} You are someone who understands how the world works and uses that knowledge to help others. You can apply sound science to solve real problems and make life better for people. Your understanding of acoustics helps you build a world where everyone can communicate clearly and feel included.`,
      on_screen_text: `Your Daily Fortune\n\nCongratulations! You've completed today's lesson on ${lessonDNA.universal_concept}.\n\nYou are someone who understands how the world works and uses that knowledge to help others.\n\nRemember: ${lessonDNA.core_principle.replace(/_/g, ' ')}`,
      duration_seconds: Math.floor(ageContext.attention_span / 60)
    });
    
    return scripts;
  }
  
  private craftObjective(lessonDNA: any, ageContext: any) {
    return `Understand ${lessonDNA.universal_concept} while exploring how ${lessonDNA.core_principle.replace(/_/g, ' ')} - adapted for ${ageContext.complexity_level} level.`;
  }
} 