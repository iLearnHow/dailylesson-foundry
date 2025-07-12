// apps/lesson-player/src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { LessonPlayer } from './components/LessonPlayer';
import { LessonControls } from './components/LessonControls';
import { UserAvatarSetup } from './components/UserAvatarSetup';
import { ProgressTracker } from './components/ProgressTracker';
import { ILearnAPI } from './services/api';
import { Calendar } from 'lucide-react';

interface User {
  id: string;
  avatarUrl?: string;
  voiceId?: string;
  preferences: {
    defaultAge: number;
    defaultTone: 'grandmother' | 'fun' | 'neutral';
    defaultLanguage: string;
  };
}

interface Lesson {
  lesson_id: string;
  lesson_metadata: {
    title: string;
    age_target: number;
    tone: string;
    language: string;
    duration: string;
    complexity: string;
    date: string;
  };
  scripts: Array<{
    script_number: number;
    type: string;
    voice_text: string;
    on_screen_text: string;
    timing_notes: string;
  }>;
  video_url: string;
  audio_url: string;
}

// Utility to get UTC date and day-of-year
function getUTCDateAndDayOfYear() {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(Date.UTC(utc.getUTCFullYear(), 0, 0));
  const diff = utc.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { utcDate: utc, dayOfYear };
}

export default function App() {
  // State Management
  const [user, setUser] = useState<User | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonSettings, setLessonSettings] = useState({
    age: 25,
    tone: 'neutral' as const,
    language: 'english'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [selectedDay, setSelectedDay] = useState(getUTCDateAndDayOfYear().dayOfYear);
  const [fallback, setFallback] = useState(null);
  
  const api = useRef(new ILearnAPI(process.env.REACT_APP_API_KEY!));

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Load user from localStorage or create new
    const savedUser = localStorage.getItem('ilearn_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Load today's lesson
    await loadLessonForDay();
  };

  // Update lesson fetch to use selectedDay
  const loadLessonForDay = async (dayOfYear = selectedDay) => {
    setIsLoading(true);
    try {
      const lesson = await api.current.getDailyLesson({ ...lessonSettings, dayOfYear });
      if (!lesson || lesson.scripts.length < 10 || /TODO|error|truncated/i.test(lesson.scripts[0].voice_text)) {
        setFallback({
          message: `Oops! We couldn’t find the lesson for your exact choices (age: ${lessonSettings.age}, tone: ${lessonSettings.tone}, language: ${lessonSettings.language}) today.`,
          explanation: `Why? Sometimes, computers need to pre-generate lots of lesson versions, and occasionally one might be missing or still loading.\nWhat does this mean? You’re helping us make the system better!\nWhat can you do? Try a different age, tone, or language—or check back soon.`,
          show: true
        });
        // Optionally log fallback event for monitoring
        fetch('/api/monitor/log-fallback', { method: 'POST', body: JSON.stringify({ age: lessonSettings.age, tone: lessonSettings.tone, language: lessonSettings.language, date: new Date().toISOString().slice(0, 10) }) });
        return;
      } else {
        setFallback(null);
        setCurrentLesson(lesson);
      }
    } catch (e) {
      setFallback({
        message: `We hit a snag loading your lesson.`,
        explanation: `This can happen if the lesson data is missing or the network is slow. Computers sometimes need a little help! Try again, or pick a different option.`,
        show: true
      });
      fetch('/api/monitor/log-fallback', { method: 'POST', body: JSON.stringify({ age: lessonSettings.age, tone: lessonSettings.tone, language: lessonSettings.language, date: new Date().toISOString().slice(0, 10), error: e.message }) });
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, load today's lesson by UTC
  useEffect(() => {
    const { dayOfYear } = getUTCDateAndDayOfYear();
    setSelectedDay(dayOfYear);
    loadLessonForDay(dayOfYear);
  }, []);

  // When settings or selectedDay change, reload lesson
  useEffect(() => {
    loadLessonForDay(selectedDay);
  }, [lessonSettings, selectedDay]);

  // Real-time lesson adaptation
  const handleSettingsChange = async (newSettings: typeof lessonSettings) => {
    if (!currentLesson) return;
    
    setIsLoading(true);
    setLessonSettings(newSettings);
    
    try {
      // Get adapted lesson for new settings
      const adaptedLesson = await api.current.getDailyLesson(newSettings);
      setCurrentLesson(adaptedLesson);
    } catch (error) {
      console.error('Failed to adapt lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAvatarCreated = (avatarData: { avatarUrl: string; voiceId: string }) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      avatarUrl: avatarData.avatarUrl,
      voiceId: avatarData.voiceId,
      preferences: {
        defaultAge: lessonSettings.age,
        defaultTone: lessonSettings.tone,
        defaultLanguage: lessonSettings.language
      }
    };
    
    setUser(newUser);
    localStorage.setItem('ilearn_user', JSON.stringify(newUser));
  };

  const handleProgressUpdate = (segmentIndex: number, segmentProgress: number) => {
    setCurrentSegment(segmentIndex);
    const totalProgress = (segmentIndex / (currentLesson?.scripts.length || 1)) * 100 + 
                         (segmentProgress / (currentLesson?.scripts.length || 1));
    setProgress(Math.min(totalProgress, 100));
  };

  // Show avatar setup for new users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <UserAvatarSetup onAvatarCreated={handleUserAvatarCreated} />
      </div>
    );
  }

  // Calendar/day picker UI (simple dropdown for now)
  const renderDayPicker = () => (
    <div className="mb-6">
      <label className="block text-white mb-2 font-semibold flex items-center"><Calendar className="mr-2" />Pick a Day</label>
      <select
        value={selectedDay}
        onChange={e => setSelectedDay(Number(e.target.value))}
        className="w-full p-2 rounded-lg bg-white/10 text-white border border-white/20"
      >
        {Array.from({ length: 366 }, (_, i) => (
          <option key={i + 1} value={i + 1}>Day {i + 1}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={user.avatarUrl} 
                alt="Your Avatar" 
                className="w-12 h-12 rounded-full border-2 border-blue-400"
              />
              <div>
                <h1 className="text-white text-xl font-bold">Your Daily Lesson</h1>
                <p className="text-blue-300 text-sm">
                  {currentLesson?.lesson_metadata.date} • Day {currentLesson?.lesson_metadata.day}
                </p>
              </div>
            </div>
            
            <ProgressTracker 
              progress={progress}
              currentSegment={currentSegment}
              totalSegments={currentLesson?.scripts.length || 0}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl">Preparing your personalized lesson...</p>
            </div>
          </div>
        ) : currentLesson ? (
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Lesson Player - Main Content */}
              <div className="lg:col-span-3">
                <LessonPlayer
                  lesson={currentLesson}
                  userAvatar={user.avatarUrl}
                  userVoice={user.voiceId}
                  onProgressUpdate={handleProgressUpdate}
                  settings={lessonSettings}
                />
              </div>
              
              {/* Controls Sidebar */}
              <div className="lg:col-span-1">
                {renderDayPicker()}
                <LessonControls
                  settings={lessonSettings}
                  onSettingsChange={handleSettingsChange}
                  lesson={currentLesson}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-screen text-white text-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Welcome to Your Learning Journey!</h2>
              <p className="text-blue-300 mb-6">Let's get your first lesson ready...</p>
              <button 
                onClick={loadLessonForDay}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Learning
              </button>
            </div>
          </div>
        )}
        {fallback && fallback.show && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 my-4">
            <div className="font-bold mb-2">{fallback.message}</div>
            <div className="mb-2 whitespace-pre-line">{fallback.explanation}</div>
            <button onClick={() => window.location.reload()} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Try Again</button>
            <a href="/learn-more-about-lessons" className="underline text-blue-700">Learn more</a>
          </div>
        )}
      </main>
    </div>
  );
}

// apps/lesson-player/src/components/LessonPlayer.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface LessonPlayerProps {
  lesson: Lesson;
  userAvatar?: string;
  userVoice?: string;
  onProgressUpdate: (segmentIndex: number, segmentProgress: number) => void;
  settings: {
    age: number;
    tone: string;
    language: string;
  };
}

export function LessonPlayer({ lesson, userAvatar, userVoice, onProgressUpdate, settings }: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  const currentScript = lesson.scripts[currentSegmentIndex];

  useEffect(() => {
    if (videoRef.current) {
      // Use user avatar video if available, otherwise use lesson video
      const videoUrl = userAvatar 
        ? generateUserAvatarVideoUrl(lesson.lesson_id, currentScript.type, settings, userAvatar)
        : lesson.video_url;
      
      videoRef.current.src = videoUrl;
    }
  }, [lesson, currentSegmentIndex, userAvatar, settings]);

  const generateUserAvatarVideoUrl = (lessonId: string, segmentType: string, settings: any, avatarId: string) => {
    return `https://videos.ilearn.how/user-avatars/${avatarId}/${lessonId}/${segmentType}_${settings.age}_${settings.tone}_${settings.language}.mp4`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      
      const segmentProgress = (current / total) * 100;
      onProgressUpdate(currentSegmentIndex, segmentProgress);
    }
  };

  const handleVideoEnd = () => {
    if (currentSegmentIndex < lesson.scripts.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1);
    } else {
      // Lesson complete
      onLessonComplete();
    }
  };

  const onLessonComplete = () => {
    // Trigger celebration, save progress, etc.
    console.log('Lesson completed!');
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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
      {/* Video Player */}
      <video
        ref={videoRef}
        className="w-full aspect-video object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={handleVideoEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        playsInline
      />
      
      {/* Video Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/20 rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white ml-1" />}
            </button>
            
            <button
              onClick={toggleMute}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              {isMuted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
            </button>
            
            <div className="text-white text-sm">
              {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="text-white text-sm">
            Segment {currentSegmentIndex + 1} of {lesson.scripts.length}
          </div>
        </div>
      </div>
      
      {/* Script Overlay */}
      <div className="absolute top-6 left-6 right-6">
        <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <h3 className="text-white font-semibold mb-2">{lesson.lesson_metadata.title}</h3>
          <p className="text-blue-200 text-sm">{currentScript.on_screen_text}</p>
        </div>
      </div>
    </div>
  );
}

// apps/lesson-player/src/components/LessonControls.tsx
import React from 'react';
import { User, Sparkles, Globe, Clock, Settings } from 'lucide-react';

interface LessonControlsProps {
  settings: {
    age: number;
    tone: string;
    language: string;
  };
  onSettingsChange: (settings: any) => void;
  lesson: any;
  isLoading: boolean;
}

export function LessonControls({ settings, onSettingsChange, lesson, isLoading }: LessonControlsProps) {
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
    'neutral': { name: 'Clear & Direct', icon: '🎯', description: 'Professional, evidence-based' },
    'fun': { name: 'Energetic & Fun', icon: '🚀', description: 'Celebratory, adventure-focused' },
    'grandmother': { name: 'Warm & Loving', icon: '💝', description: 'Nurturing, wise guidance' }
  };

  const getAgeCategory = (age: number) => {
    if (age <= 7) return 'Early Childhood';
    if (age <= 17) return 'Youth';
    if (age <= 35) return 'Young Adult';
    if (age <= 65) return 'Midlife';
    return 'Wisdom Years';
  };

  return (
    <div className="space-y-6">
      {/* Lesson Info */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-white text-xl font-bold mb-4">Designed-to-be-Yours</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-blue-300">
            <Clock size={16} />
            <span>{lesson?.lesson_metadata.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-green-300">
            <Settings size={16} />
            <span>{lesson?.lesson_metadata.complexity}</span>
          </div>
        </div>
      </div>

      {/* Age Control */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-green-400" size={20} />
          <span className="text-white font-semibold">Age-Mix: {settings.age}</span>
        </div>
        <div className="mb-3">
          <span className="text-green-300 text-sm">{getAgeCategory(settings.age)}</span>
        </div>
        <input
          type="range"
          min="2"
          max="102"
          value={settings.age}
          onChange={(e) => onSettingsChange({ ...settings, age: parseInt(e.target.value) })}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Simpler</span>
          <span>More Sophisticated</span>
        </div>
        <p className="text-blue-200 text-xs mt-2">
          If this feels too simple or complex, adjust my age-mix to match your thinking
        </p>
      </div>

      {/* Tone Control */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-400" size={20} />
          <span className="text-white font-semibold">My Tone</span>
        </div>
        <div className="space-y-2">
          {Object.entries(tones).map(([key, tone]) => (
            <button
              key={key}
              onClick={() => onSettingsChange({ ...settings, tone: key })}
              disabled={isLoading}
              className={`w-full p-3 rounded-xl text-left transition-all ${
                settings.tone === key 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tone.icon}</span>
                <div>
                  <div className="font-semibold">{tone.name}</div>
                  <div className="text-sm opacity-75">{tone.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-blue-200 text-xs mt-3">
          If my energy doesn't match yours, change my tone instantly
        </p>
      </div>

      {/* Language Control */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="text-yellow-400" size={20} />
          <span className="text-white font-semibold">Language</span>
        </div>
        <select
          value={settings.language}
          onChange={(e) => onSettingsChange({ ...settings, language: e.target.value })}
          disabled={isLoading}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
        >
          {Object.entries(languages).map(([key, name]) => (
            <option key={key} value={key} className="bg-gray-800">
              {name}
            </option>
          ))}
        </select>
        <p className="text-blue-200 text-xs mt-2">
          If examples don't fit your world, switch languages for better cultural fit
        </p>
      </div>

      {/* Tool Empowerment Message */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
        <h3 className="text-white font-semibold mb-2">We designed this for you</h3>
        <p className="text-blue-200 text-sm leading-relaxed">
          This learning experience is designed-to-be-yours. We are going to make sure you have everything you need to understand this perfectly. Here's our best next step together.
        </p>
      </div>
    </div>
  );
}

// apps/lesson-player/src/services/api.ts
export class ILearnAPI {
  private baseUrl = 'https://api.ilearn.how/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getDailyLesson(settings: { age: number; tone: string; language: string }) {
    const params = new URLSearchParams({
      age: settings.age.toString(),
      tone: settings.tone,
      language: settings.language,
    });

    return this.request(`/daily-lesson?${params}`);
  }

  async getLessonById(lessonId: string, includeMedia = true) {
    const params = new URLSearchParams({
      include_media: includeMedia.toString(),
    });

    return this.request(`/lessons/${lessonId}?${params}`);
  }

  async generateCustomLesson(topic: string, settings: { age: number; tone: string; language: string; customInstructions?: string }) {
    return this.request('/lessons/generate', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        ...settings,
        custom_instructions: settings.customInstructions,
      }),
    });
  }
}