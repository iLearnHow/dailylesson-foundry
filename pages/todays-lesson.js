import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Settings, User, Sparkles, Globe, Clock, Target, BookOpen, Loader } from 'lucide-react'

export default function TodaysLesson() {
  // Lesson state
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  
  // Slider controls
  const [settings, setSettings] = useState({
    age: 25,
    tone: 'neutral',
    language: 'english'
  });
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  
  const audioRef = useRef(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

  // Load today's lesson
  useEffect(() => {
    loadTodaysLesson();
  }, []);

  // Load lesson when settings change
  useEffect(() => {
    if (lesson) {
      loadTodaysLesson();
    }
  }, [settings]);

  const loadTodaysLesson = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/v1/daily-lesson?age=${settings.age}&tone=${settings.tone}&language=${settings.language}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const lessonData = await response.json();
      setLesson(lessonData);
      setError(null);
    } catch (err) {
      console.error('Failed to load lesson:', err);
      setError(`Failed to load lesson: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate audio for current lesson
  const generateAudio = async () => {
    if (!lesson) return;
    
    setAudioLoading(true);
    try {
      // Extract all voice text from scripts
      const voiceText = lesson.scripts
        .map(script => script.voice_text)
        .join('\n\n');

      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: voiceText,
          tone: settings.tone,
          language: settings.language,
          lessonId: lesson.lesson_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioData = await response.json();
      
      // Set audio source
      if (audioRef.current) {
        audioRef.current.src = audioData.audioUrl;
        audioRef.current.load();
      }
      
    } catch (err) {
      console.error('Audio generation failed:', err);
      setError(`Audio generation failed: ${err.message}`);
    } finally {
      setAudioLoading(false);
    }
  };

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAgeCategory = (age) => {
    if (age <= 7) return 'Early Childhood';
    if (age <= 17) return 'Youth';
    if (age <= 35) return 'Young Adult';
    if (age <= 65) return 'Midlife';
    return 'Wisdom Years';
  };

  const tones = {
    'neutral': { name: 'Clear & Direct', icon: '🎯', description: 'Professional, evidence-based' },
    'fun': { name: 'Energetic & Fun', icon: '🚀', description: 'Celebratory, adventure-focused' },
    'grandmother': { name: 'Warm & Loving', icon: '💝', description: 'Nurturing, wise guidance' }
  };

  const languages = {
    'english': '🇺🇸 English',
    'spanish': '🇪🇸 Español',
    'french': '🇫🇷 Français',
    'german': '🇩🇪 Deutsch',
    'chinese': '🇨🇳 中文'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader className="w-16 h-16 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading Today's Lesson</h2>
          <p className="text-blue-300">Preparing your personalized learning experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="bg-red-500/20 border border-red-400 text-red-300 px-6 py-4 rounded-lg mb-4 max-w-md">
            <strong>Error:</strong> {error}
          </div>
          <button 
            onClick={loadTodaysLesson}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Head>
        <title>Today's Lesson - DailyLesson</title>
        <meta name="description" content="Your personalized daily lesson with real-time adaptation" />
      </Head>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <BookOpen className="text-blue-400" size={24} />
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">Today's Lesson</h1>
                <p className="text-blue-300 text-sm">
                  {lesson?.lesson_metadata?.date} • Day {lesson?.lesson_metadata?.day}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{lesson?.lesson_metadata?.duration}s</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={16} />
                <span>{lesson?.lesson_metadata?.complexity}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Lesson Content - Main */}
            <div className="lg:col-span-3">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                
                {/* Lesson Title */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {lesson?.lesson_metadata?.title}
                  </h2>
                  <p className="text-blue-200 text-lg leading-relaxed">
                    {lesson?.lesson_metadata?.objective}
                  </p>
                </div>

                {/* Script Content */}
                <div className="space-y-6">
                  {lesson?.scripts?.map((script, index) => (
                    <div 
                      key={index}
                      className={`p-6 rounded-xl border transition-all ${
                        currentSegment === index 
                          ? 'bg-blue-500/20 border-blue-400' 
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-2 capitalize">
                            {script.script_type?.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-blue-200 leading-relaxed mb-3">
                            {script.voice_text}
                          </p>
                          {script.on_screen_text && (
                            <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                              <p className="text-white text-sm font-mono">
                                {script.on_screen_text}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audio Player */}
                <div className="mt-8 bg-black/30 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Audio Lesson</h3>
                    <button
                      onClick={generateAudio}
                      disabled={audioLoading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      {audioLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      Generate Audio
                    </button>
                  </div>
                  
                  <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnd}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full"
                  />
                  
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
                    >
                      {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-1" />}
                    </button>
                    
                    <button
                      onClick={toggleMute}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                    >
                      {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
                    </button>
                    
                    <div className="flex-1">
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Controls Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                
                {/* Lesson Info */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <h2 className="text-white text-xl font-bold mb-4">Designed-to-be-Yours</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-blue-300">
                      <Clock size={16} />
                      <span>{lesson?.lesson_metadata?.duration}s</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-300">
                      <Settings size={16} />
                      <span>{lesson?.lesson_metadata?.complexity}</span>
                    </div>
                  </div>
                </div>

                {/* Age Control */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="text-green-400" size={20} />
                    <span className="text-white font-semibold">Age: {settings.age}</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-green-300 text-sm">{getAgeCategory(settings.age)}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="75"
                    value={settings.age}
                    onChange={(e) => setSettings({ ...settings, age: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    disabled={loading}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Simpler</span>
                    <span>More Sophisticated</span>
                  </div>
                </div>

                {/* Tone Control */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-purple-400" size={20} />
                    <span className="text-white font-semibold">Tone</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(tones).map(([key, tone]) => (
                      <button
                        key={key}
                        onClick={() => setSettings({ ...settings, tone: key })}
                        disabled={loading}
                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                          settings.tone === key
                            ? 'border-purple-400 bg-purple-500/20 text-white'
                            : 'border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{tone.icon}</span>
                          <div>
                            <div className="font-semibold">{tone.name}</div>
                            <div className="text-xs opacity-80">{tone.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Control */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="text-blue-400" size={20} />
                    <span className="text-white font-semibold">Language</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(languages).map(([key, language]) => (
                      <button
                        key={key}
                        onClick={() => setSettings({ ...settings, language: key })}
                        disabled={loading}
                        className={`w-full p-3 rounded-lg border transition-all text-left ${
                          settings.language === key
                            ? 'border-blue-400 bg-blue-500/20 text-white'
                            : 'border-white/10 hover:border-white/20 text-gray-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{language.split(' ')[0]}</span>
                          <span className="font-semibold">{language.split(' ')[1]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 