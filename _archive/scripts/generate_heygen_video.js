// scripts/generate_heygen_video.js
require('dotenv').config();
const { generateHeyGenVideo, pollHeyGenVideoStatus } = require('../utils/heygenClient');

async function main() {
  const avatar_id = process.env.DEFAULT_KEN_AVATAR_ID;
  const voice_id = process.env.VOICE_ID_NOBLE_NATHAN;
  const script = "This is a test of the HeyGen API integration for our lesson platform.";

  try {
    console.log('Requesting video generation...');
    const { data } = await generateHeyGenVideo({ avatar_id, voice_id, script });
    const video_id = data.video_id;
    console.log('Video job created:', video_id);

    console.log('Polling for video completion...');
    const video_url = await pollHeyGenVideoStatus(video_id);
    console.log('Video ready at:', video_url);

    // Download video
    const videoRes = await fetch(video_url);
    if (!videoRes.ok) throw new Error(`Failed to download video: ${videoRes.status}`);
    const videoBuffer = await videoRes.buffer();
    console.log('Video downloaded, uploading to R2...');

    // Upload to R2
    const { uploadToR2 } = require('../utils/r2Client');
    const r2Key = `videos/heygen-test-${Date.now()}.mp4`;
    const r2Url = await uploadToR2({ key: r2Key, body: videoBuffer, contentType: 'video/mp4' });
    console.log('Uploaded to R2:', r2Url);
  } catch (err) {
    console.error('Error:', err);
  }
}

main(); 