import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings, User, Users, Zap, Heart, Brain } from 'lucide-react';

// Real curriculum data from January
const REAL_LESSON_DATA = {
  day: 5,
  date: "January 5",
  title: "Emotional Regulation - The Superpower of Managing Your Inner World",
  learning_objective: "Practice emotional intelligence skills essential for constructive dialogue, peaceful conflict resolution, and maintaining democratic discourse under pressure.",
  subject: "social_studies",
  complexity: "intermediate"
};

// Age groups with real examples
const AGE_GROUPS = [
  { id: 'early_childhood', name: 'Early Childhood', range: '2-7 years', icon: '🧒' },
  { id: 'youth', name: 'Youth', range: '8-17 years', icon: '👦' },
  { id: 'young_adult', name: 'Young Adult', range: '18-35 years', icon: '👨' },
  { id: 'midlife', name: 'Midlife', range: '36-65 years', icon: '👨‍💼' },
  { id: 'wisdom_years', name: 'Wisdom Years', range: '66+ years', icon: '👴' }
];

// Tone options with real characteristics
const TONE_OPTIONS = [
  { id: 'grandmother', name: 'Grandmother', icon: '💝', description: 'Loving, wise, nurturing' },
  { id: 'fun', name: 'Fun', icon: '🎉', description: 'Energetic, celebratory, adventurous' },
  { id: 'neutral', name: 'Neutral', icon: '🧠', description: 'Professional, evidence-based' }
];

// Language options
const LANGUAGE_OPTIONS = [
  { id: 'english', name: 'English', flag: '🇺🇸' },
  { id: 'spanish', name: 'Español', flag: '🇪🇸' },
  { id: 'french', name: 'Français', flag: '🇫🇷' },
  { id: 'german', name: 'Deutsch', flag: '🇩🇪' },
  { id: 'chinese', name: '中文', flag: '🇨🇳' },
  { id: 'japanese', name: '日本語', flag: '🇯🇵' },
  { id: 'arabic', name: 'العربية', flag: '🇸🇦' },
  { id: 'hindi', name: 'हिन्दी', flag: '🇮🇳' }
];

// Avatar options
const AVATAR_OPTIONS = [
  { id: 'kelly', name: 'Kelly', image: '/kelly-avatar.jpg', description: 'Warm, intelligent teacher' },
  { id: 'ken', name: 'Ken', image: '/ken-avatar.jpg', description: 'Confident, knowledgeable guide' }
];

const UniversalLessonInterface = () => {
  // State management
  const [selectedAge, setSelectedAge] = useState('youth');
  const [selectedTone, setSelectedTone] = useState('neutral');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [selectedAvatar, setSelectedAvatar] = useState('kelly');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState('intro');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [userAnswers, setUserAnswers] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  // Generate lesson content based on selections
  const generateLessonContent = () => {
    const ageData = AGE_GROUPS.find(age => age.id === selectedAge);
    const toneData = TONE_OPTIONS.find(tone => tone.id === selectedTone);
    const avatarData = AVATAR_OPTIONS.find(avatar => avatar.id === selectedAvatar);

    // Real lesson content adapted for different ages and tones
    const lessonContent = {
      intro: generateIntro(ageData, toneData, avatarData),
      questions: generateQuestions(ageData, toneData),
      fortune: generateFortune(ageData, toneData)
    };

    return lessonContent;
  };

  const generateIntro = (ageData, toneData, avatarData) => {
    const intros = {
      grandmother: {
        early_childhood: "Oh sweetheart, today we're going to learn about something very special - how to be the boss of your feelings!",
        youth: "My dear one, today we're exploring how to be the captain of your emotional ship.",
        young_adult: "Precious, today we're discovering the superpower of emotional intelligence.",
        midlife: "Dear heart, today we're mastering the art of emotional regulation.",
        wisdom_years: "Beloved, today we're sharing wisdom about managing our inner world."
      },
      fun: {
        early_childhood: "Alright, little superhero! Ready to unlock your emotion powers?",
        youth: "BOOM! Time to level up your emotional regulation skills!",
        young_adult: "Welcome to emotional intelligence bootcamp, champion!",
        midlife: "Time for some emotional ninja training!",
        wisdom_years: "Let's discover your emotional mastery superpowers!"
      },
      neutral: {
        early_childhood: "Today we're learning about managing our feelings.",
        youth: "Today we're exploring emotional regulation skills.",
        young_adult: "Today we're examining emotional intelligence principles.",
        midlife: "Today we're studying advanced emotional regulation.",
        wisdom_years: "Today we're analyzing emotional mastery techniques."
      }
    };

    return intros[toneData.id][ageData.id];
  };

  const generateQuestions = (ageData, toneData) => {
    // Real questions based on emotional regulation curriculum
    const questions = [
      {
        id: 1,
        text: "When you feel angry, what's the best first step?",
        options: [
          "React immediately to show how you feel",
          "Take a deep breath and pause before responding",
          "Ignore the feeling completely"
        ],
        correct: 1,
        feedback: {
          correct: "Excellent! Taking a pause gives your brain time to think clearly.",
          incorrect: "Reacting immediately often makes situations worse. Pausing helps you respond wisely."
        }
      },
      {
        id: 2,
        text: "What helps you understand your emotions better?",
        options: [
          "Pretending you don't have feelings",
          "Naming your emotions and understanding why you feel them",
          "Always staying positive no matter what"
        ],
        correct: 1,
        feedback: {
          correct: "Perfect! Understanding your emotions helps you manage them effectively.",
          incorrect: "Ignoring or suppressing emotions doesn't make them go away. Understanding them is key."
        }
      },
      {
        id: 3,
        text: "How can you help others manage their emotions?",
        options: [
          "Tell them to just get over it",
          "Listen with empathy and offer support",
          "Avoid people who are emotional"
        ],
        correct: 1,
        feedback: {
          correct: "Wonderful! Empathy and support help others feel understood and safe.",
          incorrect: "Dismissing others' emotions damages relationships. Empathy builds connection."
        }
      }
    ];

    return questions;
  };

  const generateFortune = (ageData, toneData) => {
    const fortunes = {
      grandmother: {
        early_childhood: "You are learning to be the gentle captain of your feelings, sweet one.",
        youth: "Your emotional wisdom is growing stronger each day, dear heart.",
        young_adult: "You are becoming a master of your inner world, precious soul.",
        midlife: "Your emotional intelligence is a gift to everyone around you, beloved.",
        wisdom_years: "Your emotional mastery is a blessing to all who know you, dear one."
      },
      fun: {
        early_childhood: "You're unlocking your emotion superpowers!",
        youth: "You're leveling up your emotional intelligence skills!",
        young_adult: "You're becoming an emotional regulation champion!",
        midlife: "You're mastering emotional ninja techniques!",
        wisdom_years: "You're discovering your emotional mastery superpowers!"
      },
      neutral: {
        early_childhood: "You are developing important emotional regulation skills.",
        youth: "You are building valuable emotional intelligence.",
        young_adult: "You are mastering emotional regulation principles.",
        midlife: "You are demonstrating advanced emotional intelligence.",
        wisdom_years: "You are exemplifying emotional mastery."
      }
    };

    return fortunes[toneData.id][ageData.id];
  };

  const lessonContent = generateLessonContent();

  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentSegment('intro');
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {REAL_LESSON_DATA.title}
              </h1>
              <p className="text-gray-600 mt-2">
                Day {REAL_LESSON_DATA.day} • {REAL_LESSON_DATA.date} • {REAL_LESSON_DATA.subject}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {REAL_LESSON_DATA.learning_objective}
              </p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Settings</h2>
              
              {/* Age Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Age Group</h3>
                <div className="space-y-2">
                  {AGE_GROUPS.map((age) => (
                    <button
                      key={age.id}
                      onClick={() => setSelectedAge(age.id)}
                      className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                        selectedAge === age.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mr-3">{age.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">{age.name}</div>
                        <div className="text-sm text-gray-500">{age.range}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Teaching Tone</h3>
                <div className="space-y-2">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                        selectedTone === tone.id
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mr-3">{tone.icon}</span>
                      <div className="text-left">
                        <div className="font-medium">{tone.name}</div>
                        <div className="text-sm text-gray-500">{tone.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Language</h3>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Avatar</h3>
                <div className="grid grid-cols-2 gap-3">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedAvatar === avatar.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                          {avatar.id === 'kelly' ? <User className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                        </div>
                        <div className="font-medium">{avatar.name}</div>
                        <div className="text-xs text-gray-500">{avatar.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Play Controls */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isPlaying ? 'Pause' : 'Play Lesson'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              
              {/* Avatar Display */}
              <div className="mb-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {selectedAvatar === 'kelly' ? (
                    <User className="w-12 h-12 text-white" />
                  ) : (
                    <Users className="w-12 h-12 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedAvatar === 'kelly' ? 'Kelly' : 'Ken'}
                </h2>
                <p className="text-gray-600">
                  {selectedAvatar === 'kelly' ? 'Warm, intelligent teacher' : 'Confident, knowledgeable guide'}
                </p>
              </div>

              {/* Current Content */}
              <div className="space-y-6">
                {/* Intro */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Introduction</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {lessonContent.intro}
                  </p>
                </div>

                {/* Questions */}
                {lessonContent.questions.map((question, index) => (
                  <div key={question.id} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Question {question.id}
                    </h3>
                    <p className="text-gray-700 mb-4">{question.text}</p>
                    
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <button
                          key={optionIndex}
                          onClick={() => handleAnswerSelect(question.id, optionIndex)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            userAnswers[question.id] === optionIndex
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center">
                              {userAnswers[question.id] === optionIndex && (
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            {option}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Feedback */}
                    {userAnswers[question.id] !== undefined && (
                      <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-green-800">
                          {userAnswers[question.id] === question.correct
                            ? question.feedback.correct
                            : question.feedback.incorrect}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Fortune */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-purple-600" />
                    Daily Fortune
                  </h3>
                  <p className="text-gray-700 leading-relaxed italic">
                    "{lessonContent.fortune}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-600">
            <p>Universal Lesson System • 3x2x1 Format • Real Curriculum Content</p>
            <p className="text-sm mt-1">
              Age: {AGE_GROUPS.find(a => a.id === selectedAge)?.name} • 
              Tone: {TONE_OPTIONS.find(t => t.id === selectedTone)?.name} • 
              Language: {LANGUAGE_OPTIONS.find(l => l.id === selectedLanguage)?.name} • 
              Avatar: {AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalLessonInterface; 