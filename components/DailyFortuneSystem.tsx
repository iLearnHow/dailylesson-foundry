import React, { useState, useRef } from 'react';
import { Calendar, User, Users, Camera, RotateCcw, Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Smile, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

// Teacher avatar assets
const teacherAssets = {
  kelly: {
    name: 'Kelly',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    avatar: '🧑‍🏫',
  },
  ken: {
    name: 'Ken',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    avatar: '👨‍🏫',
  },
  custom: {
    name: 'You',
    background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
    avatar: '🧑', // Will be replaced by generated SVG
  },
};

const scanningPhases = [
  { label: 'Center', icon: Eye },
  { label: 'Left', icon: ArrowLeft },
  { label: 'Right', icon: ArrowRight },
  { label: 'Up', icon: ChevronUp },
  { label: 'Down', icon: ChevronDown },
  { label: 'Smile', icon: Smile },
  { label: 'Blink', icon: EyeOff },
  { label: 'Surprised', icon: Loader2 },
  { label: 'Done', icon: CheckCircle },
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DailyFortuneSystem({ initialTeacher = 'kelly', onLessonSelect }) {
  // Teacher selection state
  const [selectedTeacher, setSelectedTeacher] = useState(initialTeacher);
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [scanningPhase, setScanningPhase] = useState(0);
  const [customAvatarSVG, setCustomAvatarSVG] = useState(null);

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // Animation state
  const [switchingTeacher, setSwitchingTeacher] = useState(false);

  // Accessibility
  const [fontSize, setFontSize] = useState('large');
  const [contrast, setContrast] = useState('normal');

  // Handle teacher switching with animation
  const handleTeacherSwitch = (teacher) => {
    if (teacher === selectedTeacher) return;
    setSwitchingTeacher(true);
    setTimeout(() => {
      setSelectedTeacher(teacher);
      setSwitchingTeacher(false);
    }, 400);
  };

  // Face scanning logic
  const startFaceScan = () => {
    setShowFaceScanner(true);
    setScanningPhase(0);
  };
  const nextScanPhase = () => {
    if (scanningPhase < scanningPhases.length - 1) {
      setScanningPhase(scanningPhase + 1);
    } else {
      // Simulate avatar generation
      setTimeout(() => {
        setCustomAvatarSVG('<svg width="96" height="96"><circle cx="48" cy="48" r="44" fill="#43cea2" stroke="#185a9d" strokeWidth="8" /><text x="50%" y="54%" textAnchor="middle" fontSize="40" fill="#fff">😊</text></svg>');
        setShowFaceScanner(false);
        setSelectedTeacher('custom');
      }, 1000);
    }
  };

  // Calendar logic
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d, m, y) => d === today.getDate() && m === today.getMonth() && y === today.getFullYear();

  // Render teacher avatar
  const renderTeacherAvatar = () => {
    const teacher = teacherAssets[selectedTeacher];
    return (
      <div
        className={clsx(
          'relative flex flex-col items-center justify-center transition-all duration-500',
          switchingTeacher && 'opacity-0 scale-90',
          !switchingTeacher && 'opacity-100 scale-100'
        )}
        style={{
          background: teacher.background,
          borderRadius: '2rem',
          width: 240,
          height: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          margin: '0 auto',
          marginTop: 32,
          marginBottom: 24,
        }}
        aria-label={teacher.name}
      >
        <div style={{ fontSize: 120, marginTop: 24 }}>
          {selectedTeacher === 'custom' && customAvatarSVG ? (
            <span dangerouslySetInnerHTML={{ __html: customAvatarSVG }} />
          ) : (
            teacher.avatar
          )}
        </div>
        <div className="mt-4 text-2xl font-bold text-white drop-shadow-lg">{teacher.name}</div>
      </div>
    );
  };

  // Render teacher selector
  const renderTeacherSelector = () => (
    <div className="flex justify-center gap-6 mt-2 mb-4">
      <button
        className={clsx('rounded-full p-3 text-3xl transition-all', selectedTeacher === 'kelly' ? 'ring-4 ring-blue-400' : 'hover:ring-2 ring-blue-200')}
        aria-label="Select Kelly"
        onClick={() => handleTeacherSwitch('kelly')}
      >🧑‍🏫</button>
      <button
        className={clsx('rounded-full p-3 text-3xl transition-all', selectedTeacher === 'ken' ? 'ring-4 ring-pink-400' : 'hover:ring-2 ring-pink-200')}
        aria-label="Select Ken"
        onClick={() => handleTeacherSwitch('ken')}
      >👨‍🏫</button>
      <button
        className={clsx('rounded-full p-3 text-3xl transition-all', selectedTeacher === 'custom' ? 'ring-4 ring-green-400' : 'hover:ring-2 ring-green-200')}
        aria-label="Create Custom Teacher"
        onClick={startFaceScan}
      >{customAvatarSVG ? <span dangerouslySetInnerHTML={{ __html: customAvatarSVG }} /> : <Camera />}</button>
    </div>
  );

  // Render calendar widget
  const renderCalendarWidget = () => (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        className="bg-white/90 rounded-full shadow-lg p-4 hover:bg-blue-100 transition-all"
        aria-label="Open Calendar"
        onClick={() => setShowCalendar(true)}
      >
        <Calendar className="w-7 h-7 text-blue-600" />
      </button>
      {showCalendar && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-end z-50" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 m-8 max-w-lg w-full relative animate-fadeInUp" style={{ minHeight: 420 }}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-600"
              aria-label="Close Calendar"
              onClick={() => setShowCalendar(false)}
            >
              <RotateCcw />
            </button>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCalendarMonth((calendarMonth + 11) % 12)} aria-label="Previous Month"><ChevronLeft /></button>
              <div className="font-bold text-lg">{months[calendarMonth]} {calendarYear}</div>
              <button onClick={() => setCalendarMonth((calendarMonth + 1) % 12)} aria-label="Next Month"><ChevronRight /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold mb-2">
              {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, i) => <div key={i}></div>)}
              {Array.from({ length: daysInMonth(calendarMonth, calendarYear) }, (_, d) => (
                <button
                  key={d+1}
                  className={clsx(
                    'rounded-lg p-2 transition-all',
                    isToday(d+1, calendarMonth, calendarYear) ? 'bg-blue-500 text-white font-bold' : 'bg-blue-50 hover:bg-blue-200',
                  )}
                  aria-label={`Go to lesson for ${months[calendarMonth]} ${d+1}`}
                  onClick={() => {
                    setShowCalendar(false);
                    onLessonSelect && onLessonSelect(calendarYear, calendarMonth, d+1);
                  }}
                >{d+1}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render face scanning modal
  const renderFaceScanner = () => showFaceScanner && (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center animate-fadeIn">
        <div className="mb-6 text-blue-600 text-4xl font-bold">Face Scan</div>
        <div className="mb-4 flex flex-col items-center">
          <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-blue-400 animate-pulse">
            {React.createElement(scanningPhases[scanningPhase].icon, { className: 'w-16 h-16 text-blue-600' })}
          </div>
          <div className="text-lg font-semibold mb-2">{scanningPhases[scanningPhase].label}</div>
          <div className="text-blue-400 text-sm mb-4">{scanningPhase < scanningPhases.length - 1 ? 'Follow the guide to scan your face.' : 'Generating your teacher avatar...'}</div>
        </div>
        <button
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-4"
          onClick={nextScanPhase}
          disabled={scanningPhase === scanningPhases.length - 1}
        >{scanningPhase < scanningPhases.length - 1 ? 'Next' : 'Finish'}</button>
      </div>
    </div>
  );

  // Main render
  return (
    <div
      className={clsx('min-h-screen flex flex-col items-center justify-start', contrast === 'high' && 'bg-black text-white')}
      style={{ fontSize: fontSize === 'large' ? 22 : fontSize === 'xlarge' ? 28 : 18 }}
    >
      {/* Teacher Avatar and Selector */}
      <div className="w-full flex flex-col items-center mt-8">
        {renderTeacherAvatar()}
        {renderTeacherSelector()}
      </div>
      {/* Fortune and Actions (placeholder) */}
      <div className="w-full max-w-xl mx-auto mt-4 mb-8 bg-white/90 rounded-2xl shadow-lg p-8 flex flex-col items-center" style={{ zIndex: 1 }}>
        <div className="text-2xl font-bold mb-4 text-center">Your Daily Fortune</div>
        <div className="text-lg text-center mb-6">Congratulations! You've completed today's lesson. Remember: understanding others' interests creates better solutions than defending positions.</div>
        <div className="flex gap-4 mt-2">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Restart Lesson</button>
          <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Next Lesson</button>
        </div>
      </div>
      {/* Floating Calendar Widget */}
      {renderCalendarWidget()}
      {/* Face Scanning Modal */}
      {renderFaceScanner()}
    </div>
  );
} 