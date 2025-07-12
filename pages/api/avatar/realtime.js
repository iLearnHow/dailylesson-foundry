import { loadDailyLessonDNA } from '../../../api/index';
import { UniversalAgeEngine } from '../../../services/universal-age-engine';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, sessionId, lessonTopic, studentChoice, text, segmentType } = req.body;
    
    switch (action) {
      case 'start':
        return await startRealTimeLesson(req, res);
      case 'speak':
        return await generateRealTimeSpeech(req, res);
      case 'respond':
        return await handleStudentResponse(req, res);
      case 'next':
        return await advanceToNextSegment(req, res);
      case 'complete':
        return await completeLessonSession(req, res);
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Real-time avatar API error:', error);
    res.status(500).json({ 
      error: 'Avatar session failed',
      details: error.message 
    });
  }
}

// Session storage (in production, use Redis or database)
const activeSessions = new Map();

async function startRealTimeLesson(req, res) {
  const { lessonTopic, studentId, age, tone, language, avatar } = req.body;
  
  try {
    // Generate session ID
    const sessionId = generateSessionId();
    
    // Load lesson DNA
    const dayOfYear = getDayOfYear(new Date());
    const lessonDNA = await loadDailyLessonDNA(dayOfYear);
    
    // Adapt lesson for user
    const ageEngine = new UniversalAgeEngine();
    const adaptedContent = await ageEngine.adaptLesson(lessonDNA, age || 25);
    
    // Create session state
    const sessionState = {
      sessionId,
      lessonTopic: lessonTopic || lessonDNA.universal_concept,
      lessonDNA: adaptedContent,
      currentSegment: 0,
      studentResponses: [],
      startTime: Date.now(),
      isActive: true,
      userPreferences: {
        age: age || 25,
        tone: tone || 'neutral',
        language: language || 'english',
        avatar: avatar || 'kelly'
      }
    };
    
    activeSessions.set(sessionId, sessionState);
    
    // Generate opening segment
    const openingSegment = generateOpeningSegment(adaptedContent, sessionState.userPreferences);
    
    // Generate real-time avatar speech
    const audioStream = await generateRealTimeAvatarSpeech({
      text: openingSegment.voice_text,
      avatarId: getAvatarId(avatar || 'kelly', tone || 'neutral'),
      voiceId: getVoiceId(avatar || 'kelly', tone || 'neutral', language || 'english'),
      sessionId,
      segmentType: 'opening'
    });
    
    return res.status(200).json({
      success: true,
      sessionId,
      audioStreamUrl: audioStream.url,
      lessonStructure: {
        totalSegments: 7, // 3 questions + feedback + fortune
        estimatedDuration: '5-8 minutes',
        currentSegment: 0,
        nextAction: 'wait_for_response'
      },
      openingSegment
    });
  } catch (error) {
    console.error('Failed to start real-time lesson:', error);
    return res.status(500).json({ error: 'Failed to start lesson' });
  }
}

async function generateRealTimeSpeech(req, res) {
  const { text, sessionId, segmentType, toneMarkers, pauseMarkers } = req.body;
  
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Process text with Kelly's speaking style
    const processedText = applyKellyDeliveryStyle(text, segmentType, toneMarkers, pauseMarkers);
    
    // Generate real-time avatar speech
    const audioStream = await generateRealTimeAvatarSpeech({
      text: processedText,
      avatarId: getAvatarId(session.userPreferences.avatar, session.userPreferences.tone),
      voiceId: getVoiceId(session.userPreferences.avatar, session.userPreferences.tone, session.userPreferences.language),
      sessionId,
      segmentType
    });
    
    return res.status(200).json({
      success: true,
      audioStreamUrl: audioStream.url,
      duration: audioStream.estimatedDuration,
      nextAction: determineNextAction(segmentType)
    });
  } catch (error) {
    console.error('Failed to generate real-time speech:', error);
    return res.status(500).json({ error: 'Speech generation failed' });
  }
}

async function handleStudentResponse(req, res) {
  const { sessionId, questionId, choice, timestamp } = req.body;
  
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Record response
    session.studentResponses.push({
      questionId,
      choice,
      timestamp: timestamp || Date.now()
    });
    
    // Generate Kelly's immediate feedback
    const feedback = generateKellyFeedback(questionId, choice, session.lessonDNA);
    const feedbackAudio = await generateRealTimeAvatarSpeech({
      text: feedback.text,
      avatarId: getAvatarId(session.userPreferences.avatar, session.userPreferences.tone),
      voiceId: getVoiceId(session.userPreferences.avatar, session.userPreferences.tone, session.userPreferences.language),
      sessionId,
      segmentType: 'feedback'
    });
    
    return res.status(200).json({
      success: true,
      feedbackAudio: feedbackAudio.url,
      isCorrect: feedback.isCorrect,
      nextAction: feedback.isCorrect ? 'continue' : 'retry',
      sessionProgress: {
        currentSegment: session.currentSegment,
        totalSegments: 7,
        completedQuestions: session.studentResponses.length
      }
    });
  } catch (error) {
    console.error('Failed to handle student response:', error);
    return res.status(500).json({ error: 'Response handling failed' });
  }
}

async function advanceToNextSegment(req, res) {
  const { sessionId } = req.body;
  
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Advance to next segment
    session.currentSegment++;
    
    // Generate next segment
    const nextSegment = generateNextSegment(session.currentSegment, session.lessonDNA, session.userPreferences);
    
    if (nextSegment) {
      const nextAudio = await generateRealTimeAvatarSpeech({
        text: nextSegment.voice_text,
        avatarId: getAvatarId(session.userPreferences.avatar, session.userPreferences.tone),
        voiceId: getVoiceId(session.userPreferences.avatar, session.userPreferences.tone, session.userPreferences.language),
        sessionId,
        segmentType: nextSegment.type
      });
      
      return res.status(200).json({
        success: true,
        nextSegment,
        audioStreamUrl: nextAudio.url,
        sessionProgress: {
          currentSegment: session.currentSegment,
          totalSegments: 7,
          isComplete: session.currentSegment >= 6
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        sessionComplete: true,
        sessionProgress: {
          currentSegment: session.currentSegment,
          totalSegments: 7,
          isComplete: true
        }
      });
    }
  } catch (error) {
    console.error('Failed to advance segment:', error);
    return res.status(500).json({ error: 'Segment advancement failed' });
  }
}

async function completeLessonSession(req, res) {
  const { sessionId } = req.body;
  
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Mark session as complete
    session.isActive = false;
    session.endTime = Date.now();
    
    // Generate completion summary
    const summary = generateSessionSummary(session);
    
    // Clean up session (in production, save to database)
    activeSessions.delete(sessionId);
    
    return res.status(200).json({
      success: true,
      sessionComplete: true,
      summary,
      sessionDuration: session.endTime - session.startTime
    });
  } catch (error) {
    console.error('Failed to complete session:', error);
    return res.status(500).json({ error: 'Session completion failed' });
  }
}

// Helper functions
function generateSessionId() {
  return `avatar_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function generateOpeningSegment(lessonDNA, preferences) {
  const { tone, language } = preferences;
  
  return {
    type: 'opening',
    voice_text: `Welcome back! I'm so excited to explore ${lessonDNA.universal_concept?.replace(/_/g, ' ')} with you today. This lesson will help you understand ${lessonDNA.core_principle?.replace(/_/g, ' ')}. Let's dive in together.`,
    on_screen_text: `Welcome to today's lesson!`,
    emotion: 'excited',
    timing: '0-10 seconds',
    wait_for_input: false
  };
}

function generateNextSegment(segmentIndex, lessonDNA, preferences) {
  const { tone, language } = preferences;
  
  const segments = [
    {
      type: 'question_1',
      voice_text: `Here's your first question: True or false, ${lessonDNA.universal_concept?.replace(/_/g, ' ')} is important for learning?`,
      on_screen_text: `TRUE or FALSE: ${lessonDNA.universal_concept?.replace(/_/g, ' ')} is important for learning?`,
      emotion: 'curious',
      timing: '10-20 seconds',
      wait_for_input: true,
      choices: ['True', 'False']
    },
    {
      type: 'feedback_1',
      voice_text: `Great thinking! Understanding ${lessonDNA.universal_concept?.replace(/_/g, ' ')} helps us grow and learn.`,
      on_screen_text: `Understanding ${lessonDNA.universal_concept?.replace(/_/g, ' ')} helps us grow and learn.`,
      emotion: 'encouraging',
      timing: '20-30 seconds',
      wait_for_input: false
    },
    {
      type: 'question_2',
      voice_text: `Now, which of these best describes ${lessonDNA.core_principle?.replace(/_/g, ' ')}?`,
      on_screen_text: `Which best describes ${lessonDNA.core_principle?.replace(/_/g, ' ')}?`,
      emotion: 'thoughtful',
      timing: '30-40 seconds',
      wait_for_input: true,
      choices: ['Option A', 'Option B', 'Option C']
    },
    {
      type: 'feedback_2',
      voice_text: `Excellent! This is the most accurate description.`,
      on_screen_text: `Excellent! This is the most accurate description.`,
      emotion: 'proud',
      timing: '40-50 seconds',
      wait_for_input: false
    },
    {
      type: 'question_3',
      voice_text: `Finally, how can you apply ${lessonDNA.learning_essence?.replace(/_/g, ' ')} in your daily life?`,
      on_screen_text: `How can you apply this in your daily life?`,
      emotion: 'inspiring',
      timing: '50-60 seconds',
      wait_for_input: true,
      choices: ['Think about it', 'Discuss with others', 'Practice regularly']
    },
    {
      type: 'fortune',
      voice_text: `Today, you've earned your daily fortune! You are a learner who understands ${lessonDNA.universal_concept?.replace(/_/g, ' ')}.`,
      on_screen_text: `Your Daily Fortune: You are a learner who understands ${lessonDNA.universal_concept?.replace(/_/g, ' ')}.`,
      emotion: 'celebratory',
      timing: '60-70 seconds',
      wait_for_input: false
    }
  ];
  
  return segments[segmentIndex] || null;
}

function generateKellyFeedback(questionId, choice, lessonDNA) {
  const feedbackMap = {
    'question_1': {
      'True': {
        text: `Absolutely right! Understanding ${lessonDNA.universal_concept?.replace(/_/g, ' ')} is fundamental to learning.`,
        isCorrect: true
      },
      'False': {
        text: `Actually, understanding ${lessonDNA.universal_concept?.replace(/_/g, ' ')} is very important for learning. Let me explain why...`,
        isCorrect: false
      }
    },
    'question_2': {
      'Option A': {
        text: `Perfect! That's the most accurate description of ${lessonDNA.core_principle?.replace(/_/g, ' ')}.`,
        isCorrect: true
      },
      'Option B': {
        text: `Good thinking, but let me explain why Option A is more accurate...`,
        isCorrect: false
      },
      'Option C': {
        text: `Interesting choice! Let me explain why Option A is the best answer...`,
        isCorrect: false
      }
    },
    'question_3': {
      'Think about it': {
        text: `Wonderful! Reflection is a powerful way to apply what you've learned.`,
        isCorrect: true
      },
      'Discuss with others': {
        text: `Excellent! Sharing knowledge with others helps everyone learn.`,
        isCorrect: true
      },
      'Practice regularly': {
        text: `Perfect! Regular practice is the key to mastery.`,
        isCorrect: true
      }
    }
  };
  
  return feedbackMap[questionId]?.[choice] || {
    text: `Thank you for your response! Let's continue learning together.`,
    isCorrect: true
  };
}

function generateSessionSummary(session) {
  const totalQuestions = session.studentResponses.length;
  const correctAnswers = session.studentResponses.filter(r => r.isCorrect).length;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  
  return {
    lessonTopic: session.lessonTopic,
    totalQuestions,
    correctAnswers,
    accuracy: Math.round(accuracy),
    sessionDuration: session.endTime - session.startTime,
    userPreferences: session.userPreferences
  };
}

function applyKellyDeliveryStyle(text, segmentType, toneMarkers, pauseMarkers) {
  // Apply Kelly's speaking style with pause markers and tone indicators
  let processedText = text;
  
  // Add pause markers
  if (pauseMarkers) {
    pauseMarkers.forEach(marker => {
      processedText = processedText.replace(marker.text, `[PAUSE-${marker.duration}]`);
    });
  }
  
  // Add tone markers
  if (toneMarkers) {
    toneMarkers.forEach(marker => {
      processedText = processedText.replace(marker.text, `[TONE-${marker.emotion.toUpperCase()}]`);
    });
  }
  
  return processedText;
}

function determineNextAction(segmentType) {
  if (segmentType.includes('question')) {
    return 'wait_for_response';
  } else if (segmentType === 'fortune') {
    return 'complete';
  } else {
    return 'continue';
  }
}

async function generateRealTimeAvatarSpeech(params) {
  const { text, avatarId, voiceId, sessionId, segmentType } = params;
  
  try {
    // This would integrate with Descript's real-time API
    // For now, return a mock response
    
    // In production, this would:
    // 1. Call Descript's real-time API
    // 2. Stream audio back to client
    // 3. Handle lip-sync and expressions
    
    return {
      url: `https://descript-realtime-stream.com/${sessionId}/${segmentType}`,
      estimatedDuration: text.length / 150, // Rough estimate
      sessionId,
      segmentType
    };
  } catch (error) {
    console.error('Real-time avatar speech generation failed:', error);
    throw error;
  }
}

function getVoiceId(avatar, tone, language) {
  if (avatar === 'kelly') {
    return 'cJLh37pTYdhJT0Dvnttb'; // Kelly's voice ID
  } else {
    const kenVoices = {
      'grandmother': 'pNInz6obpgDQGcFmaJgB',
      'fun': 'EXAVITQu4vr4xnSDxMaL',
      'neutral': 'flq6f7yk4E4fJM5XTYuZ'
    };
    return kenVoices[tone] || kenVoices['neutral'];
  }
}

function getAvatarId(avatar, tone) {
  if (avatar === 'kelly') {
    return '80d67b1371b342ecaf4235e5f61491ae'; // Kelly's avatar ID
  } else {
    const kenAvatars = {
      'grandmother': '668261a318774f519b03a04c75cc10b1',
      'fun': 'de8ca36e5ef54eeeb00a464ff5d90248',
      'neutral': '3b21add7fc3a4bfc81c59281340c4c16'
    };
    return kenAvatars[tone] || kenAvatars['neutral'];
  }
} 