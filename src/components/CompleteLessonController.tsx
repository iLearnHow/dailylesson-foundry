import React, { useState, useEffect } from 'react';
import KenAvatarIntegration from './KenAvatarIntegration';

interface LessonData {
  day_of_year: number;
  lesson_title: string;
  lesson_subtitle: string;
  scripts: any[];
  questions: any[];
}

const CompleteLessonController: React.FC<{
  lessonDay: number;
  studentAge: number;
}> = ({ lessonDay, studentAge }) => {
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showFortune, setShowFortune] = useState(false);
  const [showUniversalFormats, setShowUniversalFormats] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('ken_avatar');

  // Load lesson from your database
  useEffect(() => {
    loadLessonData(lessonDay, studentAge);
  }, [lessonDay, studentAge]);

  const loadLessonData = async (day: number, age: number) => {
    try {
      // Connect to your lesson database
      const response = await fetch('https://api.ilearn.how/v1/lessons/by-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_of_year: day,
          age_adaptation: age
        })
      });
      
      const lesson = await response.json();
      setLessonData(lesson);
      
    } catch (error) {
      console.error('Failed to load lesson:', error);
      
      // Use your facial expressions lesson as fallback
      const fallbackLesson: LessonData = {
        day_of_year: 15,
        lesson_title: 'Facial Expressions - How Faces Move and Express Visual Meaning',
        lesson_subtitle: 'Understanding Human Communication Through Interactive Learning',
        scripts: [
          {
            id: 'script_1',
            artifact_type: 'script',
            artifact_name: 'Kenny Script 1: Introduction + Question',
            content_text: "Hey there! My name's Ken, but you can call me Kenny! I'm your host for The Daily Lesson, but today we're doing something different - we're going to learn how faces move and express visual meaning! But don't worry it's the same format as always, if you respond to all three questions, I'll unlock your daily fortune. So let's begin..... over the next 4-6 minutes, your job is to watch my expressions change so that we can learn the science behind what makes faces so expressive. Let's start with the eyebrows - eyebrows are incredibly expressive and one of the first things people notice. So here's your first question. True or false: When I raise my eyebrows, does it ALWAYS mean I'm surprised?",
            character_voice: 'kenny',
            tone: 'enthusiastic_welcoming',
            type: 'intro_question',
            facial_actions: ['raise_eyebrows', 'smile', 'eye_contact'],
            gestures: ['welcome', 'demonstrate']
          }
          // Add more scripts from your SQL...
        ],
        questions: [
          {
            id: 'q1',
            question_text: 'When I raise my eyebrows, does it ALWAYS mean I\'m surprised?',
            options: [
              { id: 'green', text: 'TRUE - Raised eyebrows always mean surprise', color: 'green', is_correct: false },
              { id: 'red', text: 'FALSE - Eyebrows can express multiple meanings', color: 'red', is_correct: true }
            ],
            correct_response_script: 'script_3',
            incorrect_response_script: 'script_2'
          }
          // Add more questions...
        ]
      };
      
      setLessonData(fallbackLesson);
    }
  };

  const handleAnswerSelection = (option: any) => {
    if (!lessonData || !currentQuestion) return;

    // Find appropriate response script
    const scriptId = option.is_correct ? 
      currentQuestion.correct_response_script : 
      currentQuestion.incorrect_response_script;
    
    const responseScript = lessonData.scripts.find(s => s.id === scriptId);
    
    if (responseScript) {
      setCurrentScriptIndex(lessonData.scripts.indexOf(responseScript));
      
      // Progress after Ken's response
      setTimeout(() => {
        const newQuestionsAnswered = questionsAnswered + 1;
        setQuestionsAnswered(newQuestionsAnswered);
        
        if (newQuestionsAnswered >= 3) {
          setShowFortune(true);
          const fortuneScript = lessonData.scripts.find(s => s.type === 'fortune');
          if (fortuneScript) {
            setCurrentScriptIndex(lessonData.scripts.indexOf(fortuneScript));
          }
        } else {
          setCurrentQuestion(lessonData.questions[newQuestionsAnswered]);
        }
      }, 5000); // Give time for Ken's response video
    }
  };

  const handleFormatChange = (format: string) => {
    setSelectedFormat(format);
  };

  const renderFormatSelector = () => (
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: '16px',
      padding: '24px',
      margin: '20px 0',
      textAlign: 'center'
    }}>
      <h3 style={{ marginBottom: '20px' }}>🌍 Choose Your Learning Experience</h3>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { id: 'ken_avatar', name: 'Ken Avatar', icon: '🧙‍♂️', desc: 'Full Ken animation with SadTalker' },
          { id: 'web', name: 'Text Only', icon: '📖', desc: 'Read at your own pace' },
          { id: 'audio', name: 'Audio Only', icon: '🎧', desc: 'Listen while multitasking' },
          { id: 'video', name: 'Basic Video', icon: '🎥', desc: 'Simple video content' }
        ].map((format) => (
          <button
            key={format.id}
            style={{
              background: selectedFormat === format.id 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'white',
              color: selectedFormat === format.id ? 'white' : '#333',
              border: `2px solid ${selectedFormat === format.id ? '#667eea' : '#e2e8f0'}`,
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '140px'
            }}
            onClick={() => handleFormatChange(format.id)}
          >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{format.icon}</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{format.name}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{format.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  if (!lessonData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔄</div>
        <div>Loading lesson data...</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        background: 'rgba(255,255,255,0.1)',
        padding: '30px',
        borderRadius: '20px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
          {lessonData.lesson_title}
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
          {lessonData.lesson_subtitle}
        </p>
        <div style={{ fontSize: '1rem', marginTop: '15px', opacity: 0.8 }}>
          Day {lessonData.day_of_year} • Age {studentAge} • Progress: {questionsAnswered}/3
        </div>
      </div>

      {/* Format Toggle */}
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button 
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '50px',
            fontSize: '1.1rem',
            cursor: 'pointer'
          }}
          onClick={() => setShowUniversalFormats(!showUniversalFormats)}
        >
          {showUniversalFormats ? '🎭 Hide' : '🌍 Show'} Format Options
        </button>
      </div>

      {/* Universal Format Selector */}
      {showUniversalFormats && renderFormatSelector()}

      {/* Main Content Area */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        {selectedFormat === 'ken_avatar' ? (
          <KenAvatarIntegration
            currentScript={lessonData.scripts[currentScriptIndex]}
            studentAge={studentAge}
            onVideoComplete={() => {
              // Ken finished speaking
            }}
          />
        ) : (
          <div style={{
            width: '600px',
            height: '400px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '20px',
            padding: '40px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            {selectedFormat === 'web' && (
              <div>
                <h3>📖 Text Version</h3>
                <p>{lessonData.scripts[currentScriptIndex]?.content_text}</p>
              </div>
            )}
            {selectedFormat === 'audio' && (
              <div>
                <h3>🎧 Audio Version</h3>
                <div>Playing audio narration...</div>
              </div>
            )}
            {selectedFormat === 'video' && (
              <div>
                <h3>🎥 Video Version</h3>
                <div>Simple video content here</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Question */}
      {currentQuestion && !showFortune && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          color: '#333',
          padding: '30px',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>
            {currentQuestion.question_text}
          </h3>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {currentQuestion.options.map((option: any) => (
              <button
                key={option.id}
                style={{
                  background: getButtonColor(option.color),
                  color: 'white',
                  border: 'none',
                  padding: '20px 30px',
                  borderRadius: '15px',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  minWidth: '200px'
                }}
                onClick={() => handleAnswerSelection(option)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fortune */}
      {showFortune && (
        <div style={{
          background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
          color: 'white',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <h2>🎯 Your Daily Fortune</h2>
          <p>Congratulations! You've completed today's lesson with Ken.</p>
        </div>
      )}
    </div>
  );
};

const getButtonColor = (color: string) => {
  const colors: {[key: string]: string} = {
    green: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
    red: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
    blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    orange: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    purple: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    yellow: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  };
  return colors[color] || colors.blue;
};

export default CompleteLessonController; 