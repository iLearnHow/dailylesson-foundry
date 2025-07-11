import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Target, Clock, Star, BookOpen, Lightbulb, Globe, Users, Award, TrendingUp, Brain, Heart } from 'lucide-react';

const ImmersiveKenExperience = ({ lesson }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('intro'); // intro, main, conclusion
  
  const videoRef = useRef(null);

  // Create floating particles for engagement
  useEffect(() => {
    if (showCelebration) {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 1,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 4)]
      }));
      setParticles(newParticles);
      
      const animateParticles = () => {
        setParticles(prev => prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.015
        })).filter(p => p.life > 0));
      };
      
      const interval = setInterval(animateParticles, 16);
      const timeout = setTimeout(() => {
        setShowCelebration(false);
        clearInterval(interval);
      }, 4000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [showCelebration]);

  // Mouse tracking for subtle interactivity
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ 
        x: e.clientX / window.innerWidth, 
        y: e.clientY / window.innerHeight 
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
      
      // Determine lesson phase based on progress
      if (progress < 20) setCurrentPhase('intro');
      else if (progress < 80) setCurrentPhase('main');
      else setCurrentPhase('conclusion');
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      videoRef.current.play(); // Auto-play since it's not obvious it's a video
    }
  };

  const handleVideoEnd = () => {
    setShowCelebration(true);
  };

  // Auto-play when lesson loads
  useEffect(() => {
    if (videoRef.current && !isLoading) {
      videoRef.current.play();
    }
  }, [isLoading]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPhaseIcon = () => {
    switch(currentPhase) {
      case 'intro': return <Lightbulb className="text-yellow-400" size={24} />;
      case 'main': return <Brain className="text-blue-400" size={24} />;
      case 'conclusion': return <Heart className="text-red-400" size={24} />;
      default: return <BookOpen className="text-white" size={24} />;
    }
  };

  const getProgressColor = () => {
    if (progress < 33) return 'from-yellow-400 to-orange-500';
    if (progress < 66) return 'from-blue-400 to-purple-500';
    return 'from-green-400 to-blue-500';
  };

  if (!lesson) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center overflow-hidden">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-white/30 border-t-blue-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-white/20 border-b-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
        </div>
        <div className="absolute bottom-1/3 text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Ken is preparing your lesson...</h3>
          <p className="text-blue-200 text-lg">Get ready for an amazing learning experience!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 overflow-hidden">
      {/* Celebration Particles */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: particle.x,
                top: particle.y,
                backgroundColor: particle.color,
                opacity: particle.life,
                transform: `scale(${particle.life}) rotate(${particle.life * 360}deg)`,
                boxShadow: `0 0 10px ${particle.color}`
              }}
            />
          ))}
        </div>
      )}

      {/* Ambient Background Effects */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`
        }}
      />
      
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Ken Video - Full Screen */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={lesson.video_url || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnd}
        muted={false}
        playsInline
        autoPlay
      />

      {/* Top Header - Lesson Info */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-8 z-30">
        <div className="flex items-start justify-between">
          {/* Left - Date & Day Info */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Calendar className="text-blue-400" size={28} />
              </div>
              <div>
                <p className="text-blue-300 text-sm font-medium uppercase tracking-wide">Today's Lesson</p>
                <p className="text-white text-2xl font-bold">{lesson.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Target className="text-green-400" size={20} />
                <span className="text-white font-semibold">Day {lesson.day}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-yellow-400" size={20} />
                <span className="text-white font-semibold">{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Right - Progress & Phase */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 min-w-72">
            <div className="flex items-center gap-3 mb-4">
              {getPhaseIcon()}
              <div>
                <p className="text-white font-semibold capitalize">{currentPhase} Phase</p>
                <p className="text-blue-300 text-sm">{Math.round(progress)}% Complete</p>
              </div>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 relative`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Lesson Content */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 z-30">
        <div className="max-w-6xl mx-auto">
          {/* Lesson Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
              {lesson.title}
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
          </div>

          {/* Learning Objective */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl">
                <Target className="text-green-400" size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-3">Learning Objective</h3>
                <p className="text-blue-100 text-lg leading-relaxed">
                  {lesson.learning_objective}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
              <Globe className="text-blue-400 mx-auto mb-2" size={24} />
              <p className="text-white font-bold">Global Impact</p>
              <p className="text-blue-300 text-sm">Democratic Thinking</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
              <Users className="text-green-400 mx-auto mb-2" size={24} />
              <p className="text-white font-bold">Social Skills</p>
              <p className="text-green-300 text-sm">Civic Engagement</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
              <Award className="text-yellow-400 mx-auto mb-2" size={24} />
              <p className="text-white font-bold">Achievement</p>
              <p className="text-yellow-300 text-sm">SDG #4 Progress</p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 text-center">
              <TrendingUp className="text-purple-400 mx-auto mb-2" size={24} />
              <p className="text-white font-bold">Growth</p>
              <p className="text-purple-300 text-sm">Lifelong Learning</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
          <div className="text-center text-white">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold mb-2">Ken is ready to teach!</h3>
            <p className="text-blue-200">Loading your personalized lesson...</p>
          </div>
        </div>
      )}

      {/* Completion Celebration */}
      {showCelebration && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="w-40 h-40 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <Star size={80} className="text-white" />
            </div>
            <h2 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Lesson Complete!
            </h2>
            <p className="text-2xl text-blue-200 mb-6">Outstanding work on Day {lesson.day}!</p>
            <p className="text-lg text-gray-300">You're one step closer to changing the world through education!</p>
          </div>
        </div>
      )}

      {/* Subtle Time Display */}
      <div className="absolute top-1/2 right-8 transform -translate-y-1/2 z-30">
        <div className="bg-white/10 backdrop-blur-xl rounded-full p-4 border border-white/20">
          <div className="text-center">
            <p className="text-white font-mono text-sm">{formatTime(currentTime)}</p>
            <p className="text-blue-300 text-xs">elapsed</p>
          </div>
        </div>
      </div>

      {/* Ken Name Badge (Always Visible) */}
      <div className="absolute bottom-8 right-8 z-30">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 border-2 border-white/30 shadow-2xl">
          <p className="text-white font-bold text-lg">Ken</p>
          <p className="text-blue-200 text-sm">Your Learning Guide</p>
        </div>
      </div>
    </div>
  );
};

// Demo with your lesson data
const KenTeachingDemo = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Your actual lesson data
  const currentLesson = {
    day: 1,
    date: "January 1",
    title: "The Sun - Our Magnificent Life-Giving Star",
    learning_objective: "Understand how scientific observation and measurement create shared global knowledge that transcends cultural and political boundaries, demonstrating how evidence-based thinking builds confidence in democratic decision-making.",
    video_url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4", // Replace with your Ken video
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <ImmersiveKenExperience lesson={null} />;
  }

  return <ImmersiveKenExperience lesson={currentLesson} />;
};

export default KenTeachingDemo;