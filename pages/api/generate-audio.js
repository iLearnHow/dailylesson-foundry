export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, tone, language, lessonId } = req.body;

    if (!text || !tone || !language || !lessonId) {
      return res.status(400).json({ 
        error: 'Missing required fields: text, tone, language, lessonId' 
      });
    }

    // Voice selection based on tone and language
    const voiceId = selectVoiceForToneAndLanguage(tone, language);
    
    // ElevenLabs API call
    const audioResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.60,
          use_speaker_boost: true
        }
      })
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Convert to base64 for immediate playback
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    // For production, you'd want to upload to R2/Cloudflare and return a CDN URL
    // const r2Url = await uploadToR2(audioBuffer, `audio/${lessonId}_${tone}_${language}.mp3`);

    return res.status(200).json({
      success: true,
      audioUrl: audioUrl,
      voiceId: voiceId,
      duration: estimateDuration(text),
      lessonId: lessonId,
      tone: tone,
      language: language
    });

  } catch (error) {
    console.error('Audio generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate audio',
      details: error.message 
    });
  }
}

function selectVoiceForToneAndLanguage(tone, language) {
  // Voice mapping based on tone and language
  const voiceMap = {
    english: {
      fun: '2EiwWnXFnvU5JabPnv8n',           // Josh - energetic
      grandmother: 'bd9428b49722494bb4def9b1a8292c9a', // Noble Nathan - warm
      neutral: '21m00Tcm4TlvDq8ikWAM'       // Professional voice
    },
    spanish: {
      fun: 'spanish_energetic_voice_id',     // Placeholder
      grandmother: 'spanish_warm_voice_id',  // Placeholder
      neutral: 'spanish_professional_voice_id' // Placeholder
    },
    french: {
      fun: 'french_energetic_voice_id',      // Placeholder
      grandmother: 'french_warm_voice_id',   // Placeholder
      neutral: 'french_professional_voice_id' // Placeholder
    },
    german: {
      fun: 'german_energetic_voice_id',      // Placeholder
      grandmother: 'german_warm_voice_id',   // Placeholder
      neutral: 'german_professional_voice_id' // Placeholder
    },
    chinese: {
      fun: 'chinese_energetic_voice_id',     // Placeholder
      grandmother: 'chinese_warm_voice_id',  // Placeholder
      neutral: 'chinese_professional_voice_id' // Placeholder
    }
  };
  
  // Fallback to English voices if language not supported
  const languageVoices = voiceMap[language] || voiceMap.english;
  return languageVoices[tone] || languageVoices.neutral;
}

function estimateDuration(text) {
  // Rough estimate: 150 words per minute
  const words = text.split(' ').length;
  const minutes = words / 150;
  return Math.round(minutes * 60); // Return seconds
} 