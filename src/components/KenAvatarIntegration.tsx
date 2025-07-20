import React, { useState, useEffect, useRef } from 'react';

interface SadTalkerResponse {
  video_url: string;
  audio_url: string;
  status: 'generating' | 'ready' | 'error';
  generation_time_ms: number;
}

interface LessonScript {
  id: string;
  type: 'intro_question' | 'correct_response' | 'incorrect_response' | 'fortune';
  content_text: string;
  character_voice: 'kenny';
  tone: string;
  facial_actions?: string[];
  gestures?: string[];
}

const KenAvatarIntegration: React.FC<{
  currentScript: LessonScript;
  studentAge: number;
  onVideoComplete: () => void;
}> = ({ currentScript, studentAge, onVideoComplete }) => {
  const [avatarVideo, setAvatarVideo] = useState<SadTalkerResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate Ken avatar video using existing SadTalker pipeline
  const generateKenVideo = async (script: LessonScript) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call your existing SadTalker pipeline
      const response = await fetch('https://api.ilearn.how/v1/ken/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script.content_text,
          voice: script.character_voice,
          tone: script.tone,
          age_adaptation: studentAge,
          source_image: '/kenny/ken.jpg', // Your existing Ken image
          facial_actions: script.facial_actions || [],
          gestures: script.gestures || [],
          include_micro_expressions: true
        })
      });

      if (!response.ok) {
        throw new Error(`SadTalker API failed: ${response.status}`);
      }

      const videoData: SadTalkerResponse = await response.json();
      setAvatarVideo(videoData);

      // Auto-play when ready
      if (videoData.status === 'ready' && videoRef.current) {
        videoRef.current.src = videoData.video_url;
        videoRef.current.play();
      }

    } catch (err) {
      console.error('Ken avatar generation failed:', err);
      setError('Failed to generate Ken avatar video');
      
      // Fallback to text-to-speech
      playFallbackAudio(script.content_text);
    } finally {
      setIsGenerating(false);
    }
  };

  const playFallbackAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.onend = onVideoComplete;
    speechSynthesis.speak(utterance);
  };

  // Generate video when script changes
  useEffect(() => {
    if (currentScript) {
      generateKenVideo(currentScript);
    }
  }, [currentScript]);

  return (
    <div style={{
      width: '600px',
      height: '400px',
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      borderRadius: '20px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    }}>
      {/* Ken Avatar Video */}
      {avatarVideo?.status === 'ready' && (
        <video
          ref={videoRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '20px'
          }}
          onEnded={onVideoComplete}
          controls={false}
          autoPlay
          muted={false}
        />
      )}

      {/* Loading State */}
      {isGenerating && (
        <div style={{
          textAlign: 'center',
          color: '#333'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>
            🎭
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            Ken is preparing your lesson...
          </div>
          <div style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.7 }}>
            Generating avatar video with SadTalker
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          textAlign: 'center',
          color: '#e53e3e',
          padding: '20px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
          <div>{error}</div>
          <div style={{ fontSize: '0.8rem', marginTop: '10px', opacity: 0.7 }}>
            Using text-to-speech fallback
          </div>
        </div>
      )}

      {/* Generation Status */}
      {avatarVideo && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: avatarVideo.status === 'ready' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 193, 7, 0.9)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '10px',
          fontSize: '0.8rem'
        }}>
          {avatarVideo.status === 'ready' ? '✅ Ready' : '🔄 Generating...'}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default KenAvatarIntegration; 