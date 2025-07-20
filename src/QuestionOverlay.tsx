import React from 'react';

interface QuestionOverlayProps {
  question: string;
  optionA: string;
  optionB: string;
  onAnswer: (answer: 'A' | 'B') => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  color: '#fff',
  fontFamily: 'inherit',
};

const buttonStyle: React.CSSProperties = {
  margin: '1rem',
  padding: '1rem 2rem',
  fontSize: '1.2rem',
  borderRadius: '8px',
  border: 'none',
  background: '#4f8cff',
  color: '#fff',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  transition: 'background 0.2s',
};

export const QuestionOverlay: React.FC<QuestionOverlayProps> = ({ question, optionA, optionB, onAnswer }) => (
  <div style={overlayStyle}>
    <h2 style={{ marginBottom: '2rem', fontSize: '2rem', textAlign: 'center' }}>{question}</h2>
    <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem' }}>
      <button style={buttonStyle} onClick={() => onAnswer('A')}>{optionA}</button>
      <button style={buttonStyle} onClick={() => onAnswer('B')}>{optionB}</button>
    </div>
  </div>
); 