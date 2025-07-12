// HeyGen Video Generation Pipeline with Robust Error Handling
// Built for processing videos with resume capability

import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

class HeyGenVideoPipeline {
  constructor(config) {
    this.heygenApiKey = config.heygenApiKey;
    this.maxConcurrent = config.maxConcurrent || 5;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 5000;
    this.pollInterval = config.pollInterval || 30000;
    this.stateFile = config.stateFile || './pipeline_state.json';
    
    // Cloudflare R2 setup
    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.r2AccessKey,
        secretAccessKey: config.r2SecretKey,
      },
    });
    this.r2Bucket = config.r2Bucket;
    
    // State tracking
    this.state = {
      completed: new Set(),
      failed: new Map(),
      inProgress: new Map(),
      pending: [],
      stats: {
        total: 0,
        completed: 0,
        failed: 0,
        retries: 0,
        startTime: null,
        lastSave: null
      }
    };
    
    // Rate limiting
    this.requestQueue = [];
    this.activeRequests = 0;
  }

  // Load previous state for resume capability
  async loadState() {
    try {
      const stateData = await fs.readFile(this.stateFile, 'utf8');
      const saved = JSON.parse(stateData);
      
      this.state.completed = new Set(saved.completed || []);
      this.state.failed = new Map(saved.failed || []);
      this.state.stats = { ...this.state.stats, ...saved.stats };
      
      console.log(`Resuming pipeline: ${this.state.completed.size} completed, ${this.state.failed.size} failed`);
    } catch (error) {
      console.log('No previous state found, starting fresh');
    }
  }

  // Save state for resume capability
  async saveState() {
    const stateToSave = {
      completed: Array.from(this.state.completed),
      failed: Array.from(this.state.failed.entries()),
      stats: {
        ...this.state.stats,
        lastSave: new Date().toISOString()
      }
    };
    
    await fs.writeFile(this.stateFile, JSON.stringify(stateToSave, null, 2));
  }

  // Rate-limited API request wrapper
  async makeRequest(url, options, retries = 0) {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          this.activeRequests++;
          const response = await fetch(url, {
            ...options,
            headers: {
              'X-API-Key': this.heygenApiKey,
              'Content-Type': 'application/json',
              ...options.headers
            }
          });

          if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          resolve(data);
        } catch (error) {
          if (retries < this.retryAttempts) {
            console.log(`Request failed, retrying in ${this.retryDelay}ms... (${retries + 1}/${this.retryAttempts})`);
            setTimeout(() => {
              this.makeRequest(url, options, retries + 1).then(resolve).catch(reject);
            }, this.retryDelay * Math.pow(2, retries)); // Exponential backoff
            this.state.stats.retries++;
          } else {
            reject(error);
          }
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      if (this.activeRequests < this.maxConcurrent) {
        executeRequest();
      } else {
        this.requestQueue.push(executeRequest);
      }
    });
  }

  // Process queued requests
  processQueue() {
    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const nextRequest = this.requestQueue.shift();
      nextRequest();
    }
  }

  // Generate single video
  async generateVideo(lesson) {
    const videoId = `${lesson.id}_${Date.now()}`;
    
    try {
      // Skip if already completed
      if (this.state.completed.has(lesson.id)) {
        console.log(`Skipping ${lesson.id} - already completed`);
        return null;
      }

      console.log(`Starting video generation for lesson: ${lesson.id}`);
      
      // Use the correct avatar and voice IDs from kelly_config.json
      const avatarId = lesson.avatar === 'kelly' ? '80d67b1371b342ecaf4235e5f61491ae' : 'ae16c1eb9ff44e7b8a7ca21c4cc0de02';
      const voiceId = lesson.avatar === 'kelly' ? 'cJLh37pTYdhJT0Dvnttb' : 's6JeSRcsXa6EBsc5ODOx';
      
      const response = await this.makeRequest('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        body: JSON.stringify({
          video_inputs: [{
            character: {
              type: 'avatar',
              avatar_id: avatarId
            },
            voice: {
              type: 'text',
              input_text: lesson.script,
              voice_id: voiceId
            }
          }],
          aspect_ratio: '16:9',
          dimension: { width: 1920, height: 1080 }
        })
      });

      const heygenVideoId = response.data.video_id;
      this.state.inProgress.set(lesson.id, {
        heygenVideoId,
        startTime: new Date().toISOString(),
        lesson
      });

      // Poll for completion
      const completedVideo = await this.pollVideoCompletion(heygenVideoId, lesson.id);
      
      if (completedVideo) {
        // Upload to R2
        await this.uploadToR2(completedVideo, lesson);
        
        // Mark as completed
        this.state.completed.add(lesson.id);
        this.state.inProgress.delete(lesson.id);
        this.state.stats.completed++;
        
        console.log(`✅ Completed lesson ${lesson.id} (${this.state.stats.completed}/${this.state.stats.total})`);
        
        // Save state every 10 completions
        if (this.state.stats.completed % 10 === 0) {
          await this.saveState();
        }
        
        return completedVideo;
      }
    } catch (error) {
      console.error(`❌ Failed to generate video for lesson ${lesson.id}:`, error.message);
      
      // Track failure
      this.state.failed.set(lesson.id, {
        error: error.message,
        timestamp: new Date().toISOString(),
        lesson
      });
      this.state.stats.failed++;
      
      // Remove from in-progress
      this.state.inProgress.delete(lesson.id);
      
      throw error;
    }
  }

  // Poll for video completion with timeout
  async pollVideoCompletion(videoId, lessonId, timeout = 1800000) { // 30 min timeout
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.makeRequest(`https://api.heygen.com/v2/video/${videoId}`, {
          method: 'GET'
        });

        console.log(`Polling ${lessonId}: ${response.data.status}`);

        if (response.data.status === 'completed') {
          return {
            videoId,
            downloadUrl: response.data.video_url,
            duration: response.data.duration
          };
        }

        if (response.data.status === 'failed') {
          throw new Error(`HeyGen processing failed: ${response.data.error || 'Unknown error'}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
      } catch (error) {
        console.error(`Error polling video ${videoId}:`, error.message);
        throw error;
      }
    }

    throw new Error(`Video ${videoId} timed out after ${timeout / 1000} seconds`);
  }

  // Upload video to Cloudflare R2
  async uploadToR2(video, lesson) {
    try {
      // Download video from HeyGen
      const videoResponse = await fetch(video.downloadUrl);
      const videoBuffer = await videoResponse.arrayBuffer();
      
      // Upload to R2
      const key = `lessons/${lesson.id}/video.mp4`;
      await this.r2Client.send(new PutObjectCommand({
        Bucket: this.r2Bucket,
        Key: key,
        Body: new Uint8Array(videoBuffer),
        ContentType: 'video/mp4',
        ACL: 'public-read'
      }));

      console.log(`📁 Uploaded ${lesson.id} to R2: ${key}`);
      return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${this.r2Bucket}/${key}`;
    } catch (error) {
      console.error(`Failed to upload ${lesson.id} to R2:`, error);
      throw error;
    }
  }

  // Process all lessons with concurrency control
  async processLessons(lessons) {
    await this.loadState();
    
    this.state.stats.total = lessons.length;
    this.state.stats.startTime = new Date().toISOString();
    
    // Filter out already completed lessons
    const pendingLessons = lessons.filter(lesson => !this.state.completed.has(lesson.id));
    console.log(`Processing ${pendingLessons.length} pending lessons (${this.state.completed.size} already completed)`);

    // Process with concurrency control
    const results = await Promise.allSettled(
      pendingLessons.map(lesson => this.generateVideo(lesson))
    );

    // Final state save
    await this.saveState();

    // Generate report
    this.generateReport();
    
    return results;
  }

  // Generate processing report
  generateReport() {
    const duration = this.state.stats.startTime ? 
      (Date.now() - new Date(this.state.stats.startTime).getTime()) / 1000 : 0;
    
    console.log('\n📊 PROCESSING REPORT');
    console.log('==================');
    console.log(`Total lessons: ${this.state.stats.total}`);
    console.log(`Completed: ${this.state.stats.completed}`);
    console.log(`Failed: ${this.state.stats.failed}`);
    console.log(`Retries: ${this.state.stats.retries}`);
    console.log(`Duration: ${Math.round(duration / 60)} minutes`);
    console.log(`Average per video: ${Math.round(duration / this.state.stats.completed)} seconds`);
    
    if (this.state.failed.size > 0) {
      console.log('\n❌ FAILED LESSONS:');
      for (const [lessonId, failure] of this.state.failed) {
        console.log(`- ${lessonId}: ${failure.error}`);
      }
    }
  }

  // Retry failed lessons
  async retryFailed() {
    const failedLessons = Array.from(this.state.failed.entries()).map(([id, data]) => ({
      id,
      ...data.lesson
    }));

    if (failedLessons.length === 0) {
      console.log('No failed lessons to retry');
      return;
    }

    console.log(`Retrying ${failedLessons.length} failed lessons...`);
    
    // Clear failed state for retry
    this.state.failed.clear();
    
    return this.processLessons(failedLessons);
  }
}

// Usage example
async function main() {
  const pipeline = new HeyGenVideoPipeline({
    heygenApiKey: process.env.HEYGEN_API_KEY,
    maxConcurrent: 5, // Conservative for API limits
    retryAttempts: 3,
    retryDelay: 5000,
    pollInterval: 30000,
    stateFile: './video_pipeline_state.json',
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKey: process.env.R2_ACCESS_KEY_ID,
    r2SecretKey: process.env.R2_SECRET_ACCESS_KEY,
    r2Bucket: process.env.R2_BUCKET
  });

  // Sample lessons data with Kelly and Ken
  const lessons = [
    {
      id: 'lesson_001',
      avatar: 'kelly',
      script: 'Hello! I\'m Kelly, your universal teacher. Today we\'re going to explore quantum computing together.',
      title: 'Introduction to Quantum Computing'
    },
    {
      id: 'lesson_002', 
      avatar: 'ken',
      script: 'Welcome! I\'m Ken, and today we\'ll discover the fascinating world of artificial intelligence.',
      title: 'AI Fundamentals'
    }
  ];

  try {
    await pipeline.processLessons(lessons);
    
    // Retry any failures
    await pipeline.retryFailed();
    
    console.log('🎉 Pipeline completed successfully!');
  } catch (error) {
    console.error('Pipeline failed:', error);
    process.exit(1);
  }
}

// Run the pipeline
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default HeyGenVideoPipeline; 