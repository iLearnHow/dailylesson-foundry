// services/video-generation/src/index.ts - Cloudflare Queue Consumer
import { UniversalLessonOrchestrator } from './orchestrator/UniversalLessonOrchestrator';
import { HeyGenService } from './services/HeyGenService';
import { ElevenLabsService } from './services/ElevenLabsService';
import { CloudflareR2Service } from './services/CloudflareR2Service';
import { DatabaseService } from './services/DatabaseService';

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  HEYGEN_API_KEY: string;
  ELEVENLABS_API_KEY: string;
  WEBHOOK_QUEUE: Queue;
}

export default {
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    const orchestrator = new UniversalLessonOrchestrator();
    const heygenService = new HeyGenService(env.HEYGEN_API_KEY);
    const elevenLabsService = new ElevenLabsService(env.ELEVENLABS_API_KEY);
    const r2Service = new CloudflareR2Service(env.R2);
    const database = new DatabaseService(env.DB);

    for (const message of batch.messages) {
      try {
        const { type, lesson_id, scripts, variation, queue_id } = message.body;

        if (type === 'video.generate') {
          await processVideoGeneration({
            lessonId: lesson_id,
            scripts,
            variation,
            queueId: queue_id,
            orchestrator,
            heygenService,
            elevenLabsService,
            r2Service,
            database
          });
        }

        message.ack();
      } catch (error) {
        console.error('Queue processing error:', error);
        message.retry();
      }
    }
  }
};

async function processVideoGeneration({
  lessonId,
  scripts,
  variation,
  queueId,
  orchestrator,
  heygenService,
  elevenLabsService,
  r2Service,
  database
}: any) {
  console.log(`Processing video generation: ${queueId}`);

  try {
    // Update queue status
    await database.updateVideoQueueStatus(queueId, 'processing');

    // Generate videos for each script segment
    const videoSegments = [];
    
    for (const [index, script] of scripts.entries()) {
      console.log(`Generating segment ${index + 1}/${scripts.length}: ${script.type}`);
      
      // Generate audio first (faster, used for timing)
      const audioResult = await elevenLabsService.generateAudio(
        script.voice_text,
        variation.language,
        variation.tone
      );
      
      // Generate video with HeyGen
      const videoResult = await heygenService.generateVideo({
        script: script.voice_text,
        avatar_id: selectAvatarForVariation(variation),
        voice_id: audioResult.voice_id,
        language: variation.language,
        tone: variation.tone,
        background: 'subtle_learning_environment'
      });
      
      // Wait for HeyGen completion
      const completedVideo = await heygenService.waitForCompletion(videoResult.video_id);
      
      // Upload to R2
      const r2Key = `lessons/${lessonId}/${script.type}_${variation.age}_${variation.tone}_${variation.language}.mp4`;
      const r2Url = await r2Service.uploadVideo(completedVideo.video_url, r2Key);
      
      videoSegments.push({
        segment_type: script.type,
        script_number: script.script_number,
        video_url: r2Url,
        audio_url: audioResult.audio_url,
        duration: completedVideo.duration,
        metadata: {
          heygen_video_id: videoResult.video_id,
          elevenlabs_request_id: audioResult.request_id,
          generated_at: new Date().toISOString()
        }
      });
      
      // Small delay between generations to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Create master lesson video (concatenated segments)
    const masterVideoUrl = await createMasterVideo(videoSegments, lessonId, variation, r2Service);
    
    // Update lesson in database
    await database.updateLessonMedia(lessonId, {
      video_url: masterVideoUrl,
      video_segments: videoSegments,
      generation_completed_at: new Date().toISOString()
    });
    
    // Update queue status
    await database.updateVideoQueueStatus(queueId, 'completed');
    
    console.log(`Video generation completed: ${queueId}`);
    
  } catch (error) {
    console.error(`Video generation failed: ${queueId}`, error);
    await database.updateVideoQueueStatus(queueId, 'failed', error.message);
  }
}

function selectAvatarForVariation(variation: { age: number; tone: string; language: string }): string {
  // Ken avatar selection based on age and tone
  const avatarMap = {
    early_childhood: {
      fun: '31806751c28d420aa3ac4263ce2fbc5f',       // Animated Ken
      grandmother: '668261a318774f519b03a04c75cc10b1', // Gentle Ken
      neutral: '31806751c28d420aa3ac4263ce2fbc5f'      // Standard Ken
    },
    youth: {
      fun: 'de8ca36e5ef54eeeb00a464ff5d90248',       // Standing Ken
      grandmother: '668261a318774f519b03a04c75cc10b1', // Interested Ken
      neutral: '3b21add7fc3a4bfc81c59281340c4c16'      // Explanatory Ken
    },
    adult: {
      fun: 'a564127254b04cc8a52b6448940a8638',       // Confident Ken
      grandmother: 'd9df6b91a63b42cf8eb20268065953b6', // Wise Ken
      neutral: '5e97ca0676114012bcabab196a6203bf'      // Presenting Ken
    }
  };
  
  const ageCategory = variation.age <= 12 ? 'early_childhood' : variation.age <= 25 ? 'youth' : 'adult';
  return avatarMap[ageCategory][variation.tone] || avatarMap.adult.neutral;
}

async function createMasterVideo(videoSegments: any[], lessonId: string, variation: any, r2Service: any): Promise<string> {
  // For now, return the first segment as master video
  // In production, you'd concatenate all segments
  const masterKey = `lessons/${lessonId}/master_${variation.age}_${variation.tone}_${variation.language}.mp4`;
  
  if (videoSegments.length > 0) {
    // Use first video as master for now
    // TODO: Implement video concatenation
    return videoSegments[0].video_url;
  }
  
  throw new Error('No video segments generated');
}

// services/video-generation/src/services/HeyGenService.ts
export class HeyGenService {
  private baseUrl = 'https://api.heygen.com/v2';
  
  constructor(private apiKey: string) {}

  async generateVideo(params: {
    script: string;
    avatar_id: string;
    voice_id: string;
    language: string;
    tone: string;
    background?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: "avatar",
            avatar_id: params.avatar_id,
            avatar_style: "normal"
          },
          voice: {
            type: "text",
            input_text: params.script,
            voice_id: params.voice_id
          },
          background: {
            type: "color",
            value: "#f0f8ff" // Light blue learning environment
          }
        }],
        dimension: {
          width: 1920,
          height: 1080
        },
        aspect_ratio: "16:9",
        callback_id: `lesson_${Date.now()}`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HeyGen API error: ${error.message}`);
    }

    return response.json();
  }

  async waitForCompletion(videoId: string, maxWaitTime = 600000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getVideoStatus(videoId);
      
      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error(`Video generation failed: ${status.error}`);
      }
      
      // Wait 30 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    throw new Error('Video generation timed out');
  }

  async getVideoStatus(videoId: string) {
    const response = await fetch(`${this.baseUrl}/video/${videoId}`, {
      headers: {
        'X-Api-Key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.statusText}`);
    }

    return response.json();
  }
}

// services/video-generation/src/services/ElevenLabsService.ts
export class ElevenLabsService {
  private baseUrl = 'https://api.elevenlabs.io/v1';
  
  constructor(private apiKey: string) {}

  async generateAudio(text: string, language: string, tone: string) {
    const voiceId = this.selectVoiceForLanguageAndTone(language, tone);
    
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: this.getStyleForTone(tone),
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    return {
      audio_buffer: audioBuffer,
      voice_id: voiceId,
      request_id: response.headers.get('request-id'),
      audio_url: null // Will be set after R2 upload
    };
  }

  private selectVoiceForLanguageAndTone(language: string, tone: string): string {
    const voiceMap = {
      english: {
        fun: '2EiwWnXFnvU5JabPnv8n',           // Josh - energetic
        grandmother: 'bd9428b49722494bb4def9b1a8292c9a', // Noble Nathan - warm
        neutral: '21m00Tcm4TlvDq8ikWAM'       // Professional voice
      },
      spanish: {
        fun: 'spanish_energetic_voice_id',
        grandmother: 'spanish_warm_voice_id',
        neutral: 'spanish_professional_voice_id'
      }
      // Add more languages as needed
    };
    
    return voiceMap[language]?.[tone] || voiceMap.english.neutral;
  }

  private getStyleForTone(tone: string): number {
    const styleMap = {
      fun: 0.8,        // High style/emotion
      grandmother: 0.6, // Moderate warmth
      neutral: 0.3     // Low style, more neutral
    };
    
    return styleMap[tone] || 0.5;
  }
}

// services/video-generation/src/services/CloudflareR2Service.ts
export class CloudflareR2Service {
  constructor(private r2: R2Bucket) {}

  async uploadVideo(videoUrl: string, key: string): Promise<string> {
    // Download video from HeyGen
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    
    const videoBuffer = await response.arrayBuffer();
    
    // Upload to R2
    await this.r2.put(key, videoBuffer, {
      httpMetadata: {
        contentType: 'video/mp4',
        cacheControl: 'public, max-age=31536000' // 1 year cache
      },
      customMetadata: {
        'generated-at': new Date().toISOString(),
        'source': 'heygen-api'
      }
    });
    
    // Return public URL (you'd configure this based on your R2 setup)
    return `https://videos.ilearn.how/${key}`;
  }

  async uploadAudio(audioBuffer: ArrayBuffer, key: string): Promise<string> {
    await this.r2.put(key, audioBuffer, {
      httpMetadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        'generated-at': new Date().toISOString(),
        'source': 'elevenlabs-api'
      }
    });
    
    return `https://audio.ilearn.how/${key}`;
  }
}

// services/video-generation/src/services/DatabaseService.ts
export class DatabaseService {
  constructor(private db: D1Database) {}

  async updateVideoQueueStatus(queueId: string, status: string, errorMessage?: string) {
    await this.db.prepare(`
      UPDATE video_queue 
      SET status = ?, error_message = ?, updated_at = ?
      WHERE queue_id = ?
    `).bind(status, errorMessage || null, new Date().toISOString(), queueId).run();
  }

  async updateLessonMedia(lessonId: string, mediaData: any) {
    await this.db.prepare(`
      UPDATE lessons 
      SET video_url = ?, video_segments = ?, status = 'ready', updated_at = ?
      WHERE lesson_id = ?
    `).bind(
      mediaData.video_url,
      JSON.stringify(mediaData.video_segments),
      new Date().toISOString(),
      lessonId
    ).run();
  }

  async logVideoGeneration(data: {
    lessonId: string;
    variation: any;
    duration: number;
    success: boolean;
    errorMessage?: string;
  }) {
    await this.db.prepare(`
      INSERT INTO video_generation_log (
        lesson_id, variation, duration_seconds, success, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.lessonId,
      JSON.stringify(data.variation),
      data.duration,
      data.success,
      data.errorMessage || null,
      new Date().toISOString()
    ).run();
  }
}

// services/video-generation/src/orchestrator/UniversalLessonOrchestrator.ts
// This integrates with your existing Universal Lesson Orchestrator
export class UniversalLessonOrchestrator {
  async generateLessonScripts(lessonDNA: any, age: number, tone: string, language: string) {
    // This would use your existing orchestrator logic
    // For now, returning a mock structure
    return [
      {
        script_number: 1,
        type: 'intro_question1',
        voice_text: 'Welcome to today\'s lesson. We are going to make sure you understand this perfectly.',
        on_screen_text: 'Introduction',
        timing_notes: `${tone}_engaging_pace`
      },
      {
        script_number: 2,
        type: 'question1_option_a',
        voice_text: 'If this doesn\'t make sense, you can change my tone, age-mix, or language.',
        on_screen_text: 'Option A Response',
        timing_notes: `${tone}_teaching_moment`
      },
      {
        script_number: 3,
        type: 'daily_fortune',
        voice_text: 'You have everything you need to succeed. This lesson is designed-to-be-yours.',
        on_screen_text: 'Your Daily Fortune',
        timing_notes: `${tone}_inspirational_close`
      }
    ];
  }
}