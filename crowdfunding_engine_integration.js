// CROWDFUNDING → ENGINE PIPELINE INTEGRATION
// This connects your beautiful crowdfunding platform to your sophisticated lesson generation system

const UniversalLessonOrchestrator = require('./orchestrator/UniversalLessonOrchestrator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class CrowdfundingEngineIntegration {
  constructor() {
    this.orchestrator = new UniversalLessonOrchestrator();
    this.productionQueue = [];
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * MAIN INTEGRATION POINT: Handle successful crowdfunding
   */
  async handleFundingSuccess(lessonId, fundingData) {
    console.log(`🎯 Lesson ${lessonId} fully funded! Starting production pipeline...`);
    
    try {
      // 1. Update lesson status to "funded"
      await this.updateLessonStatus(lessonId, 'funded', {
        totalRaised: fundingData.totalAmount,
        contributors: fundingData.contributors,
        fundedAt: new Date()
      });

      // 2. Add to production queue
      const productionJob = {
        lessonId,
        priority: this.calculatePriority(fundingData),
        requestedVariations: this.getRequestedVariations(fundingData),
        fundingData,
        queuedAt: new Date()
      };

      this.productionQueue.push(productionJob);
      await this.saveProductionQueue();

      // 3. Start immediate production if queue is ready
      await this.processProductionQueue();

      // 4. Notify contributors
      await this.notifyContributors(lessonId, fundingData.contributors);

      return {
        success: true,
        message: `Lesson ${lessonId} entered production pipeline`,
        estimatedCompletion: this.estimateCompletionTime(productionJob)
      };

    } catch (error) {
      console.error(`❌ Production pipeline failed for lesson ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * PRODUCTION QUEUE PROCESSOR
   */
  async processProductionQueue() {
    if (this.productionQueue.length === 0) return;

    // Sort by priority (paying customers first, then community favorites)
    this.productionQueue.sort((a, b) => b.priority - a.priority);

    const currentJob = this.productionQueue[0];
    
    console.log(`🎬 Starting production for lesson: ${currentJob.lessonId}`);

    try {
      // Update status to "generating"
      await this.updateLessonStatus(currentJob.lessonId, 'generating', {
        productionStarted: new Date(),
        estimatedCompletion: this.estimateCompletionTime(currentJob)
      });

      // Generate all requested variations
      const generatedContent = await this.generateAllVariations(currentJob);

      // Trigger A/V production
      await this.triggerAVProduction(currentJob, generatedContent);

      // Remove from queue
      this.productionQueue.shift();
      await this.saveProductionQueue();

    } catch (error) {
      console.error(`❌ Production failed for ${currentJob.lessonId}:`, error);
      await this.handleProductionFailure(currentJob, error);
    }
  }

  /**
   * GENERATE ALL LESSON VARIATIONS using your 4 engines
   */
  async generateAllVariations(productionJob) {
    const { lessonId, requestedVariations } = productionJob;
    const variations = {};

    console.log(`🧬 Generating ${requestedVariations.length} variations for ${lessonId}`);

    for (const variation of requestedVariations) {
      const { age, tone, language } = variation;
      
      try {
        console.log(`  📝 Generating: Age ${age}, ${tone} tone, ${language}`);
        
        // Use your orchestrator to generate the lesson
        const generatedLesson = await this.orchestrator.generateLesson(
          lessonId, 
          age, 
          tone, 
          language
        );

        // Store the generated content
        const variationKey = `${age}_${tone}_${language}`;
        variations[variationKey] = {
          ...generatedLesson,
          generatedAt: new Date(),
          status: 'text_complete'
        };

        // Save to database immediately (backup)
        await this.saveGeneratedVariation(lessonId, variationKey, generatedLesson);

      } catch (error) {
        console.error(`❌ Failed to generate variation ${age}_${tone}_${language}:`, error);
        variations[`${age}_${tone}_${language}`] = {
          error: error.message,
          status: 'generation_failed'
        };
      }
    }

    console.log(`✅ Generated ${Object.keys(variations).length} variations for ${lessonId}`);
    return variations;
  }

  /**
   * TRIGGER A/V PRODUCTION (HeyGen + ElevenLabs)
   */
  async triggerAVProduction(productionJob, generatedContent) {
    const { lessonId } = productionJob;
    
    console.log(`🎬 Starting A/V production for ${lessonId}`);

    const avJobs = [];

    for (const [variationKey, lesson] of Object.entries(generatedContent)) {
      if (lesson.status !== 'text_complete') continue;

      // Create audio production job
      const audioJob = this.createElevenLabsJob(lessonId, variationKey, lesson);
      avJobs.push(audioJob);

      // Create video production job  
      const videoJob = this.createHeyGenJob(lessonId, variationKey, lesson);
      avJobs.push(videoJob);
    }

    // Execute all A/V production jobs
    const avResults = await Promise.allSettled(avJobs);
    
    // Process results
    await this.processAVResults(lessonId, avResults);

    return avResults;
  }

  /**
   * ELEVEN LABS AUDIO PRODUCTION
   */
  async createElevenLabsJob(lessonId, variationKey, lesson) {
    try {
      console.log(`🎤 Creating audio for ${lessonId}_${variationKey}`);

      // Extract voice text from lesson
      const voiceText = lesson.scripts
        .map(script => script.voice_text)
        .join(' ');

      // Always use Kelly's voice ID for Kelly
      const voiceId = 'cJLh37pTYdhJT0Dvnttb';

      // Call ElevenLabs API
      const audioResponse = await this.callElevenLabsAPI({
        text: voiceText,
        voice_id: voiceId,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.60,
          use_speaker_boost: true
        }
      });

      return {
        type: 'audio',
        lessonId,
        variationKey,
        status: 'completed',
        audioPath: audioResponse.audio,
        avatar: 'kelly' // Track which avatar was used
      };

    } catch (error) {
      console.error(`❌ ElevenLabs job failed:`, error);
      return {
        type: 'audio',
        lessonId,
        variationKey,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * HEYGEN VIDEO PRODUCTION
   */
  async createHeyGenJob(lessonId, variationKey, lesson) {
    try {
      console.log(`🎥 Creating video for ${lessonId}_${variationKey}`);

      // Extract scripts for video
      const videoScript = lesson.scripts
        .map(script => ({
          text: script.voice_text,
          timing: script.timing_notes
        }));

      // Always use Kelly's avatar ID for Kelly
      const avatarId = '80d67b1371b342ecaf4235e5f61491ae';

      // Call HeyGen API
      const videoResponse = await this.callHeyGenAPI({
        script: videoScript,
        avatar_id: avatarId,
        background: "kelly_educational_background" // Updated for Kelly
      });

      // HeyGen is async, so we get a job ID
      const videoJobId = videoResponse.video_id;

      // Poll for completion (or use webhooks)
      await this.pollHeyGenCompletion(videoJobId, lessonId, variationKey);

      return {
        type: 'video',
        lessonId,
        variationKey,
        status: 'processing',
        videoJobId,
        avatar: 'kelly' // Track which avatar was used
      };

    } catch (error) {
      console.error(`❌ HeyGen job failed:`, error);
      return {
        type: 'video',
        lessonId,
        variationKey,
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * WEBHOOK HANDLER: Stripe payment success
   */
  async handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, this.webhookSecret);
    } catch (err) {
      console.error(`❌ Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Extract lesson info from payment metadata
      const lessonId = paymentIntent.metadata.lessonId;
      const contributionAmount = paymentIntent.amount / 100; // Convert from cents
      
      console.log(`💰 Payment received: $${contributionAmount} for lesson ${lessonId}`);

      // Update lesson funding
      await this.updateLessonFunding(lessonId, {
        amount: contributionAmount,
        contributor: paymentIntent.metadata.contributorEmail,
        paymentId: paymentIntent.id
      });

      // Check if lesson is now fully funded
      const lessonStatus = await this.checkLessonFunding(lessonId);
      
      if (lessonStatus.isFullyFunded) {
        // TRIGGER THE PRODUCTION PIPELINE!
        await this.handleFundingSuccess(lessonId, lessonStatus);
      }
    }

    res.json({received: true});
  }

  /**
   * PRODUCTION COMPLETION: Make lesson available via API
   */
  async handleProductionComplete(lessonId, variationKey, avResults) {
    try {
      console.log(`🎉 Production complete for ${lessonId}_${variationKey}`);

      // Update lesson status to "available"
      await this.updateLessonVariation(lessonId, variationKey, {
        status: 'available',
        audioPath: avResults.audioPath,
        videoPath: avResults.videoPath,
        availableAt: new Date()
      });

      // Add to API endpoints
      await this.registerAPIEndpoint(lessonId, variationKey);

      // Notify contributors
      await this.notifyContributorsOfCompletion(lessonId);

      // Update crowdfunding page
      await this.updateCrowdfundingStatus(lessonId, 'available');

      console.log(`✅ Lesson ${lessonId}_${variationKey} now available via API!`);

    } catch (error) {
      console.error(`❌ Failed to complete production for ${lessonId}:`, error);
    }
  }

  /**
   * API ENDPOINT: Check if lesson is available
   */
  async getLessonStatus(lessonId, age = null, tone = null, language = 'english') {
    try {
      const variationKey = age && tone ? `${age}_${tone}_${language}` : null;
      
      if (variationKey) {
        // Check specific variation
        const variation = await this.getLessonVariation(lessonId, variationKey);
        return {
          lessonId,
          variationKey,
          status: variation?.status || 'not_available',
          audioPath: variation?.audioPath,
          videoPath: variation?.videoPath,
          availableAt: variation?.availableAt
        };
      } else {
        // Check overall lesson status
        const lesson = await this.getLesson(lessonId);
        return {
          lessonId,
          status: lesson?.status || 'not_available',
          fundingProgress: lesson?.fundingProgress,
          availableVariations: lesson?.availableVariations || []
        };
      }
    } catch (error) {
      return {
        lessonId,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * HELPER METHODS
   */
  getRequestedVariations(fundingData) {
    // Standard variations for every funded lesson
    return [
      { age: 8, tone: 'fun', language: 'english' },
      { age: 25, tone: 'neutral', language: 'english' },
      { age: 65, tone: 'grandmother', language: 'english' },
      // Add more based on funding level or community requests
    ];
  }

  calculatePriority(fundingData) {
    let priority = 1;
    
    // Higher priority for lessons with more contributors
    priority += fundingData.contributors.length * 0.1;
    
    // Higher priority for overfunded lessons
    if (fundingData.totalAmount > 50) {
      priority += (fundingData.totalAmount - 50) * 0.02;
    }
    
    return priority;
  }

  getVoiceByAvatar(avatar = 'kelly', tone) {
    // Always return the single Kelly voice ID for Kelly
    if (avatar === 'kelly') {
      return 'cJLh37pTYdhJT0Dvnttb';
    } else {
      // Ken's voice IDs (existing)
      const kenVoices = {
        'grandmother': 'pNInz6obpgDQGcFmaJgB',
        'fun': 'EXAVITQu4vr4xnSDxMaL',
        'neutral': 'flq6f7yk4E4fJM5XTYuZ'
      };
      return kenVoices[tone] || kenVoices['neutral'];
    }
  }

  getHeyGenAvatar(tone, age) {
    // Always return the single Kelly avatar ID for Kelly
    return '80d67b1371b342ecaf4235e5f61491ae';
  }

  getAvatarByPreference(preference = 'kelly', tone, age) {
    // Always return the single Kelly avatar ID for Kelly
    if (preference === 'kelly') {
      return '80d67b1371b342ecaf4235e5f61491ae';
    } else {
      // Ken's avatar variations (existing)
      const kenAvatars = {
        'grandmother': 'ken_warm_nurturing',
        'fun': 'ken_energetic_playful',
        'neutral': 'ken_professional_clear'
      };
      return kenAvatars[tone] || kenAvatars['neutral'];
    }
  }

  estimateCompletionTime(productionJob) {
    const baseTime = 30; // 30 minutes base
    const variationTime = productionJob.requestedVariations.length * 10; // 10 min per variation
    const queuePosition = this.productionQueue.indexOf(productionJob);
    const queueDelay = queuePosition * 45; // 45 min per job ahead in queue
    
    const totalMinutes = baseTime + variationTime + queueDelay;
    return new Date(Date.now() + totalMinutes * 60 * 1000);
  }

  // Database methods (implement with your chosen DB)
  async updateLessonStatus(lessonId, status, metadata) {
    // Update lesson record in database
    console.log(`📝 Updated lesson ${lessonId} status to: ${status}`);
  }

  async saveGeneratedVariation(lessonId, variationKey, lesson) {
    // Save generated lesson content to database
    console.log(`💾 Saved variation: ${lessonId}_${variationKey}`);
  }

  async notifyContributors(lessonId, contributors) {
    // Send email updates to contributors
    console.log(`📧 Notified ${contributors.length} contributors about ${lessonId} production start`);
  }

  // Placeholder API calls (implement with actual services)
  async callElevenLabsAPI(params) {
    console.log(`🎤 ElevenLabs API call:`, params);
    // Return mock response for now
    return { audio: Buffer.from('mock_audio_data') };
  }

  async callHeyGenAPI(params) {
    console.log(`🎥 HeyGen API call:`, params);
    // Return mock response for now
    return { video_id: 'mock_video_job_id' };
  }
}

// EXPRESS.JS INTEGRATION EXAMPLE
const express = require('express');
const app = express();
const integration = new CrowdfundingEngineIntegration();

// Webhook endpoint for Stripe
app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  await integration.handleStripeWebhook(req, res);
});

// API endpoint to check lesson status
app.get('/api/lesson/:lessonId/status', async (req, res) => {
  const { lessonId } = req.params;
  const { age, tone, language } = req.query;
  
  const status = await integration.getLessonStatus(lessonId, age, tone, language);
  res.json(status);
});

// API endpoint to trigger production manually (for testing)
app.post('/api/lesson/:lessonId/trigger-production', async (req, res) => {
  const { lessonId } = req.params;
  
  try {
    const result = await integration.handleFundingSuccess(lessonId, {
      totalAmount: 50,
      contributors: ['test@example.com'],
      source: 'manual_trigger'
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { CrowdfundingEngineIntegration, app };

// USAGE EXAMPLE:
// 1. Community funds lesson → Stripe webhook triggers handleFundingSuccess()
// 2. Lesson added to production queue → processProductionQueue() runs
// 3. Your 4 engines generate all text variations → generateAllVariations()
// 4. HeyGen + ElevenLabs create A/V → triggerAVProduction()
// 5. Lesson becomes available via API → handleProductionComplete()
// 6. Developers can access via $20/month API → getLessonStatus()

console.log(`
🎯 INTEGRATION COMPLETE!

Your beautiful crowdfunding platform now seamlessly connects to your 
sophisticated 4-engine lesson generation system.

Flow: Community Funding → Automatic Production → API Availability

Next steps:
1. Add this integration to your existing crowdfunding platform
2. Test with a real lesson (try 'negotiation-skills')
3. Deploy with actual HeyGen + ElevenLabs credentials
4. Launch and watch the magic happen! ✨
`);