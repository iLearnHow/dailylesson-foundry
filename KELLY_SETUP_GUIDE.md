# 🎭 Kelly Avatar Setup Guide

## Overview

This guide will help you set up Kelly's avatar and voice to be fully operational in your DailyLesson pipeline. Kelly will be the primary avatar for educational lessons, with Ken as a backup option.

## Prerequisites

### Required API Keys
```bash
# Add these to your .env file
HEYGEN_API_KEY=your_heygen_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Required Files
- `training_video/kelly2.png` - Kelly's training image
- `output/audio/kelly_training_script.wav` - Kelly's voice training audio

## Step-by-Step Setup

### Step 1: Set Up Kelly's HeyGen Avatar

1. **Upload Kelly's Image to HeyGen:**
   ```bash
   # Run the setup script
   python3 scripts/setup_kelly_avatar.py
   ```
   
   This will:
   - Upload Kelly's image to HeyGen
   - Create Kelly's avatar with variations for different tones
   - Save the avatar IDs to `kelly_config.json`

2. **Manual HeyGen Setup (if script fails):**
   - Go to [HeyGen Studio](https://studio.heygen.com)
   - Click "Create Avatar"
   - Upload `training_video/kelly2.png`
   - Name it "Kelly-Universal-Teacher"
   - Note the avatar ID for later use

### Step 2: Set Up Kelly's ElevenLabs Voice

1. **Create Kelly's Voice:**
   ```bash
   # The setup script will also handle this
   python3 scripts/setup_kelly_avatar.py
   ```
   
   This will:
   - Upload Kelly's training audio to ElevenLabs
   - Create Kelly's voice profile
   - Save the voice ID to `kelly_config.json`

2. **Manual ElevenLabs Setup (if script fails):**
   - Go to [ElevenLabs Voice Lab](https://elevenlabs.io/voice-lab)
   - Click "Add Voice"
   - Upload `output/audio/kelly_training_script.wav`
   - Name it "Kelly-Universal-Teacher"
   - Note the voice ID for later use

### Step 3: Update Configuration Files

1. **Update Environment Variables:**
   ```bash
   # Copy from .env.kelly to your main .env file
   cat .env.kelly >> .env
   ```

2. **Update Voice IDs in Code:**
   Edit `crowdfunding_engine_integration.js` and replace the placeholder voice IDs:
   ```javascript
   const kellyVoices = {
     'grandmother': 'ACTUAL_KELLY_VOICE_ID_HERE',
     'fun': 'ACTUAL_KELLY_VOICE_ID_HERE', 
     'neutral': 'ACTUAL_KELLY_VOICE_ID_HERE'
   };
   ```

### Step 4: Test Kelly's Setup

1. **Run Kelly Test:**
   ```bash
   python3 scripts/test_kelly_avatar.py
   ```
   
   This will:
   - Test Kelly's voice with a sample text
   - Test Kelly's avatar with a sample video
   - Verify both are working correctly

2. **Generate Sample Lesson:**
   ```bash
   python3 scripts/generate_kelly_lesson.py
   ```
   
   This will:
   - Generate a complete lesson using Kelly
   - Create audio segments for each lesson part
   - Create video segments with Kelly's avatar
   - Save everything to `kelly_complete_lesson.json`

## Configuration Details

### Kelly's Avatar Variations
Kelly has three avatar variations for different lesson tones:

- **Grandmother Tone:** `kelly_warm_nurturing` - Warm, nurturing appearance
- **Fun Tone:** `kelly_energetic_playful` - Energetic, playful appearance  
- **Neutral Tone:** `kelly_professional_clear` - Professional, clear appearance

### Kelly's Voice Settings
Kelly's voice is optimized for educational content:

```javascript
voice_settings: {
  stability: 0.75,        // Consistent but natural variation
  similarity_boost: 0.85, // Strong personality preservation
  style: 0.60,           // Moderate style enhancement
  use_speaker_boost: true
}
```

## Integration with Pipeline

### Default Avatar Selection
Kelly is now the default avatar in your pipeline:

```javascript
// In crowdfunding_engine_integration.js
const avatarId = this.getAvatarByPreference(
  'kelly', // Default to Kelly
  lesson.lesson_metadata.tone,
  lesson.lesson_metadata.age_target
);
```

### Avatar Switching
You can switch between Kelly and Ken:

```javascript
// Use Kelly
const kellyAvatar = this.getAvatarByPreference('kelly', tone, age);

// Use Ken  
const kenAvatar = this.getAvatarByPreference('ken', tone, age);
```

## Troubleshooting

### Common Issues

1. **Kelly Image Not Found:**
   ```bash
   # Check if Kelly's image exists
   ls -la training_video/kelly2.png
   ```

2. **Kelly Audio Not Found:**
   ```bash
   # Check if Kelly's audio exists
   ls -la output/audio/kelly_training_script.wav
   ```

3. **API Key Issues:**
   ```bash
   # Verify API keys are set
   echo $HEYGEN_API_KEY
   echo $ELEVENLABS_API_KEY
   ```

4. **Avatar Creation Failed:**
   - Check HeyGen API limits
   - Verify image format (PNG recommended)
   - Ensure image is high quality (at least 512x512)

5. **Voice Creation Failed:**
   - Check ElevenLabs API limits
   - Verify audio format (WAV recommended)
   - Ensure audio is clear and high quality

### Getting Help

If you encounter issues:

1. Check the error messages in the console
2. Verify all prerequisites are met
3. Test API keys individually
4. Check file permissions and paths
5. Review the generated log files

## Next Steps

Once Kelly is set up:

1. **Test with Real Lessons:**
   - Generate lessons using your existing DNA files
   - Verify Kelly's voice and avatar work correctly
   - Check video quality and lip sync

2. **Scale Up:**
   - Generate multiple lessons with Kelly
   - Test different tones and age groups
   - Monitor performance and quality

3. **Production Deployment:**
   - Deploy Kelly to your production environment
   - Set up monitoring and logging
   - Configure backup avatars (Ken)

## Success Indicators

You'll know Kelly is fully operational when:

✅ Kelly's avatar appears in HeyGen with variations  
✅ Kelly's voice works in ElevenLabs  
✅ Test scripts run without errors  
✅ Sample lesson generation completes successfully  
✅ Kelly is the default avatar in your pipeline  
✅ You can switch between Kelly and Ken as needed  

---

**🎉 Congratulations!** Kelly is now ready to teach your 365 daily lessons! 