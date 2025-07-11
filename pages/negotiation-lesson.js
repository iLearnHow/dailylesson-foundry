import React, { useState, useEffect } from 'react';
import { Calendar, User, Globe } from 'lucide-react';

// Map tone to display name
const TONE_OPTIONS = [
  { value: 'fun', label: 'Fun 🎉' },
  { value: 'grandmother', label: 'Grandmother 💝' },
  { value: 'neutral', label: 'Neutral 🎯' },
];

// Map age to display name
const AGE_OPTIONS = [5, 8, 12, 17, 25, 45, 70];

// Map language to display name
const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English 🇺🇸' },
  { value: 'spanish', label: 'Español 🇪🇸' },
  { value: 'french', label: 'Français 🇫🇷' },
  { value: 'german', label: 'Deutsch 🇩🇪' },
  { value: 'chinese', label: '中文 🇨🇳' },
];

// Helper to get today's date in YYYY-MM-DD
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export default function NegotiationLesson() {
  const [lesson, setLesson] = useState(null);
  const [age, setAge] = useState(8);
  const [tone, setTone] = useState('fun');
  const [language, setLanguage] = useState('english');
  const [currentSegment, setCurrentSegment] = useState(0);

  // Fetch the pre-generated lesson for today, age, tone, and language
  useEffect(() => {
    async function fetchLesson() {
      const date = getTodayDateString();
      // Example: /output/negotiation_fun_adult_english_ken_2024-07-11.json
      let lessonUrl = `/output/negotiation_fun_adult_${language}_ken_${date}.json`;
      if (tone === 'grandmother') lessonUrl = `/output/negotiation_fun_adult_${language}_kelly_${date}.json`;
      // TODO: Add more dynamic selection based on age/tone/language if needed
      let data;
      try {
        const res = await fetch(lessonUrl);
        if (!res.ok) throw new Error('Not found');
        data = await res.json();
      } catch {
        // Fallback to default if today's lesson is missing
        lessonUrl = tone === 'grandmother'
          ? `/output/negotiation_fun_adult_${language}_kelly.json`
          : `/output/negotiation_fun_adult_${language}_ken.json`;
        const res = await fetch(lessonUrl);
        data = await res.json();
      }
      setLesson(data);
      setCurrentSegment(0);
    }
    fetchLesson();
  }, [age, tone, language]);

  // Render answer choices in two columns
  function renderAnswerChoices(segment) {
    if (!segment.choices) return null;
    return (
      <div className="grid grid-cols-2 gap-8 mt-8">
        {segment.choices.map((choice, idx) => (
          <button
            key={idx}
            className={`p-6 rounded-2xl text-xl font-bold shadow-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:scale-105 transition-all`}
            onClick={() => setCurrentSegment(segment.nextSegments[idx])}
          >
            {choice}
          </button>
        ))}
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-white text-3xl font-bold mb-4">Loading your lesson...</div>
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const segment = lesson.scripts[currentSegment];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="relative z-10 w-full max-w-3xl mx-auto p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl mt-16 mb-16">
        {/* Lesson header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="text-blue-400" size={28} />
            <div>
              <div className="text-blue-600 text-sm font-medium uppercase">Today's Lesson</div>
              <div className="text-gray-900 text-2xl font-bold">{lesson.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <User className="text-purple-400" size={28} />
            <div className="text-gray-900 font-bold">{tone === 'grandmother' ? 'Kelly' : 'Ken'}</div>
          </div>
        </div>

        {/* Sliders */}
        <div className="flex items-center gap-8 mb-8">
          <div>
            <label className="block text-gray-900 font-semibold mb-2">Age</label>
            <select
              className="rounded-lg px-4 py-2 bg-white text-black font-bold"
              value={age}
              onChange={e => setAge(Number(e.target.value))}
            >
              {AGE_OPTIONS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-900 font-semibold mb-2">Tone</label>
            <select
              className="rounded-lg px-4 py-2 bg-white text-black font-bold"
              value={tone}
              onChange={e => setTone(e.target.value)}
            >
              {TONE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-900 font-semibold mb-2">Language</label>
            <select
              className="rounded-lg px-4 py-2 bg-white text-black font-bold"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              {LANGUAGE_OPTIONS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Read-along script */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg text-xl text-gray-900 font-serif">
          {segment.voice_text}
        </div>

        {/* Answer choices */}
        {renderAnswerChoices(segment)}
      </div>
    </div>
  );
} 