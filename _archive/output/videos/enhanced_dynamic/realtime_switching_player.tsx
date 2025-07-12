import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Globe, Volume2, VolumeX, Calendar, User, Sparkles, Clock, Target, BookOpen } from 'lucide-react';

const RealTimeSwitchingPlayer = ({ initialLesson }) => {
  // Core lesson state
  const [currentLesson, setCurrentLesson] = useState(initialLesson);
  const [currentSegment, setCurrentSegment] = useState('intro_question1');
  const [segmentProgress, setSegmentProgress] = useState(0);
  
  // Real-time switching controls
  const [age, setAge] = useState(25);
  const [tone, setTone] = useState('neutral');
  const [language, setLanguage] = useState('english');
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [userChoices, setUserChoices] = useState({});
  // Current script content (real-time generated)
  const [currentScript, setCurrentScript] = useState('');
  const [isScriptVisible, setIsScriptVisible] = useState(true);
  
  // Refs
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const switchingTimeoutRef = useRef(null);
  
  // Lesson segment sequence for 3x2x1
  const lessonSegments = [
    'intro_question1',
    'question1_option_a', 'question1_option_b', 'question1_no_response',
    'intro_question2', 
    'question2_option_a', 'question2_option_b', 'question2_no_response',
    'intro_question3',
    'question3_option_a', 'question3_option_b', 'question3_no_response',
    'daily_fortune'
  ];

  // Languages and their display names
  const languages = {
    'english': '🇺🇸 English',
    'spanish': '🇪🇸 Español', 
    'french': '🇫🇷 Français',
    'german': '🇩🇪 Deutsch',
    'mandarin': '🇨🇳 中文',
    'japanese': '🇯🇵 日本語',
    'arabic': '🇸🇦 العربية',
    'portuguese': '🇧🇷 Português',
    'hindi': '🇮🇳 हिन्दी',
    'russian': '🇷🇺 Русский'
  };

  const tones = {
    'neutral': { name: 'Neutral', icon: '🎯', description: 'Professional, evidence-based guidance' },
    'fun': { name: 'Fun', icon: '🚀', description: 'Energetic, celebratory adventure' },
    'grandmother': { name: 'Grandmother', icon: '💝', description: 'Loving, wise, nurturing' }
  };

  // Generate video URL for current state
  const generateVideoURL = useCallback((segmentType, currentAge, currentTone, currentLanguage) => {
    const lessonId = currentLesson?.lesson_metadata?.lesson_id || 'molecular_biology';
    return `https://videos.ilearn.how/lessons/${lessonId}/${segmentType}/age_${currentAge}/tone_${currentTone}/lang_${currentLanguage}.mp4`;
  }, [currentLesson]);

  // Real-time switching function
  const switchToVariation = useCallback(async (newAge, newTone, newLanguage, maintainProgress = true) => {
    setIsLoading(true);
    
    // Clear any pending switches
    if (switchingTimeoutRef.current) {
      clearTimeout(switchingTimeoutRef.current);
    }
    
    // Store current playback position if maintaining progress
    const currentPosition = maintainProgress ? videoRef.current?.currentTime || 0 : 0;
    const wasPlaying = isPlaying;
    
    // Generate new video URL
    const newVideoURL = generateVideoURL(currentSegment, newAge, newTone, newLanguage);
    
    // Preload new video
    const newVideo = document.createElement('video');
    newVideo.preload = 'auto';
    newVideo.src = newVideoURL;
    
    await new Promise((resolve, reject) => {
      newVideo.onloadeddata = () => {
        // Seamlessly switch to new video
        if (videoRef.current) {
          videoRef.current.src = newVideoURL;
          videoRef.current.currentTime = currentPosition;
          if (wasPlaying) {
            videoRef.current.play();
          }
        }
        setIsLoading(false);
        resolve();
      };
      
      newVideo.onerror = () => {
        console.warn(`Video not available for age ${newAge}, tone ${newTone}, language ${newLanguage}. Using fallback.`);
        // Fallback to neutral/english if specific variation doesn't exist
        const fallbackURL = generateVideoURL(currentSegment, newAge, 'neutral', 'english');
        if (videoRef.current) {
          videoRef.current.src = fallbackURL;
          videoRef.current.currentTime = currentPosition;
          if (wasPlaying) {
            videoRef.current.play();
          }
        }
        setIsLoading(false);
        resolve();
      };
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Video load timeout'));
        setIsLoading(false);
      }, 5000);
    });
    
  }, [currentSegment, isPlaying, generateVideoURL]);

  // Handle age slider change
  const handleAgeChange = useCallback((newAge) => {
    setAge(newAge);
    switchToVariation(newAge, tone, language);
  }, [tone, language, switchToVariation]);

  // Handle tone change
  const handleToneChange = useCallback((newTone) => {
    setTone(newTone);
    switchToVariation(age, newTone, language);
  }, [age, language, switchToVariation]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    switchToVariation(age, tone, newLanguage);
  }, [age, tone, switchToVariation]);

  // Navigate to specific segment
  const navigateToSegment = useCallback((segmentType) => {
    setCurrentSegment(segmentType);
    const newURL = generateVideoURL(segmentType, age, tone, language);
    if (videoRef.current) {
      videoRef.current.src = newURL;
      videoRef.current.currentTime = 0;
      if (isPlaying) {
        videoRef.current.play();
      }
    }
  }, [age, tone, language, isPlaying, generateVideoURL]);

  // Handle user choice selection
  const handleChoiceSelection = (questionNumber, choice) => {
    const choiceKey = `question${questionNumber}`;
    setUserChoices(prev => ({ ...prev, [choiceKey]: choice }));
    
    // Navigate to appropriate response segment
    const responseSegment = `question${questionNumber}_option_${choice}`;
    navigateToSegment(responseSegment);
  };

  // Auto-hide controls
  useEffect(() => {
    const hideControlsTimeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(hideControlsTimeout);
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      clearTimeout(hideControlsTimeout);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isPlaying]);

  // Initialize video
  useEffect(() => {
    if (videoRef.current && currentLesson) {
      const initialURL = generateVideoURL(currentSegment, age, tone, language);
      videoRef.current.src = initialURL;
    }
  }, [currentLesson, generateVideoURL, currentSegment, age, tone, language]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setSegmentProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = () => {
    // Auto-advance to next logical segment
    const currentIndex = lessonSegments.indexOf(currentSegment);
    if (currentIndex < lessonSegments.length - 1) {
      const nextSegment = lessonSegments[currentIndex + 1];
      navigateToSegment(nextSegment);
    } else {
      setLessonComplete(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getAgeCategory = (age) => {
    if (age <= 7) return 'Early Childhood';
    if (age <= 17) return 'Youth';
    if (age <= 35) return 'Young Adult';
    if (age <= 65) return 'Midlife';
    return 'Wisdom Years';
  };

  const getCurrentQuestionNumber = () => {
    if (currentSegment.includes('question1')) return 1;
    if (currentSegment.includes('question2')) return 2;
    if (currentSegment.includes('question3')) return 3;
    return 0;
  };

  const isQuestionSetup = currentSegment.startsWith('intro_question');
  const currentQuestionNumber = getCurrentQuestionNumber();

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden"
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white text-lg">Switching to your personalized lesson...</p>
            </div>
          </div>
        </div>
      )}

      {/* Ken Video - Full Screen */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
        autoPlay
      />

      {/* Real-Time Control Panel */}
      <div className={`absolute top-8 left-8 right-8 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          {/* Lesson Info Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Calendar className="text-blue-400" size={24} />
              <div>
                <h1 className="text-2xl font-bold text-white">{currentLesson?.lesson_metadata?.title}</h1>
                <p className="text-blue-200">Day {currentLesson?.lesson_metadata?.day} • {currentLesson?.lesson_metadata?.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{Math.round(segmentProgress)}%</div>
                <div className="text-blue-300 text-sm">Progress</div>
              </div>
            </div>
          </div>

          {/* Real-Time Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Age Slider */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="text-green-400" size={20} />
                <span className="text-white font-semibold">Age: {age}</span>
                <span className="text-green-300 text-sm">({getAgeCategory(age)})</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="2"
                  max="102"
                  value={age}
                  onChange={(e) => handleAgeChange(parseInt(e.target.value))}
                  className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <div 
                  className="absolute top-0 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg pointer-events-none"
                  style={{ width: `${((age - 2) / 100) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>2</span>
                <span>Child</span>
                <span>Teen</span>
                <span>Adult</span>
                <span>Elder</span>
                <span>102</span>
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-400" size={20} />
                <span className="text-white font-semibold">Tone</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(tones).map(([key, toneData]) => (
                  <button
                    key={key}
                    onClick={() => handleToneChange(key)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      tone === key 
                        ? 'bg-purple-600 text-white scale-105' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:scale-102'
                    }`}
                  >
                    <div className="text-2xl mb-1">{toneData.icon}</div>
                    <div className="text-sm font-semibold">{toneData.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="text-yellow-400" size={20} />
                <span className="text-white font-semibold">Language</span>
              </div>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white backdrop-blur-sm"
              >
                {Object.entries(languages).map(([key, name]) => (
                  <option key={key} value={key} className="bg-gray-800">
                    {name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-300">
                Instant language switching • No reload required
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Script Display */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-96">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-blue-400" size={20} />
              <span className="text-white font-semibold">Ken's Script</span>
            </div>
            <button
              onClick={() => setIsScriptVisible(!isScriptVisible)}
              className="text-white/70 hover:text-white transition-colors"
            >
              {isScriptVisible ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          {isScriptVisible && (
            <div className="space-y-4">
              <div className="text-white/90 leading-relaxed text-sm bg-black/30 rounded-lg p-4">
                {currentScript || 'Script loading...'}
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-green-400 font-semibold">Age {age}</div>
                  <div className="text-green-300">{getAgeCategory(age)}</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-semibold">{tones[tone].name}</div>
                  <div className="text-purple-300">Tone</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold">{languages[language].split(' ')[1] || language}</div>
                  <div className="text-yellow-300">Language</div>
                </div>
              </div>
              
              <div className="text-xs text-white/60 border-t border-white/20 pt-3">
                <div><strong>Segment:</strong> {currentSegment}</div>
                <div><strong>Generated:</strong> Real-time from Universal Orchestrator</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {isQuestionSetup && currentQuestionNumber > 0 && (
        <div className="absolute bottom-32 left-8 right-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Question {currentQuestionNumber}</h3>
              <p className="text-blue-200">Choose your path to continue learning</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleChoiceSelection(currentQuestionNumber, 'a')}
                className="group p-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl text-white transition-all hover:scale-105"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🅰️</div>
                <div className="text-lg font-semibold">Path A</div>
                <div className="text-blue-200 text-sm">Explore this perspective</div>
              </button>
              
              <button
                onClick={() => handleChoiceSelection(currentQuestionNumber, 'b')}
                className="group p-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-2xl text-white transition-all hover:scale-105"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🅱️</div>
                <div className="text-lg font-semibold">Path B</div>
                <div className="text-green-200 text-sm">Consider this angle</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Controls */}
      <div className={`absolute bottom-8 left-8 right-8 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full flex items-center justify-center transition-all hover:scale-110"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
              </button>
              
              <div className="text-white">
                <div className="text-sm font-semibold">Current Segment</div>
                <div className="text-blue-300 text-xs capitalize">{currentSegment.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Center - Segment Progress */}
            <div className="flex-1 mx-8">
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${segmentProgress}%` }}
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              <div className="text-white text-right">
                <div className="text-sm font-semibold">3x2x1 Format</div>
                <div className="text-blue-300 text-xs">3 Questions • 2 Choices • 1 Fortune</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Complete */}
      {lessonComplete && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center max-w-2xl">
            <div className="text-8xl mb-6">🎓</div>
            <h2 className="text-4xl font-bold text-white mb-4">Lesson Complete!</h2>
            <p className="text-xl text-blue-200 mb-8">
              Amazing work! You've experienced learning that adapts to you in real-time.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{age}</div>
                <div className="text-sm text-gray-300">Your Age</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{tones[tone].icon}</div>
                <div className="text-sm text-gray-300">{tones[tone].name}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{languages[language].split(' ')[0]}</div>
                <div className="text-sm text-gray-300">Language</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (API Integration Ready) */}
      <div className="absolute bottom-8 right-8 bg-black/50 text-white p-3 rounded-lg text-xs font-mono max-w-md">
        <div className="text-green-400 font-bold mb-2">🚀 iLearn.how API Player</div>
        <div><strong>Age:</strong> {age} ({getAgeCategory(age)})</div>
        <div><strong>Tone:</strong> {tone}</div> 
        <div><strong>Language:</strong> {language}</div>
        <div><strong>Segment:</strong> {currentSegment}</div>
        <div><strong>Video URL:</strong> {generateVideoURL(currentSegment, age, tone, language).split('/').slice(-4).join('/')}</div>
        <div className="text-blue-400 mt-2 text-xs">Ready for API deployment • Real-time script generation • Zero reload switching</div>
      </div>
    </div>
  );
};

// Demo with sample lesson data
const RealTimeSwitchingDemo = () => {
  const sampleLesson = {
    lesson_metadata: {
      lesson_id: 'molecular_biology',
      day: 189,
      date: 'July 8',
      title: 'Biochemistry - The Chemistry of Life',
      duration: '6 minutes'
    }
  };

  return <RealTimeSwitchingPlayer initialLesson={sampleLesson} />;
};

export default RealTimeSwitchingDemo;