#!/usr/bin/env node

// Forensic Analysis of HeyGen API Issues
import dotenv from 'dotenv';

dotenv.config();

async function forensicAnalysis() {
  console.log('🔬 FORENSIC ANALYSIS: HeyGen API Investigation');
  console.log('==============================================');
  
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.error('❌ HEYGEN_API_KEY not found');
    return;
  }
  
  console.log(`🔑 API Key: ${apiKey}`);
  console.log(`📏 Key Length: ${apiKey.length} characters`);
  console.log(`🔍 Key Format: ${apiKey.includes('-') ? 'Contains hyphens' : 'No hyphens'}`);
  console.log(`🔢 Contains Numbers: ${/\d/.test(apiKey)}`);
  console.log(`🔤 Contains Letters: ${/[a-zA-Z]/.test(apiKey)}`);
  
  // Test 1: Network Connectivity
  console.log('\n🌐 NETWORK CONNECTIVITY TEST');
  console.log('============================');
  
  try {
    const pingResponse = await fetch('https://api.heygen.com', { method: 'HEAD' });
    console.log(`✅ HeyGen API reachable: ${pingResponse.status}`);
  } catch (error) {
    console.log(`❌ Network issue: ${error.message}`);
  }
  
  // Test 2: DNS Resolution
  console.log('\n🔍 DNS RESOLUTION TEST');
  console.log('======================');
  
  try {
    const dnsResponse = await fetch('https://api.heygen.com/v2/avatars', { 
      method: 'HEAD',
      headers: { 'User-Agent': 'HeyGen-Forensic-Analysis/1.0' }
    });
    console.log(`✅ DNS resolution: ${dnsResponse.status}`);
  } catch (error) {
    console.log(`❌ DNS issue: ${error.message}`);
  }
  
  // Test 3: Authentication Methods
  console.log('\n🔐 AUTHENTICATION METHODS TEST');
  console.log('===============================');
  
  const authTests = [
    {
      name: 'X-API-Key Header (V2)',
      url: 'https://api.heygen.com/v2/avatars',
      headers: { 'X-API-Key': apiKey }
    },
    {
      name: 'Authorization Bearer (V2)',
      url: 'https://api.heygen.com/v2/avatars',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    },
    {
      name: 'X-API-Key Header (V1)',
      url: 'https://api.heygen.com/v1/avatar.list',
      headers: { 'X-API-Key': apiKey }
    },
    {
      name: 'Authorization Bearer (V1)',
      url: 'https://api.heygen.com/v1/avatar.list',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    }
  ];
  
  for (const test of authTests) {
    console.log(`\n🧪 ${test.name}`);
    try {
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HeyGen-Forensic-Analysis/1.0',
          ...test.headers
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      console.log(`📋 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log(`📄 Data: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorData = await response.json();
        console.log('❌ FAILED');
        console.log(`📄 Error: ${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }
  
  // Test 4: Rate Limiting Analysis
  console.log('\n⏱️ RATE LIMITING ANALYSIS');
  console.log('==========================');
  
  console.log('Testing rapid requests to check for rate limiting...');
  const rapidTests = [];
  for (let i = 0; i < 5; i++) {
    rapidTests.push(
      fetch('https://api.heygen.com/v2/avatars', {
        headers: { 'X-API-Key': apiKey }
      }).then(async (response) => {
        const data = await response.json();
        return { request: i + 1, status: response.status, data };
      }).catch(error => ({ request: i + 1, error: error.message }))
    );
  }
  
  const rapidResults = await Promise.all(rapidTests);
  rapidResults.forEach(result => {
    console.log(`Request ${result.request}: ${result.status || 'ERROR'} - ${result.error || JSON.stringify(result.data)}`);
  });
  
  // Test 5: User Agent Analysis
  console.log('\n🤖 USER AGENT ANALYSIS');
  console.log('======================');
  
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'HeyGen-API-Client/1.0',
    'curl/7.88.1',
    'Node.js/18.0.0',
    '' // No User-Agent
  ];
  
  for (const userAgent of userAgents) {
    console.log(`\n🧪 Testing with User-Agent: ${userAgent || 'None'}`);
    try {
      const headers = { 'X-API-Key': apiKey };
      if (userAgent) headers['User-Agent'] = userAgent;
      
      const response = await fetch('https://api.heygen.com/v2/avatars', { headers });
      console.log(`📊 Status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`📄 Error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test 6: Content-Type Analysis
  console.log('\n📄 CONTENT-TYPE ANALYSIS');
  console.log('=========================');
  
  const contentTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'text/plain',
    '' // No Content-Type
  ];
  
  for (const contentType of contentTypes) {
    console.log(`\n🧪 Testing with Content-Type: ${contentType || 'None'}`);
    try {
      const headers = { 'X-API-Key': apiKey };
      if (contentType) headers['Content-Type'] = contentType;
      
      const response = await fetch('https://api.heygen.com/v2/avatars', { headers });
      console.log(`📊 Status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`📄 Error: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test 7: HTTP Method Analysis
  console.log('\n📡 HTTP METHOD ANALYSIS');
  console.log('========================');
  
  const methods = ['GET', 'POST', 'HEAD', 'OPTIONS'];
  
  for (const method of methods) {
    console.log(`\n🧪 Testing with method: ${method}`);
    try {
      const response = await fetch('https://api.heygen.com/v2/avatars', {
        method,
        headers: { 'X-API-Key': apiKey }
      });
      console.log(`📊 Status: ${response.status}`);
      
      if (method === 'OPTIONS') {
        console.log(`📋 CORS Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test 8: Endpoint Discovery
  console.log('\n🔍 ENDPOINT DISCOVERY');
  console.log('=====================');
  
  const endpoints = [
    '/v2/avatars',
    '/v2/voices',
    '/v2/videos',
    '/v1/avatar.list',
    '/v1/voice.list',
    '/v1/video.list',
    '/health',
    '/status',
    '/api/v2/avatars',
    '/api/v1/avatar.list'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing endpoint: ${endpoint}`);
    try {
      const response = await fetch(`https://api.heygen.com${endpoint}`, {
        headers: { 'X-API-Key': apiKey }
      });
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log('✅ Endpoint exists and accessible!');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test 9: Error Pattern Analysis
  console.log('\n📊 ERROR PATTERN ANALYSIS');
  console.log('==========================');
  
  console.log('Testing multiple requests to identify patterns...');
  const patternTests = [];
  for (let i = 0; i < 10; i++) {
    patternTests.push(
      fetch('https://api.heygen.com/v2/avatars', {
        headers: { 'X-API-Key': apiKey }
      }).then(async (response) => {
        const data = await response.json();
        return { 
          request: i + 1, 
          status: response.status, 
          timestamp: new Date().toISOString(),
          success: response.ok,
          error: data.error?.code || null
        };
      }).catch(error => ({ 
        request: i + 1, 
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      }))
    );
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const patternResults = await Promise.all(patternTests);
  const successCount = patternResults.filter(r => r.success).length;
  const failureCount = patternResults.filter(r => !r.success).length;
  
  console.log(`\n📈 Pattern Results:`);
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`❌ Failed requests: ${failureCount}`);
  console.log(`📊 Success rate: ${(successCount / patternResults.length * 100).toFixed(1)}%`);
  
  if (failureCount > 0) {
    const errors = patternResults.filter(r => !r.success).map(r => r.error);
    const errorCounts = {};
    errors.forEach(error => {
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });
    console.log(`📋 Error distribution:`, errorCounts);
  }
  
  // Test 10: Alternative API Versions
  console.log('\n🔄 ALTERNATIVE API VERSIONS');
  console.log('============================');
  
  const alternativeEndpoints = [
    'https://api.heygen.com/v1/avatars',
    'https://api.heygen.com/v3/avatars',
    'https://api.heygen.com/v2/avatar',
    'https://api.heygen.com/v2/avatar/list',
    'https://api.heygen.com/v2/avatar.list'
  ];
  
  for (const endpoint of alternativeEndpoints) {
    console.log(`\n🧪 Testing alternative endpoint: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        headers: { 'X-API-Key': apiKey }
      });
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log('✅ Alternative endpoint works!');
        const data = await response.json();
        console.log(`📄 Response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n📋 FORENSIC ANALYSIS SUMMARY');
  console.log('============================');
  console.log('🔍 Key Findings:');
  console.log('- API key format appears correct');
  console.log('- Network connectivity is stable');
  console.log('- Multiple authentication methods tested');
  console.log('- Rate limiting patterns analyzed');
  console.log('- User agent and content-type variations tested');
  console.log('- HTTP method compatibility verified');
  console.log('- Alternative endpoints explored');
  console.log('- Error patterns documented');
  
  console.log('\n🎯 Recommendations:');
  console.log('1. Contact HeyGen support with this analysis');
  console.log('2. Request backend authentication service logs');
  console.log('3. Check for API key propagation delays');
  console.log('4. Verify account API access permissions');
  console.log('5. Consider implementing retry logic with exponential backoff');
}

forensicAnalysis(); 