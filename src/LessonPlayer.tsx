import React, { useState, useRef } from 'react';
import { videoSegments } from './molecular_biology_video_segments';
import type { VideoSegment } from './molecular_biology_video_segments';
import { QuestionOverlay } from './QuestionOverlay';

export const LessonPlayer: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [segment: string]: 'A' | 'B' }>({});
  const [showOverlay, setShowOverlay] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentSegment: VideoSegment = videoSegments[currentIndex];

  // Show overlay for q*_setup segments
  React.useEffect(() => {
    if (currentSegment.segment.endsWith('setup')) {
      setShowOverlay(true);
      // Pause video if playing
      if (videoRef.current) videoRef.current.pause();
    } else {
      setShowOverlay(false);
    }
  }, [currentIndex]);

  const handleAnswer = (answer: 'A' | 'B') => {
    setAnswers(prev => ({ ...prev, [currentSegment.segment]: answer }));
    setShowOverlay(false);
    // Resume video if needed
    if (videoRef.current) videoRef.current.play();
  };

  const handleVideoEnd = () => {
    if (currentIndex < videoSegments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setLessonComplete(true);
    }
  };

  // Auto-advance after overlay for q*_setup
  React.useEffect(() => {
    if (!showOverlay && currentSegment.segment.endsWith('setup')) {
      // Wait a moment, then advance
      const timeout = setTimeout(() => {
        if (videoRef.current) videoRef.current.pause();
        setCurrentIndex(idx => idx + 1);
      }, 500); // Short delay for UX
      return () => clearTimeout(timeout);
    }
  }, [showOverlay, currentSegment.segment]);

  if (lessonComplete) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <h2>Lesson Complete!</h2>
        <h3>Your Answers:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.entries(answers).map(([segment, answer]) => (
            <li key={segment}>{segment}: <b>{answer}</b></li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: 800, margin: '40px auto', background: '#222', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
      <video
        ref={videoRef}
        src={currentSegment.filename}
        width={800}
        height={450}
        controls
        autoPlay={!showOverlay}
        onEnded={handleVideoEnd}
        style={{ borderRadius: 12, background: '#000' }}
      />
      {showOverlay && currentSegment.question_text && currentSegment.option_a && currentSegment.option_b && (
        <QuestionOverlay
          question={currentSegment.question_text}
          optionA={currentSegment.option_a}
          optionB={currentSegment.option_b}
          onAnswer={handleAnswer}
        />
      )}
      <div style={{ position: 'absolute', top: 16, left: 16, color: '#fff', fontSize: 18 }}>
        Segment: {currentSegment.segment.replace(/_/g, ' ')} ({currentIndex + 1}/{videoSegments.length})
      </div>
    </div>
  );
}; 