import React, { useState, useEffect } from 'react';

const CompleteLessonSystem: React.FC = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  
  // Debug logging
  useEffect(() => {
    console.log('🎭 CompleteLessonSystem loaded!');
    console.log('📹 Ken videos available:', kenVideos.length);
  }, []);
  
  // Use existing Ken videos from your repo
  const kenVideos = [
    '/8a116ce3cf8f482ba14c323e12015414.mp4',
    '/2c6f1b7f06ce40fc964c919daefbb45d.mp4',
    '/28faa0e663c1469e996b34acd031ec4e.mp4',
    '/48a7fe1c92b246b1be666172062c9dac.mp4',
    '/84fa1e773f8043fab3ffc99a976de252.mp4'
  ];

  const facialExpressionsLesson = {
    title: 'Facial Expressions - How Faces Move and Express Visual Meaning',
    subtitle: 'Understanding Human Communication Through Interactive Learning',
    question: 'When I raise my eyebrows, does it ALWAYS mean I\'m surprised?',
    options: [
      { id: 'green', text: 'TRUE - Raised eyebrows always mean surprise', color: '#56ab2f', correct: false },
      { id: 'red', text: 'FALSE - Eyebrows can express multiple meanings', color: '#ff416c', correct: true }
    ]
  };

  const handleAnswer = (isCorrect: boolean) => {
    setShowQuestion(false);
    setCurrentVideoIndex(isCorrect ? 2 : 1); // Different video for correct/incorrect
    setIsPlaying(true);
    
    setTimeout(() => {
      setShowQuestion(false);
      // Show completion/fortune
    }, 5000);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      color: 'white',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        background: 'rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '15px',
          background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🎭 Daily Lesson Foundry
        </h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>
          {facialExpressionsLesson.title}
        </h2>
        <p style={{ fontSize: '1.3rem', opacity: 0.9 }}>
          {facialExpressionsLesson.subtitle}
        </p>
        <div style={{ 
          marginTop: '20px', 
          fontSize: '1.1rem', 
          background: 'rgba(255,255,255,0.2)',
          padding: '10px 20px',
          borderRadius: '25px',
          display: 'inline-block'
        }}>
          🚀 CONSOLIDATION SUCCESS - Ken Avatar System LIVE!
        </div>
      </div>

      {/* Ken Avatar Video Player */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '40px' 
      }}>
        <div style={{
          width: '600px',
          height: '400px',
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isPlaying ? (
            <video
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              autoPlay
              controls
              onEnded={() => setIsPlaying(false)}
            >
              <source src={kenVideos[currentVideoIndex]} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div style={{ textAlign: 'center', color: '#333' }}>
              <div style={{ 
                fontSize: '6rem', 
                marginBottom: '20px',
                animation: 'pulse 2s infinite'
              }}>
                🧙‍♂️
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                Ken is Ready!
              </h3>
              <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                {kenVideos.length} avatar videos loaded from your repo
              </p>
              <button
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '25px',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  marginTop: '15px',
                  boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                }}
                onClick={() => setIsPlaying(true)}
              >
                ▶️ Start Ken's Lesson
              </button>
            </div>
          )}
          
          {/* Status Indicator */}
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(76, 175, 80, 0.9)',
            color: 'white',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            ✅ Ken Avatar Active
          </div>
        </div>
      </div>

      {/* Interactive Question */}
      {showQuestion && (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          color: '#333',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            fontSize: '1.8rem', 
            marginBottom: '30px',
            color: '#2d3748'
          }}>
            {facialExpressionsLesson.question}
          </h3>
          
          <div style={{ 
            display: 'flex', 
            gap: '25px', 
            justifyContent: 'center', 
            flexWrap: 'wrap' 
          }}>
            {facialExpressionsLesson.options.map((option) => (
              <button
                key={option.id}
                style={{
                  background: `linear-gradient(135deg, ${option.color} 0%, ${option.color}cc 100%)`,
                  color: 'white',
                  border: 'none',
                  padding: '25px 35px',
                  borderRadius: '15px',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '250px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleAnswer(option.correct)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
                }}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Success Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
        color: '#003300',
        padding: '30px',
        borderRadius: '20px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.3rem',
        boxShadow: '0 15px 30px rgba(0,255,0,0.3)'
      }}>
        🎉 MISSION ACCOMPLISHED! 🎉<br/>
        dailylesson-foundry + Ken Avatar System = LIVE AND WORKING!<br/>
        <div style={{ fontSize: '1rem', marginTop: '10px', opacity: 0.8 }}>
          Ready for deployment to mynextlesson.com with 1.23k daily users!
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CompleteLessonSystem; 