// Heygen API to Cloudflare R2 Storage Pipeline
// This handles your lesson video generation and storage workflow

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

class LessonVideoProcessor {
  constructor() {
    // Cloudflare R2 configuration
    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    
    // Heygen API configuration
    this.heygenApiKey = process.env.HEYGEN_API_KEY;
    this.heygenBaseUrl = 'https://api.heygen.com/v2';
  }

  // Generate video from lesson DNA script
  async generateLessonVideo(lessonDNA, avatar = 'ken') {
    try {
      // 1. Extract script from lesson DNA
      const script = this.extractScriptFromDNA(lessonDNA);
      
      // 2. Create Heygen video generation request
      const videoRequest = {
        video_inputs: [{
          character: {
            type: "avatar",
            avatar_id: avatar === 'ken' ? process.env.KEN_AVATAR_ID : process.env.KELLY_AVATAR_ID,
            avatar_style: "normal"
          },
          voice: {
            type: "text",
            input_text: script.fullScript,
            voice_id: avatar === 'ken' ? process.env.KEN_VOICE_ID : process.env.KELLY_VOICE_ID
          },
          background: {
            type: "color",
            value: "#f0f8ff" // Light blue background
          }
        }],
        dimension: {
          width: 1920,
          height: 1080
        },
        aspect_ratio: "16:9"
      };

      // 3. Submit to Heygen
      const response = await fetch(`${this.heygenBaseUrl}/video/generate`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.heygenApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(videoRequest)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Heygen API error: ${result.message}`);
      }

      // 4. Poll for completion
      const videoUrl = await this.waitForVideoGeneration(result.video_id);
      
      // 5. Download and upload to R2
      const r2Url = await this.uploadVideoToR2(videoUrl, lessonDNA.lesson_id);
      
      return {
        success: true,
        lessonId: lessonDNA.lesson_id,
        videoUrl: r2Url,
        heygenVideoId: result.video_id,
        metadata: {
          avatar: avatar,
          duration: script.estimatedDuration,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Video generation failed:', error);
      return {
        success: false,
        error: error.message,
        lessonId: lessonDNA.lesson_id
      };
    }
  }

  // Extract and format script from lesson DNA
  extractScriptFromDNA(lessonDNA) {
    const scripts = lessonDNA.scripts || [];
    
    // Combine all script segments into one flowing narrative
    const fullScript = scripts.map(script => {
      return script.voice_text || script.script_text || '';
    }).join(' ');

    // Calculate estimated duration (roughly 150 words per minute)
    const wordCount = fullScript.split(' ').length;
    const estimatedDuration = Math.ceil(wordCount / 150 * 60); // seconds

    return {
      fullScript: fullScript,
      wordCount: wordCount,
      estimatedDuration: estimatedDuration,
      segments: scripts
    };
  }

  // Wait for Heygen video generation to complete
  async waitForVideoGeneration(videoId, maxWaitTime = 600000) { // 10 minutes max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(`${this.heygenBaseUrl}/video/${videoId}`, {
          headers: {
            'X-Api-Key': this.heygenApiKey
          }
        });

        const result = await response.json();
        
        if (result.status === 'completed') {
          return result.video_url;
        } else if (result.status === 'failed') {
          throw new Error(`Video generation failed: ${result.error}`);
        }
        
        // Wait 30 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 30000));
        
      } catch (error) {
        console.error('Error checking video status:', error);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    throw new Error('Video generation timed out');
  }

  // Upload video to Cloudflare R2
  async uploadVideoToR2(videoUrl, lessonId) {
    try {
      // Download video from Heygen
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      
      const videoBuffer = await response.arrayBuffer();
      
      // Generate R2 key
      const timestamp = new Date().toISOString().split('T')[0];
      const r2Key = `lessons/${timestamp}/${lessonId}.mp4`;
      
      // Upload to R2
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: videoBuffer,
        ContentType: 'video/mp4',
        Metadata: {
          'lesson-id': lessonId,
          'generated-at': new Date().toISOString()
        }
      });

      await this.r2Client.send(uploadCommand);
      
      // Return public URL
      const publicUrl = `https://${process.env.R2_CUSTOM_DOMAIN}/${r2Key}`;
      
      return publicUrl;
      
    } catch (error) {
      console.error('R2 upload failed:', error);
      throw error;
    }
  }

  // Batch process multiple lessons
  async batchGenerateVideos(lessonDNAArray, avatar = 'ken') {
    const results = [];
    
    for (const lessonDNA of lessonDNAArray) {
      console.log(`Processing lesson: ${lessonDNA.lesson_id}`);
      
      const result = await this.generateLessonVideo(lessonDNA, avatar);
      results.push(result);
      
      // Add delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return results;
  }

  // Store lesson metadata in Cloudflare D1
  async storeLessonMetadata(lessonData) {
    // You'll need to set up D1 database connection
    const sql = `
      INSERT INTO lessons (
        lesson_id, title, video_url, audio_url, 
        age_target, tone, language, duration,
        created_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Execute SQL - this will depend on your D1 setup
    // await db.prepare(sql).bind(...values).run();
  }
}

// Usage example:
async function processLessonPipeline() {
  const processor = new LessonVideoProcessor();
  
  // Example lesson DNA (replace with your actual structure)
  const lessonDNA = {
    lesson_id: "sharing_kindness_20241208_8_grandmother_spanish",
    scripts: [
      {
        script_number: 1,
        type: "intro_question1",
        voice_text: "Today we're going to learn about sharing kindness...",
        timing_notes: "warm_grandmother_pace"
      }
      // ... more script segments
    ]
  };
  
  // Generate video
  const result = await processor.generateLessonVideo(lessonDNA, 'ken');
  
  if (result.success) {
    console.log(`Video generated successfully: ${result.videoUrl}`);
    
    // Store in your database
    await processor.storeLessonMetadata({
      lesson_id: result.lessonId,
      video_url: result.videoUrl,
      // ... other metadata
    });
  } else {
    console.error(`Video generation failed: ${result.error}`);
  }
}

export { LessonVideoProcessor };

// Environment variables you need to set:
/*
HEYGEN_API_KEY=your_heygen_api_key
KEN_AVATAR_ID=your_ken_avatar_id
KELLY_AVATAR_ID=your_kelly_avatar_id
KEN_VOICE_ID=your_ken_voice_id
KELLY_VOICE_ID=your_kelly_voice_id
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_CUSTOM_DOMAIN=your_r2_custom_domain
*/