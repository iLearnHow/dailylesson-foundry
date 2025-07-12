import React, { useState, useEffect } from 'react';
import { Play, Pause, Settings, User, Users, Zap, BookOpen, Brain, Heart, Star } from 'lucide-react';
import Link from 'next/link';

// Import real curriculum data
const CURRICULUM_DATA = {
  january: [
    {
      day: 1,
      date: "January 1",
      title: "The Sun - Our Magnificent Life-Giving Star",
      learning_objective: "Understand how scientific observation and measurement create shared global knowledge that transcends cultural and political boundaries, demonstrating how evidence-based thinking builds confidence in democratic decision-making.",
      subject: "science",
      complexity: "beginner"
    },
    {
      day: 5,
      date: "January 5", 
      title: "Emotional Regulation - The Superpower of Managing Your Inner World",
      learning_objective: "Practice emotional intelligence skills essential for constructive dialogue, peaceful conflict resolution, and maintaining democratic discourse under pressure.",
      subject: "social_studies",
      complexity: "intermediate"
    },
    {
      day: 15,
      date: "January 15",
      title: "Photosynthesis - Nature's Solar-Powered Food Factory", 
      learning_objective: "Explore how understanding natural processes inspires sustainable technology solutions, building scientific literacy for environmental decision-making.",
      subject: "science",
      complexity: "intermediate"
    },
    {
      day: 22,
      date: "January 22",
      title: "Your Amazing Brain - The Universe's Most Incredible Computer",
      learning_objective: "Understand neuroplasticity and cognitive science to optimize learning while preparing for ethical debates about brain-computer interfaces and AI.",
      subject: "science",
      complexity: "advanced"
    }
  ]
};

// DNA-based lesson structure
const LESSON_DNA = {
  age_expressions: {
    early_childhood: {
      concept_name: "Learning About Feelings",
      core_metaphor: "being_the_boss_of_your_feelings",
      complexity_level: "concrete_actions_and_feelings",
      attention_span: "3-4_minutes",
      examples: ["feeling_happy", "feeling_sad", "feeling_angry", "feeling_scared"],
      vocabulary: ["feelings", "happy", "sad", "angry", "scared", "calm", "brave"]
    },
    youth: {
      concept_name: "Managing Your Emotions",
      core_metaphor: "being_the_captain_of_your_emotional_ship",
      complexity_level: "social_scenarios_and_relationships", 
      attention_span: "5-6_minutes",
      examples: ["peer_conflicts", "family_disagreements", "school_stress", "social_pressure"],
      vocabulary: ["emotions", "regulation", "self-control", "empathy", "communication", "conflict_resolution"]
    },
    young_adult: {
      concept_name: "Emotional Intelligence Mastery",
      core_metaphor: "strategic_emotional_leadership",
      complexity_level: "systems_thinking_and_relationship_building",
      attention_span: "6_minutes", 
      examples: ["workplace_conflicts", "relationship_challenges", "life_transitions", "stress_management"],
      vocabulary: ["emotional_intelligence", "self-awareness", "social_skills", "stress_resilience", "mindfulness"]
    },
    midlife: {
      concept_name: "Advanced Emotional Wisdom",
      core_metaphor: "orchestrating_emotional_harmony",
      complexity_level: "multi_person_relationship_navigation",
      attention_span: "6_minutes",
      examples: ["family_mediation", "community_leadership", "career_challenges", "life_balance"],
      vocabulary: ["emotional_mastery", "wisdom", "leadership", "mentoring", "life_integration"]
    },
    wisdom_years: {
      concept_name: "Emotional Legacy and Teaching",
      core_metaphor: "sharing_emotional_wisdom_across_generations", 
      complexity_level: "relationship_stewardship_and_perspective_integration",
      attention_span: "6_minutes",
      examples: ["intergenerational_teaching", "community_guidance", "life_reflection", "wisdom_sharing"],
      vocabulary: ["legacy", "wisdom", "teaching", "reflection", "intergenerational_connection"]
    }
  },
  tone_delivery_dna: {
    grandmother: {
      voice_character: "loving_wise_elder_sharing_life_lessons",
      emotional_temperature: "warm_patient_nurturing",
      language_patterns: {
        openings: ["Oh sweetheart,", "My dear one,", "Precious,", "Come sit with me,"],
        encouragements: ["What a wise soul you are!", "You have such beautiful insight!", "Oh, what a treasure you are!"],
        closings: ["Rest well tonight, dear heart", "What a blessing you are", "See you tomorrow, precious one"]
      }
    },
    fun: {
      voice_character: "enthusiastic_adventure_guide_and_cheerleader", 
      emotional_temperature: "high_energy_celebratory_playful",
      language_patterns: {
        openings: ["Alright, superstar!", "Ready to level up?", "Time for some magic!", "Welcome to bootcamp!"],
        encouragements: ["YES! You nailed it!", "Legendary status achieved!", "You're absolutely crushing this!"],
        closings: ["You're going to be amazing!", "This is going to be incredible!", "See you tomorrow, champion!"]
      }
    },
    neutral: {
      voice_character: "knowledgeable_professional_mentor_and_guide",
      emotional_temperature: "calm_confident_respectful", 
      language_patterns: {
        openings: ["Today we're exploring", "Let's examine", "Here's an important principle", "Consider this scenario"],
        encouragements: ["Excellent thinking", "You understand the key principle", "That's exactly right"],
        closings: ["These skills will serve you well", "You've built a solid foundation", "This understanding will benefit you"]
      }
    }
  }
};

const AdvancedLessonGenerator = () => {
  const [selectedLesson, setSelectedLesson] = useState(CURRICULUM_DATA.january[1]); // Default to Emotional Regulation
  const [selectedAge, setSelectedAge] = useState('youth');
  const [selectedTone, setSelectedTone] = useState('neutral');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedAvatar, setSelectedAvatar] = useState('kelly');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate complete lesson content using DNA system
  const generateLesson = async () => {
    setIsGenerating(true);
    
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const ageData = LESSON_DNA.age_expressions[selectedAge];
    const toneData = LESSON_DNA.tone_delivery_dna[selectedTone];
    
    const lesson = {
      metadata: {
        title: selectedLesson.title,
        day: selectedLesson.day,
        date: selectedLesson.date,
        subject: selectedLesson.subject,
        complexity: selectedLesson.complexity,
        age_group: selectedAge,
        tone: selectedTone,
        language: selectedLanguage,
        avatar: selectedAvatar
      },
      content: {
        intro: generateIntro(selectedLesson, ageData, toneData),
        questions: generateQuestions(selectedLesson, ageData, toneData),
        fortune: generateFortune(selectedLesson, ageData, toneData),
        closing: generateClosing(selectedLesson, ageData, toneData)
      },
      dna_analysis: {
        age_adaptation: ageData,
        tone_adaptation: toneData,
        complexity_mapping: mapComplexity(selectedLesson.complexity, selectedAge),
        vocabulary_adaptation: adaptVocabulary(selectedLesson, ageData)
      }
    };
    
    setGeneratedContent(lesson);
    setIsGenerating(false);
  };

  const generateIntro = (lesson, ageData, toneData) => {
    const tonePatterns = toneData.language_patterns.openings;
    const opening = tonePatterns[Math.floor(Math.random() * tonePatterns.length)];
    
    const intros = {
      grandmother: {
        early_childhood: `${opening} today we're going to learn about something very special - ${lesson.title.toLowerCase()}!`,
        youth: `${opening} today we're exploring ${lesson.title.toLowerCase()}.`,
        young_adult: `${opening} today we're discovering the wisdom of ${lesson.title.toLowerCase()}.`,
        midlife: `${opening} today we're mastering ${lesson.title.toLowerCase()}.`,
        wisdom_years: `${opening} today we're sharing wisdom about ${lesson.title.toLowerCase()}.`
      },
      fun: {
        early_childhood: `${opening} Ready to unlock your ${lesson.subject} superpowers?`,
        youth: `BOOM! Time to level up your ${lesson.subject} skills!`,
        young_adult: `Welcome to ${lesson.subject} bootcamp, champion!`,
        midlife: `Time for some ${lesson.subject} ninja training!`,
        wisdom_years: `Let's discover your ${lesson.subject} mastery superpowers!`
      },
      neutral: {
        early_childhood: `Today we're learning about ${lesson.title.toLowerCase()}.`,
        youth: `Today we're exploring ${lesson.title.toLowerCase()}.`,
        young_adult: `Today we're examining ${lesson.title.toLowerCase()}.`,
        midlife: `Today we're studying ${lesson.title.toLowerCase()}.`,
        wisdom_years: `Today we're analyzing ${lesson.title.toLowerCase()}.`
      }
    };
    
    return intros[selectedTone][selectedAge];
  };

  const generateQuestions = (lesson, ageData, toneData) => {
    // Generate age-appropriate questions based on lesson content
    const questions = [
      {
        id: 1,
        text: generateQuestionText(lesson, ageData, 1),
        options: generateQuestionOptions(lesson, ageData, 1),
        correct: 1,
        feedback: generateFeedback(lesson, ageData, toneData, 1)
      },
      {
        id: 2,
        text: generateQuestionText(lesson, ageData, 2),
        options: generateQuestionOptions(lesson, ageData, 2),
        correct: 1,
        feedback: generateFeedback(lesson, ageData, toneData, 2)
      },
      {
        id: 3,
        text: generateQuestionText(lesson, ageData, 3),
        options: generateQuestionOptions(lesson, ageData, 3),
        correct: 1,
        feedback: generateFeedback(lesson, ageData, toneData, 3)
      }
    ];
    
    return questions;
  };

  const generateQuestionText = (lesson, ageData, questionNumber) => {
    const questionTemplates = {
      early_childhood: [
        `What happens when you feel ${ageData.examples[0]}?`,
        `How do you know when someone is feeling ${ageData.examples[1]}?`,
        `What can you do to help someone who feels ${ageData.examples[2]}?`
      ],
      youth: [
        `When you experience ${ageData.examples[0]}, what's the best first step?`,
        `How can you apply ${lesson.subject} principles to ${ageData.examples[1]}?`,
        `What role does ${lesson.subject} play in ${ageData.examples[2]}?`
      ],
      young_adult: [
        `In ${ageData.examples[0]} situations, how does ${lesson.subject} help?`,
        `What ${lesson.subject} strategies work best for ${ageData.examples[1]}?`,
        `How does ${lesson.subject} connect to ${ageData.examples[2]}?`
      ],
      midlife: [
        `When leading through ${ageData.examples[0]}, how does ${lesson.subject} guide you?`,
        `What ${lesson.subject} wisdom applies to ${ageData.examples[1]}?`,
        `How does ${lesson.subject} support ${ageData.examples[2]}?`
      ],
      wisdom_years: [
        `When teaching about ${ageData.examples[0]}, how does ${lesson.subject} wisdom help?`,
        `What ${lesson.subject} insights guide ${ageData.examples[1]}?`,
        `How does ${lesson.subject} connect to ${ageData.examples[2]}?`
      ]
    };
    
    return questionTemplates[selectedAge][questionNumber - 1];
  };

  const generateQuestionOptions = (lesson, ageData, questionNumber) => {
    const optionTemplates = {
      early_childhood: [
        ["React immediately", "Take a deep breath first", "Ignore the feeling"],
        ["Look at their face", "Ask them how they feel", "Pretend not to notice"],
        ["Give them a hug", "Listen to them", "Tell them to stop feeling that way"]
      ],
      youth: [
        ["React quickly", "Pause and think", "Avoid the situation"],
        ["Use what we learned", "Do what feels right", "Ask someone else"],
        ["It helps us understand", "It doesn't matter", "It makes things worse"]
      ],
      young_adult: [
        ["It provides strategies", "It doesn't help", "It makes things complicated"],
        ["The ones we practiced", "Whatever works", "The easiest ones"],
        ["Through shared principles", "It doesn't connect", "Through opposites"]
      ],
      midlife: [
        ["It offers leadership tools", "It's not relevant", "It slows things down"],
        ["The foundational principles", "Whatever is popular", "The simplest approach"],
        ["By providing frameworks", "It doesn't support", "By creating barriers"]
      ],
      wisdom_years: [
        ["It offers teaching insights", "It's too complex", "It's not needed"],
        ["The timeless principles", "Whatever is new", "The basic concepts"],
        ["Through shared wisdom", "It doesn't connect", "Through separation"]
      ]
    };
    
    return optionTemplates[selectedAge][questionNumber - 1];
  };

  const generateFeedback = (lesson, ageData, toneData, questionNumber) => {
    const encouragements = toneData.language_patterns.encouragements;
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    return {
      correct: `${encouragement} You understand how ${lesson.subject} helps in this situation.`,
      incorrect: `Let's think about this differently. ${lesson.subject} teaches us to consider multiple perspectives.`
    };
  };

  const generateFortune = (lesson, ageData, toneData) => {
    const closings = toneData.language_patterns.closings;
    const closing = closings[Math.floor(Math.random() * closings.length)];
    
    const fortunes = {
      grandmother: {
        early_childhood: `You are learning to be wise about ${lesson.subject}, sweet one.`,
        youth: `Your understanding of ${lesson.subject} is growing stronger each day, dear heart.`,
        young_adult: `You are becoming a master of ${lesson.subject}, precious soul.`,
        midlife: `Your ${lesson.subject} wisdom is a gift to everyone around you, beloved.`,
        wisdom_years: `Your ${lesson.subject} mastery is a blessing to all who know you, dear one.`
      },
      fun: {
        early_childhood: `You're unlocking your ${lesson.subject} superpowers!`,
        youth: `You're leveling up your ${lesson.subject} skills!`,
        young_adult: `You're becoming a ${lesson.subject} champion!`,
        midlife: `You're mastering ${lesson.subject} ninja techniques!`,
        wisdom_years: `You're discovering your ${lesson.subject} mastery superpowers!`
      },
      neutral: {
        early_childhood: `You are developing important ${lesson.subject} skills.`,
        youth: `You are building valuable ${lesson.subject} understanding.`,
        young_adult: `You are mastering ${lesson.subject} principles.`,
        midlife: `You are demonstrating advanced ${lesson.subject} knowledge.`,
        wisdom_years: `You are exemplifying ${lesson.subject} mastery.`
      }
    };
    
    return fortunes[selectedTone][selectedAge];
  };

  const generateClosing = (lesson, ageData, toneData) => {
    const closings = toneData.language_patterns.closings;
    return closings[Math.floor(Math.random() * closings.length)];
  };

  const mapComplexity = (lessonComplexity, ageGroup) => {
    const complexityMap = {
      beginner: { early_childhood: "perfect", youth: "accessible", young_adult: "basic", midlife: "review", wisdom_years: "foundation" },
      intermediate: { early_childhood: "challenging", youth: "perfect", young_adult: "accessible", midlife: "engaging", wisdom_years: "stimulating" },
      advanced: { early_childhood: "too_complex", youth: "challenging", young_adult: "perfect", midlife: "accessible", wisdom_years: "engaging" }
    };
    
    return complexityMap[lessonComplexity][ageGroup];
  };

  const adaptVocabulary = (lesson, ageData) => {
    return {
      original_terms: [lesson.title, lesson.subject, lesson.complexity],
      adapted_terms: ageData.vocabulary,
      complexity_level: ageData.complexity_level,
      attention_span: ageData.attention_span
    };
  };

  const fetchLesson = async () => {
    setIsGenerating(true);
    
    try {
      // Use the deployed Cloudflare Worker API URL
      const apiBaseUrl = 'https://ilearn-api.nicoletterankin.workers.dev';
      
      const response = await fetch(
        `${apiBaseUrl}/v1/daily-lesson?age=${selectedAge}&tone=${selectedTone}&language=${selectedLanguage}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Failed to generate lesson');
      }

      setGeneratedContent(data.lesson);
      
    } catch (err) {
      console.error('Error fetching lesson:', err);
      
      // Log fallback event
      try {
        const apiBaseUrl = 'https://ilearn-api.nicoletterankin.workers.dev';
        
        await fetch(`${apiBaseUrl}/v1/monitor/log-fallback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lesson_id: `daily_lesson_${selectedAge}_${selectedTone}_${selectedLanguage}`,
            error_type: 'fetch_failed',
            error_message: err.message,
            user_context: { age: selectedAge, tone: selectedTone, language: selectedLanguage }
          })
        });
      } catch (logError) {
        console.error('Failed to log fallback event:', logError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (selectedLesson) {
      generateLesson();
    }
  }, [selectedLesson, selectedAge, selectedTone, selectedLanguage, selectedAvatar]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center mb-8 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center space-x-6">
          <Link href="/advanced-lesson"><span className="font-bold text-purple-700 text-lg cursor-pointer">Daily Lesson</span></Link>
          <Link href="/learn-more-about-lessons"><span className="text-gray-700 hover:text-purple-600 cursor-pointer">How It Works</span></Link>
          <Link href="/about"><span className="text-gray-700 hover:text-purple-600 cursor-pointer">About Us</span></Link>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Brain className="w-8 h-8 mr-3 text-purple-600" />
                Advanced Lesson Generator
              </h1>
              <p className="text-gray-600 mt-2">
                DNA-Powered Universal Lesson System • 3x2x1 Format • Real Curriculum Integration
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                DNA System Active
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Lesson Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Lesson Selection
              </h2>
              
              <div className="space-y-3">
                {CURRICULUM_DATA.january.map((lesson) => (
                  <button
                    key={lesson.day}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedLesson.day === lesson.day
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Day {lesson.day}</div>
                    <div className="text-sm text-gray-600">{lesson.date}</div>
                    <div className="text-sm font-medium mt-1">{lesson.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{lesson.subject} • {lesson.complexity}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Generation Settings
              </h2>
              
              {/* Age Groups */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Age Adaptation</h3>
                <div className="space-y-2">
                  {Object.entries(LESSON_DNA.age_expressions).map(([ageId, ageData]) => (
                    <button
                      key={ageId}
                      onClick={() => setSelectedAge(ageId)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedAge === ageId
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{ageData.concept_name}</div>
                      <div className="text-xs text-gray-500">{ageData.complexity_level}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Voice Tone</h3>
                <div className="space-y-2">
                  {Object.entries(LESSON_DNA.tone_delivery_dna).map(([toneId, toneData]) => (
                    <button
                      key={toneId}
                      onClick={() => setSelectedTone(toneId)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTone === toneId
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium capitalize">{toneId}</div>
                      <div className="text-xs text-gray-500">{toneData.emotional_temperature}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language & Avatar */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="english">🇺🇸 English</option>
                    <option value="spanish">🇪🇸 Español</option>
                    <option value="french">🇫🇷 Français</option>
                    <option value="german">🇩🇪 Deutsch</option>
                    <option value="chinese">🇨🇳 中文</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedAvatar('kelly')}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedAvatar === 'kelly'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Kelly</div>
                    </button>
                    <button
                      onClick={() => setSelectedAvatar('ken')}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedAvatar === 'ken'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Ken</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                  Generated Lesson
                </h2>
                {isGenerating && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Generating...
                  </div>
                )}
              </div>

              {generatedContent ? (
                <div className="space-y-6">
                  {/* Lesson Metadata */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Lesson Metadata</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Title:</span> {generatedContent.metadata.title}
                      </div>
                      <div>
                        <span className="font-medium">Day:</span> {generatedContent.metadata.day}
                      </div>
                      <div>
                        <span className="font-medium">Subject:</span> {generatedContent.metadata.subject}
                      </div>
                      <div>
                        <span className="font-medium">Complexity:</span> {generatedContent.metadata.complexity}
                      </div>
                      <div>
                        <span className="font-medium">Age Group:</span> {generatedContent.metadata.age_group}
                      </div>
                      <div>
                        <span className="font-medium">Tone:</span> {generatedContent.metadata.tone}
                      </div>
                    </div>
                  </div>

                  {/* Content Sections */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Introduction</h4>
                      <p className="text-gray-700">{generatedContent.content.intro}</p>
                    </div>

                    {generatedContent.content.questions.map((question, index) => (
                      <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Question {question.id}</h4>
                        <p className="text-gray-700 mb-3">{question.text}</p>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center p-2 bg-white rounded border">
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-3"></div>
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <Star className="w-4 h-4 mr-2 text-purple-600" />
                        Daily Fortune
                      </h4>
                      <p className="text-gray-700 italic">"{generatedContent.content.fortune}"</p>
                    </div>
                  </div>

                  {/* DNA Analysis */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">DNA Analysis</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Complexity Mapping:</span> {generatedContent.dna_analysis.complexity_mapping}
                      </div>
                      <div>
                        <span className="font-medium">Attention Span:</span> {generatedContent.dna_analysis.age_adaptation.attention_span}
                      </div>
                      <div>
                        <span className="font-medium">Core Metaphor:</span> {generatedContent.dna_analysis.age_adaptation.core_metaphor}
                      </div>
                      <div>
                        <span className="font-medium">Voice Character:</span> {generatedContent.dna_analysis.tone_adaptation.voice_character}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a lesson and settings to generate content</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-600">
            <p>Advanced Lesson Generator • DNA-Powered • Real Curriculum Integration</p>
            <p className="text-sm mt-1">
              Selected: {selectedLesson?.title} • 
              Age: {selectedAge} • 
              Tone: {selectedTone} • 
              Avatar: {selectedAvatar}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedLessonGenerator; 