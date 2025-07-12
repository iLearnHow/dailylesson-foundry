import React, { useState, useEffect } from 'react';
import { Calendar, User, Camera, RotateCcw, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const DailyFortuneSystem = () => {
  const [selectedTeacher, setSelectedTeacher] = useState('kelly');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [scanningPhase, setScanningPhase] = useState('center');
  const [currentDay, setCurrentDay] = useState(new Date().getDate());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const teachers = {
    kelly: {
      name: 'Kelly',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      avatar: '👩‍🏫'
    },
    ken: {
      name: 'Ken', 
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      avatar: '👨‍🏫'
    },
    custom: {
      name: 'You',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      avatar: '🎭'
    }
  };

  const scanPhases = [
    { phase: 'center', instruction: 'Look straight ahead', rotation: 0 },
    { phase: 'left', instruction: 'Turn slightly left', rotation: -15 },
    { phase: 'right', instruction: 'Turn slightly right', rotation: 15 },
    { phase: 'up', instruction: 'Look up slightly', rotation: 0 },
    { phase: 'down', instruction: 'Look down slightly', rotation: 0 },
    { phase: 'smile', instruction: 'Smile naturally', rotation: 0 },
    { phase: 'neutral', instruction: 'Neutral expression', rotation: 0 },
    { phase: 'thinking', instruction: 'Show thinking face', rotation: 0 },
    { phase: 'surprised', instruction: 'Show surprise', rotation: 0 }
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const startFaceScanning = () => {
    setShowFaceScanner(true);
    setIsScanning(true);
    setScanProgress(0);
    setScanningPhase('center');
    
    let phaseIndex = 0;
    let progress = 0;
    
    const scanInterval = setInterval(() => {
      progress += 2;
      setScanProgress(progress);
      
      if (progress >= 100) {
        phaseIndex++;
        if (phaseIndex >= scanPhases.length) {
          clearInterval(scanInterval);
          setIsScanning(false);
          setSelectedTeacher('custom');
          setTimeout(() => setShowFaceScanner(false), 1000);
        } else {
          setScanningPhase(scanPhases[phaseIndex].phase);
          progress = 0;
        }
      }
    }, 100);
  };

  const currentPhase = scanPhases.find(p => p.phase === scanningPhase) || scanPhases[0];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: teachers[selectedTeacher].background }}
      />
      
      {/* Teacher Avatar - Prominent Display */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl opacity-20 pointer-events-none">
        {teachers[selectedTeacher].avatar}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        
        {/* Teacher Selection */}
        <div className="absolute top-6 left-6 flex gap-2">
          {Object.entries(teachers).map(([key, teacher]) => (
            <button
              key={key}
              onClick={() => key === 'custom' ? startFaceScanning() : setSelectedTeacher(key)}
              className={`px-4 py-2 rounded-full text-white font-medium transition-all duration-300 ${
                selectedTeacher === key 
                  ? 'bg-white bg-opacity-30 scale-105' 
                  : 'bg-black bg-opacity-20 hover:bg-opacity-30'
              }`}
            >
              {teacher.avatar} {teacher.name}
            </button>
          ))}
        </div>

        {/* Daily Fortune Card */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl mx-auto text-center text-white shadow-xl">
          <div className="mb-6">
            <div className="text-6xl mb-4">{teachers[selectedTeacher].avatar}</div>
            <h1 className="text-4xl font-bold mb-2">Your Daily Fortune</h1>
            <p className="text-xl opacity-90">with {teachers[selectedTeacher].name}</p>
          </div>

          <div className="bg-white bg-opacity-20 rounded-xl p-6 mb-8">
            <p className="text-lg mb-4">
              Congratulations! You've completed today's lesson on collaborative problem solving through understanding.
            </p>
            <p className="text-base opacity-90">
              Remember: understanding others' interests creates better solutions than defending positions
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-colors">
              Restart Lesson
            </button>
            <button className="bg-gray-800 hover:bg-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors">
              Next Lesson
            </button>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2, 3, 4].map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === 4 ? 'bg-blue-400' : 'bg-green-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating Calendar Toggle */}
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="fixed bottom-6 right-6 bg-white bg-opacity-20 backdrop-blur-lg p-4 rounded-full text-white hover:bg-opacity-30 transition-all duration-300 shadow-lg z-50"
      >
        <Calendar size={24} />
      </button>

      {/* Calendar Overlay */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              <button
                onClick={() => setShowCalendar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {generateCalendarDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => day && setCurrentDay(day)}
                  className={`p-2 rounded-lg hover:bg-blue-100 transition-colors ${
                    day === currentDay && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear()
                      ? 'bg-blue-500 text-white'
                      : day 
                      ? 'text-gray-800 hover:text-blue-600'
                      : 'text-transparent'
                  }`}
                >
                  {day || ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Face Scanner Modal */}
      {showFaceScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="relative mb-8">
              <div className="w-80 h-80 mx-auto relative">
                {/* Scanning Circle */}
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-pulse">
                  <div className="absolute inset-2 border-2 border-blue-400 rounded-full opacity-60">
                    <div className="absolute inset-2 border-1 border-blue-300 rounded-full opacity-40"></div>
                  </div>
                </div>
                
                {/* Scanning Lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-blue-500 opacity-80 animate-pulse"></div>
                  <div className="absolute w-0.5 h-full bg-blue-500 opacity-80 animate-pulse"></div>
                </div>
                
                {/* Rotating Scanner */}
                <div 
                  className="absolute inset-0 border-t-4 border-blue-400 rounded-full animate-spin"
                  style={{ animationDuration: '3s' }}
                ></div>
                
                {/* Face Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl opacity-50">👤</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Face Recognition Setup</h2>
              <p className="text-lg">{currentPhase.instruction}</p>
              <div className="w-64 mx-auto bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400">
                Phase {scanPhases.findIndex(p => p.phase === scanningPhase) + 1} of {scanPhases.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyFortuneSystem;