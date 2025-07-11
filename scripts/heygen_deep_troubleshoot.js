#!/usr/bin/env node

// Deep troubleshooting for HeyGen API
import dotenv from 'dotenv';

dotenv.config();

async function deepTroubleshoot() {
  console.log('🔍 Deep HeyGen API Troubleshooting...');
  
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.error('❌ HEYGEN_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ API Key found in environment');
  
  // Try both the raw key and base64 decoded key
  const rawKey = Buffer.from(apiKey, 'base64').toString();
  console.log(`🔑 Raw API Key: ${rawKey}`);
  
  // Test different API endpoints and authentication methods
  const tests = [
    {
      name: 'V2 Avatars with X-API-Key (Raw)',
      url: 'https://api.heygen.com/v2/avatars',
      headers: { 'X-API-Key': rawKey }
    },
    {
      name: 'V2 Voices with X-API-Key (Raw)',
      url: 'https://api.heygen.com/v2/voices',
      headers: { 'X-API-Key': rawKey }
    },
    {
      name: 'V1 Avatar List with Bearer (Raw)',
      url: 'https://api.heygen.com/v1/avatar.list',
      headers: { 'Authorization': `Bearer ${rawKey}` }
    },
    {
      name: 'V1 Voice List with Bearer (Raw)',
      url: 'https://api.heygen.com/v1/voice.list',
      headers: { 'Authorization': `Bearer ${rawKey}` }
    },
    {
      name: 'V1 Avatar List with X-API-Key (Raw)',
      url: 'https://api.heygen.com/v1/avatar.list',
      headers: { 'X-API-Key': rawKey }
    },
    {
      name: 'V2 Avatars with Bearer (Raw)',
      url: 'https://api.heygen.com/v2/avatars',
      headers: { 'Authorization': `Bearer ${rawKey}` }
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`🔗 URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('📄 Response:', JSON.stringify(data, null, 2));
        console.log('\n🎉 Found working authentication method!');
        return; // Found working method
      } else {
        const errorData = await response.json();
        console.log('❌ FAILED');
        console.log('📄 Error:', JSON.stringify(errorData, null, 2));
      }
    } catch (error) {
      console.log('❌ NETWORK ERROR:', error.message);
    }
  }
  
  console.log('\n🔍 Troubleshooting Analysis:');
  console.log('==========================');
  console.log('1. All endpoints returning 401 Unauthorized');
  console.log('2. Both v1 and v2 APIs affected');
  console.log('3. Both X-API-Key and Bearer auth failing');
  console.log('4. Network connectivity is working');
  
  console.log('\n🔧 Possible Solutions:');
  console.log('=====================');
  console.log('1. **Account Subscription Issue:**');
  console.log('   - Check: https://app.heygen.com/settings/billing');
  console.log('   - API access might require paid subscription');
  console.log('   - Free accounts may not have API access');
  
  console.log('\n2. **API Key Permissions:**');
  console.log('   - Check: https://app.heygen.com/settings/api');
  console.log('   - Generate new key with full permissions');
  console.log('   - Ensure key has API access enabled');
  
  console.log('\n3. **Account Verification:**');
  console.log('   - Verify email address is confirmed');
  console.log('   - Check account is not suspended');
  
  console.log('\n4. **API Key Format:**');
  console.log(`   - Current key: ${rawKey}`);
  console.log('   - This looks like a valid HeyGen key format');
  
  console.log('\n5. **Alternative Solutions:**');
  console.log('   - Use HeyGen web interface for manual generation');
  console.log('   - Consider alternative AI video services');
  console.log('   - Contact HeyGen support for API access');
  
  console.log('\n📞 Next Steps:');
  console.log('==============');
  console.log('1. Check your HeyGen account subscription level');
  console.log('2. Verify API access is enabled for your plan');
  console.log('3. Generate a new API key if needed');
  console.log('4. Contact HeyGen support if issues persist');
}

deepTroubleshoot(); 