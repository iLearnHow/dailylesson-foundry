// utils/heygenClient.js
require('dotenv').config();
const fetch = require('node-fetch');

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

async function generateHeyGenVideo({ avatar_id, voice_id, script, dimension = { width: 1920, height: 1080 } }) {
  const res = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-API-Key': HEYGEN_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_inputs: [{
        character: { type: 'avatar', avatar_id },
        voice: { type: 'text', input_text: script, voice_id }
      }],
      dimension
    })
  });
  if (!res.ok) throw new Error(`HeyGen API error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function pollHeyGenVideoStatus(video_id, intervalMs = 5000, maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`https://api.heygen.com/v2/video/${video_id}`, {
      headers: { 'X-API-Key': HEYGEN_API_KEY }
    });
    if (!res.ok) throw new Error(`HeyGen status error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    if (data.data?.status === 'completed') return data.data.video_url;
    if (data.data?.status === 'failed') throw new Error('HeyGen video generation failed');
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('HeyGen video polling timed out');
}

module.exports = { generateHeyGenVideo, pollHeyGenVideoStatus }; 