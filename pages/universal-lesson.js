import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function UniversalLesson() {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    age: 25,
    tone: 'fun',
    language: 'english'
  });

  const generateLesson = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8787/v1/test-acoustics?age=${settings.age}&tone=${settings.tone}&language=${settings.language}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setLesson(data.lesson);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateLesson();
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const regenerateLesson = () => {
    generateLesson();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Generating your personalized lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Universal Lesson - July 11: Acoustics</title>
        <meta name="description" content="Today's lesson on acoustics, adapted just for you" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Today's Universal Lesson</h1>
          <p className="text-xl text-gray-600">July 11, 2025 - Acoustics: The Science of Sound and Hearing</p>
        </div>

        {/* Settings Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Personalize Your Experience</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Age Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age: {settings.age} years old
              </label>
              <input
                type="range"
                min="5"
                max="85"
                value={settings.age}
                onChange={(e) => handleSettingChange('age', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5</span>
                <span>25</span>
                <span>45</span>
                <span>65</span>
                <span>85</span>
              </div>
            </div>

            {/* Tone Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
              <select
                value={settings.tone}
                onChange={(e) => handleSettingChange('tone', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="fun">Fun & Energetic</option>
                <option value="grandmother">Wise & Nurturing</option>
                <option value="neutral">Professional & Clear</option>
              </select>
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="chinese">Chinese</option>
                <option value="japanese">Japanese</option>
                <option value="arabic">Arabic</option>
                <option value="hindi">Hindi</option>
              </select>
            </div>
          </div>

          <button
            onClick={regenerateLesson}
            disabled={loading}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Generating...' : 'Regenerate Lesson'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Lesson Content */}
        {lesson && (
          <div className="space-y-6">
            {/* Lesson Header */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-800">{lesson.lesson_metadata.title}</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Complexity: {lesson.lesson_metadata.complexity}</p>
                  <p className="text-sm text-gray-600">Duration: {lesson.lesson_metadata.duration} seconds</p>
                </div>
              </div>
              <p className="text-lg text-gray-700">{lesson.lesson_metadata.objective}</p>
            </div>

            {/* Scripts */}
            <div className="space-y-4">
              {lesson.scripts.map((script, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 capitalize">
                      {script.script_type.replace('_', ' ')} {script.script_number}
                    </h3>
                    <span className="text-sm text-gray-500">{script.duration_seconds}s</span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Voice Script */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Voice Script</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800 leading-relaxed">{script.voice_text}</p>
                      </div>
                    </div>
                    
                    {/* On-Screen Text */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">On-Screen Text</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <pre className="text-gray-800 whitespace-pre-wrap font-sans">{script.on_screen_text}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Production Notes */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Production Notes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Voice Personality</h4>
                  <p className="text-gray-600">{lesson.production_notes.voice_personality.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Conversation Flow</h4>
                  <p className="text-gray-600">{lesson.production_notes.conversation_flow.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Age-Specific Notes</h4>
                  <p className="text-gray-600">{lesson.production_notes.age_specific_notes}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Cultural Considerations</h4>
                  <p className="text-gray-600">{lesson.production_notes.cultural_considerations}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Real-World Applications</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {lesson.production_notes.real_world_applications.map((app, index) => (
                    <li key={index}>{app}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
} 