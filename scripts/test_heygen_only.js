#!/usr/bin/env node

// Simple test to verify HeyGen API key
import dotenv from 'dotenv';

dotenv.config();

async function testHeyGenAPI() {
  console.log('🧪 Testing HeyGen API Key...');
  
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.error('❌ HEYGEN_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ API Key found in environment');
  
  try {
    // Test with v2 API
    const response = await fetch('https://api.heygen.com/v2/avatars', {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is valid!');
      console.log('Available avatars:', data.data?.length || 0);
      
      if (data.data && data.data.length > 0) {
        console.log('First avatar:', data.data[0]);
      }
    } else {
      const errorData = await response.json();
      console.error('❌ API Key is invalid or expired');
      console.error('Error:', errorData);
      
      if (response.status === 401) {
        console.log('\n🔧 To fix this:');
        console.log('1. Go to https://app.heygen.com/settings/api');
        console.log('2. Generate a new API key');
        console.log('3. Update your .env file with the new key');
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testHeyGenAPI(); 