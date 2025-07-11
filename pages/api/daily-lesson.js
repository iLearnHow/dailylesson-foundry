import { loadDailyLessonDNA } from '../../api/index';
import { UniversalAgeEngine } from '../../services/universal-age-engine';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { day, age, tone, language, avatar, mode } = req.query;
    
    // Validate parameters
    const dayOfYear = parseInt(day) || getDayOfYear(new Date());
    const userAge = parseInt(age) || 25;
    const userTone = tone || 'neutral';
    const userLanguage = language || 'english';
    const userAvatar = avatar || 'kelly';
    const playerMode = mode || 'video';
    
    // Load lesson DNA
    const lessonDNA = await loadDailyLessonDNA(dayOfYear);
    
    // Adapt lesson for user preferences
    const ageEngine = new UniversalAgeEngine();
    const adaptedContent = await ageEngine.adaptLesson(lessonDNA, userAge);
    
    // Generate lesson structure based on mode
    const lesson = await generateLessonForMode(adaptedContent, {
      age: userAge,
      tone: userTone,
      language: userLanguage,
      avatar: userAvatar,
      mode: playerMode
    });
    
    res.status(200).json(lesson);
  } catch (error) {
    console.error('Daily lesson API error:', error);
    res.status(500).json({ 
      error: 'Failed to load lesson',
      details: error.message 
    });
  }
}

async function generateLessonForMode(lessonDNA, options) {
  const { age, tone, language, avatar, mode } = options;
  
  // Base lesson structure
  const lesson = {
    lesson_id: lessonDNA.lesson_id,
    lesson_metadata: {
      title: lessonDNA.universal_concept?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Daily Learning',
      day: lessonDNA.day,
      date: new Date().toISOString().split('T')[0],
      duration: '5-8 minutes',
      complexity: getComplexityForAge(age),
      topic: lessonDNA.universal_concept,
      principle: lessonDNA.core_principle,
      essence: lessonDNA.learning_essence
    },
    scripts: [],
    audio_url: null,
    video_url: null,
    avatar_url: null,
    text_content: null,
    generated_at: new Date().toISOString()
  };
  
  // Generate content based on mode
  switch (mode) {
    case 'text':
      lesson.text_content = await generateTextContent(lessonDNA, options);
      break;
      
    case 'audio':
      lesson.audio_url = await generateAudioContent(lessonDNA, options);
      lesson.scripts = await generateAudioScripts(lessonDNA, options);
      break;
      
    case 'video':
      lesson.video_url = await generateVideoContent(lessonDNA, options);
      lesson.scripts = await generateVideoScripts(lessonDNA, options);
      break;
      
    case 'avatar':
      lesson.avatar_url = await generateAvatarContent(lessonDNA, options);
      lesson.scripts = await generateAvatarScripts(lessonDNA, options);
      break;
      
    default:
      // Generate all content for universal player
      lesson.text_content = await generateTextContent(lessonDNA, options);
      lesson.audio_url = await generateAudioContent(lessonDNA, options);
      lesson.video_url = await generateVideoContent(lessonDNA, options);
      lesson.avatar_url = await generateAvatarContent(lessonDNA, options);
      lesson.scripts = await generateUniversalScripts(lessonDNA, options);
  }
  
  return lesson;
}

async function generateTextContent(lessonDNA, options) {
  const { age, tone, language } = options;
  
  // Generate age-appropriate text content
  const content = {
    title: lessonDNA.universal_concept?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    introduction: lessonDNA.learning_essence,
    mainContent: [
      `Today we're exploring ${lessonDNA.universal_concept?.replace(/_/g, ' ')}.`,
      `This lesson will help you understand ${lessonDNA.core_principle?.replace(/_/g, ' ')}.`,
      `Let's dive into this fascinating topic together.`
    ],
    questions: [
      {
        question: `True or false: ${lessonDNA.universal_concept?.replace(/_/g, ' ')} is important for learning?`,
        answer: true,
        explanation: `Understanding ${lessonDNA.universal_concept?.replace(/_/g, ' ')} helps us grow and learn.`
      },
      {
        question: `Which of these best describes ${lessonDNA.core_principle?.replace(/_/g, ' ')}?`,
        options: ['Option A', 'Option B', 'Option C'],
        correct: 0,
        explanation: 'This is the most accurate description.'
      },
      {
        question: `How can you apply ${lessonDNA.learning_essence?.replace(/_/g, ' ')} in your daily life?`,
        type: 'open',
        suggestions: ['Think about it', 'Discuss with others', 'Practice regularly']
      }
    ],
    summary: `Today you learned about ${lessonDNA.universal_concept?.replace(/_/g, ' ')} and how it relates to ${lessonDNA.core_principle?.replace(/_/g, ' ')}.`,
    vocabulary: ['concept', 'principle', 'learning', 'growth'],
    complexity: getComplexityForAge(age)
  };
  
  return content;
}

async function generateAudioContent(lessonDNA, options) {
  const { tone, language, avatar } = options;
  
  try {
    // Generate audio using ElevenLabs
    const audioText = generateAudioScript(lessonDNA, options);
    const audioUrl = await generateElevenLabsAudio(audioText, tone, language, avatar);
    
    return audioUrl;
  } catch (error) {
    console.error('Audio generation failed:', error);
    // Return a placeholder or fallback
    return null;
  }
}

async function generateVideoContent(lessonDNA, options) {
  const { tone, language, avatar } = options;
  
  try {
    // Generate video using HeyGen
    const videoScript = generateVideoScript(lessonDNA, options);
    const videoUrl = await generateHeyGenVideo(videoScript, tone, language, avatar);
    
    return videoUrl;
  } catch (error) {
    console.error('Video generation failed:', error);
    // Return a placeholder or fallback
    return null;
  }
}

async function generateAvatarContent(lessonDNA, options) {
  const { tone, language, avatar } = options;
  
  try {
    // Generate real-time avatar session
    const avatarScript = generateAvatarScript(lessonDNA, options);
    const avatarUrl = await generateRealtimeAvatar(avatarScript, tone, language, avatar);
    
    return avatarUrl;
  } catch (error) {
    console.error('Avatar generation failed:', error);
    // Return a placeholder or fallback
    return null;
  }
}

async function generateAudioScripts(lessonDNA, options) {
  const { age, tone, language } = options;
  
  return [
    {
      type: 'introduction',
      script_number: 1,
      voice_text: `Welcome to today's lesson! We're going to explore ${lessonDNA.universal_concept?.replace(/_/g, ' ')}.`,
      on_screen_text: `Welcome to today's lesson!`,
      timing_notes: '0-5 seconds',
      emotion: 'excited'
    },
    {
      type: 'question_1',
      script_number: 2,
      voice_text: `Here's your first question: True or false, ${lessonDNA.universal_concept?.replace(/_/g, ' ')} is important for learning?`,
      on_screen_text: `TRUE or FALSE: ${lessonDNA.universal_concept?.replace(/_/g, ' ')} is important for learning?`,
      timing_notes: '5-15 seconds',
      emotion: 'curious'
    },
    {
      type: 'feedback_1',
      script_number: 3,
      voice_text: `Great thinking! Understanding ${lessonDNA.universal_concept?.replace(/_/g, ' ')} helps us grow and learn.`,
      on_screen_text: `Understanding ${lessonDNA.universal_concept?.replace(/_/g, ' ')} helps us grow and learn.`,
      timing_notes: '15-25 seconds',
      emotion: 'encouraging'
    },
    {
      type: 'question_2',
      script_number: 4,
      voice_text: `Now, which of these best describes ${lessonDNA.core_principle?.replace(/_/g, ' ')}?`,
      on_screen_text: `Which best describes ${lessonDNA.core_principle?.replace(/_/g, ' ')}?`,
      timing_notes: '25-35 seconds',
      emotion: 'thoughtful'
    },
    {
      type: 'feedback_2',
      script_number: 5,
      voice_text: `Excellent! This is the most accurate description.`,
      on_screen_text: `Excellent! This is the most accurate description.`,
      timing_notes: '35-45 seconds',
      emotion: 'proud'
    },
    {
      type: 'question_3',
      script_number: 6,
      voice_text: `Finally, how can you apply ${lessonDNA.learning_essence?.replace(/_/g, ' ')} in your daily life?`,
      on_screen_text: `How can you apply this in your daily life?`,
      timing_notes: '45-55 seconds',
      emotion: 'inspiring'
    },
    {
      type: 'fortune',
      script_number: 7,
      voice_text: `Today, you've earned your daily fortune! You are a learner who understands ${lessonDNA.universal_concept?.replace(/_/g, ' ')}.`,
      on_screen_text: `Your Daily Fortune: You are a learner who understands ${lessonDNA.universal_concept?.replace(/_/g, ' ')}.`,
      timing_notes: '55-65 seconds',
      emotion: 'celebratory'
    }
  ];
}

async function generateVideoScripts(lessonDNA, options) {
  // Similar to audio scripts but with visual cues
  const audioScripts = await generateAudioScripts(lessonDNA, options);
  
  return audioScripts.map(script => ({
    ...script,
    visual_cues: generateVisualCues(script.type, script.emotion),
    background: 'educational_environment',
    avatar_expressions: generateAvatarExpressions(script.emotion)
  }));
}

async function generateAvatarScripts(lessonDNA, options) {
  // Real-time avatar interaction scripts
  const audioScripts = await generateAudioScripts(lessonDNA, options);
  
  return audioScripts.map(script => ({
    ...script,
    interaction_points: generateInteractionPoints(script.type),
    wait_for_input: script.type.includes('question'),
    response_handling: generateResponseHandling(script.type)
  }));
}

async function generateUniversalScripts(lessonDNA, options) {
  // Combined scripts for universal player
  const audioScripts = await generateAudioScripts(lessonDNA, options);
  
  return audioScripts.map(script => ({
    ...script,
    text_version: generateTextVersion(script),
    audio_version: generateAudioVersion(script),
    video_version: generateVideoVersion(script),
    avatar_version: generateAvatarVersion(script)
  }));
}

// Helper functions
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getComplexityForAge(age) {
  if (age <= 12) return 'Foundation';
  if (age <= 25) return 'Application';
  if (age <= 50) return 'Advanced';
  return 'Wisdom';
}

function generateAudioScript(lessonDNA, options) {
  const { tone, language } = options;
  
  return `
    Welcome to today's lesson! We're going to explore ${lessonDNA.universal_concept?.replace(/_/g, ' ')}.
    
    This lesson will help you understand ${lessonDNA.core_principle?.replace(/_/g, ' ')}.
    
    Let's start with a question: True or false, ${lessonDNA.universal_concept?.replace(/_/g, ' ')} is important for learning?
    
    Great thinking! Understanding ${lessonDNA.universal_concept?.replace(/_/g, ' ')} helps us grow and learn.
    
    Now, which of these best describes ${lessonDNA.core_principle?.replace(/_/g, ' ')}?
    
    Excellent! This is the most accurate description.
    
    Finally, how can you apply ${lessonDNA.learning_essence?.replace(/_/g, ' ')} in your daily life?
    
    Today, you've earned your daily fortune! You are a learner who understands ${lessonDNA.universal_concept?.replace(/_/g, ' ')}.
  `.trim();
}

function generateVideoScript(lessonDNA, options) {
  // Similar to audio script but with visual direction
  return generateAudioScript(lessonDNA, options);
}

function generateAvatarScript(lessonDNA, options) {
  // Real-time interaction script
  return generateAudioScript(lessonDNA, options);
}

function generateVisualCues(type, emotion) {
  const cues = {
    introduction: { background: 'warm', lighting: 'bright', camera: 'medium' },
    question_1: { background: 'focused', lighting: 'dramatic', camera: 'close' },
    feedback_1: { background: 'positive', lighting: 'warm', camera: 'medium' },
    question_2: { background: 'thoughtful', lighting: 'balanced', camera: 'medium' },
    feedback_2: { background: 'celebratory', lighting: 'bright', camera: 'close' },
    question_3: { background: 'inspiring', lighting: 'golden', camera: 'wide' },
    fortune: { background: 'magical', lighting: 'ethereal', camera: 'dramatic' }
  };
  
  return cues[type] || cues.introduction;
}

function generateAvatarExpressions(emotion) {
  const expressions = {
    excited: { smile: 80, eyes: 'bright', eyebrows: 'raised', head_tilt: 5 },
    curious: { smile: 40, eyes: 'focused', eyebrows: 'curious', head_tilt: 10 },
    encouraging: { smile: 70, eyes: 'warm', eyebrows: 'gentle', head_tilt: 0 },
    thoughtful: { smile: 30, eyes: 'contemplative', eyebrows: 'furrowed', head_tilt: -5 },
    proud: { smile: 90, eyes: 'proud', eyebrows: 'raised', head_tilt: 5 },
    inspiring: { smile: 60, eyes: 'determined', eyebrows: 'strong', head_tilt: 0 },
    celebratory: { smile: 100, eyes: 'joyful', eyebrows: 'high', head_tilt: 10 }
  };
  
  return expressions[emotion] || expressions.excited;
}

function generateInteractionPoints(type) {
  if (type.includes('question')) {
    return {
      wait_for_response: true,
      response_timeout: 10000,
      allow_multiple_choices: type === 'question_2'
    };
  }
  return { wait_for_response: false };
}

function generateResponseHandling(type) {
  if (type.includes('feedback')) {
    return {
      positive_reinforcement: true,
      gentle_correction: true,
      encourage_retry: false
    };
  }
  return {};
}

function generateTextVersion(script) {
  return {
    display_text: script.on_screen_text,
    reading_time: script.voice_text.length / 200, // Rough estimate
    emphasis_words: extractEmphasisWords(script.voice_text)
  };
}

function generateAudioVersion(script) {
  return {
    audio_duration: script.voice_text.length / 150, // Rough estimate
    voice_settings: getVoiceSettings(script.emotion),
    pause_markers: extractPauseMarkers(script.voice_text)
  };
}

function generateVideoVersion(script) {
  return {
    ...generateAudioVersion(script),
    visual_cues: generateVisualCues(script.type, script.emotion),
    avatar_expressions: generateAvatarExpressions(script.emotion)
  };
}

function generateAvatarVersion(script) {
  return {
    ...generateVideoVersion(script),
    interaction_points: generateInteractionPoints(script.type),
    response_handling: generateResponseHandling(script.type)
  };
}

function extractEmphasisWords(text) {
  // Simple emphasis extraction - in production, use NLP
  const words = text.split(' ');
  return words.filter(word => word.length > 6 || word.match(/[A-Z]/));
}

function extractPauseMarkers(text) {
  // Simple pause extraction - in production, use NLP
  const sentences = text.split(/[.!?]/);
  return sentences.map(sentence => sentence.length / 200); // Rough timing
}

function getVoiceSettings(emotion) {
  const settings = {
    excited: { stability: 0.7, similarity_boost: 0.8, style: 0.8 },
    curious: { stability: 0.6, similarity_boost: 0.7, style: 0.6 },
    encouraging: { stability: 0.8, similarity_boost: 0.9, style: 0.7 },
    thoughtful: { stability: 0.9, similarity_boost: 0.8, style: 0.5 },
    proud: { stability: 0.8, similarity_boost: 0.9, style: 0.8 },
    inspiring: { stability: 0.7, similarity_boost: 0.8, style: 0.9 },
    celebratory: { stability: 0.6, similarity_boost: 0.7, style: 1.0 }
  };
  
  return settings[emotion] || settings.excited;
}

// ElevenLabs integration
async function generateElevenLabsAudio(text, tone, language, avatar) {
  try {
    const voiceId = getVoiceId(avatar, tone, language);
    
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: getVoiceSettings(tone)
      })
    });
    
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }
    
    const audioBuffer = await response.arrayBuffer();
    const audioUrl = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;
    
    return audioUrl;
  } catch (error) {
    console.error('ElevenLabs audio generation failed:', error);
    return null;
  }
}

// HeyGen integration
async function generateHeyGenVideo(script, tone, language, avatar) {
  try {
    const avatarId = getAvatarId(avatar, tone);
    const voiceId = getVoiceId(avatar, tone, language);
    
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: avatarId
          },
          voice: {
            type: 'text',
            input_text: script,
            voice_id: voiceId
          },
          background: {
            type: 'color',
            value: '#f0f8ff'
          }
        }],
        aspect_ratio: '16:9',
        dimension: { width: 1920, height: 1080 }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HeyGen API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Poll for completion
    const videoUrl = await pollHeyGenCompletion(result.video_id);
    
    return videoUrl;
  } catch (error) {
    console.error('HeyGen video generation failed:', error);
    return null;
  }
}

// Real-time avatar integration
async function generateRealtimeAvatar(script, tone, language, avatar) {
  try {
    // This would integrate with Descript's real-time API
    // For now, return a placeholder
    return {
      session_id: `avatar_${Date.now()}`,
      stream_url: null,
      status: 'ready'
    };
  } catch (error) {
    console.error('Real-time avatar generation failed:', error);
    return null;
  }
}

// Helper functions for API integrations
function getVoiceId(avatar, tone, language) {
  // Use existing voice mapping from your config
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
    // Ken's avatar IDs based on tone
    const kenAvatars = {
      'grandmother': '668261a318774f519b03a04c75cc10b1',
      'fun': 'de8ca36e5ef54eeeb00a464ff5d90248',
      'neutral': '3b21add7fc3a4bfc81c59281340c4c16'
    };
    return kenAvatars[tone] || kenAvatars['neutral'];
  }
}

async function pollHeyGenCompletion(videoId) {
  // Poll HeyGen for video completion
  // This is a simplified version - implement proper polling in production
  return `https://heygen-video-url.com/${videoId}.mp4`;
} 