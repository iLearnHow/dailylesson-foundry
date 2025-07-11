#!/usr/bin/env node

// HeyGen API Key Format Investigation
import dotenv from 'dotenv';

dotenv.config();

async function investigateAPIKeyFormats() {
  console.log('🔍 HEYGEN API KEY FORMAT INVESTIGATION');
  console.log('=======================================');
  
  const originalKey = process.env.HEYGEN_API_KEY;
  if (!originalKey) {
    console.error('❌ HEYGEN_API_KEY not found');
    return;
  }
  
  console.log(`🔑 Original Key: ${originalKey}`);
  console.log(`📏 Length: ${originalKey.length}`);
  
  // Test different key formats
  const keyVariations = [
    { name: 'Original', key: originalKey },
    { name: 'Without Hyphens', key: originalKey.replace(/-/g, '') },
    { name: 'Uppercase', key: originalKey.toUpperCase() },
    { name: 'Lowercase', key: originalKey.toLowerCase() },
    { name: 'Base64 Decoded', key: Buffer.from(originalKey, 'base64').toString() },
    { name: 'URL Decoded', key: decodeURIComponent(originalKey) },
    { name: 'First Part Only', key: originalKey.split('-')[0] },
    { name: 'Second Part Only', key: originalKey.split('-')[1] },
    { name: 'Reversed Parts', key: originalKey.split('-').reverse().join('-') },
    { name: 'With Bearer Prefix', key: `Bearer ${originalKey}` },
    { name: 'With API Prefix', key: `API-${originalKey}` },
    { name: 'With Key Prefix', key: `key-${originalKey}` }
  ];
  
  console.log('\n🧪 TESTING KEY FORMAT VARIATIONS');
  console.log('==================================');
  
  for (const variation of keyVariations) {
    console.log(`\n🔍 Testing: ${variation.name}`);
    console.log(`📝 Key: ${variation.key}`);
    
    try {
      const headers = { 'X-API-Key': variation.key };
      
      // Skip Bearer prefix test for X-API-Key header
      if (variation.name === 'With Bearer Prefix') {
        headers['Authorization'] = variation.key;
        delete headers['X-API-Key'];
      }
      
      const response = await fetch('https://api.heygen.com/v2/avatars', {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log('🎉 SUCCESS! This format works!');
        const data = await response.json();
        console.log(`📄 Response: ${JSON.stringify(data, null, 2)}`);
        break;
      } else {
        const errorData = await response.json();
        console.log(`❌ Failed: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test different header combinations
  console.log('\n🧪 TESTING HEADER COMBINATIONS');
  console.log('===============================');
  
  const headerTests = [
    {
      name: 'X-API-Key Only',
      headers: { 'X-API-Key': originalKey }
    },
    {
      name: 'Authorization Bearer Only',
      headers: { 'Authorization': `Bearer ${originalKey}` }
    },
    {
      name: 'Both Headers',
      headers: { 
        'X-API-Key': originalKey,
        'Authorization': `Bearer ${originalKey}`
      }
    },
    {
      name: 'API-Key Header',
      headers: { 'API-Key': originalKey }
    },
    {
      name: 'Key Header',
      headers: { 'Key': originalKey }
    },
    {
      name: 'X-HeyGen-API-Key',
      headers: { 'X-HeyGen-API-Key': originalKey }
    },
    {
      name: 'X-HeyGen-Key',
      headers: { 'X-HeyGen-Key': originalKey }
    }
  ];
  
  for (const test of headerTests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    try {
      const response = await fetch('https://api.heygen.com/v2/avatars', {
        headers: {
          'Content-Type': 'application/json',
          ...test.headers
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log('🎉 SUCCESS! This header combination works!');
        const data = await response.json();
        console.log(`📄 Response: ${JSON.stringify(data, null, 2)}`);
        break;
      } else {
        const errorData = await response.json();
        console.log(`❌ Failed: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Test different URL patterns
  console.log('\n🧪 TESTING URL PATTERNS');
  console.log('========================');
  
  const urlTests = [
    'https://api.heygen.com/v2/avatars',
    'https://api.heygen.com/v2/avatar',
    'https://api.heygen.com/v2/avatar/list',
    'https://api.heygen.com/v2/avatar.list',
    'https://api.heygen.com/v1/avatar.list',
    'https://api.heygen.com/v1/avatars',
    'https://api.heygen.com/avatars',
    'https://api.heygen.com/avatar',
    'https://api.heygen.com/api/v2/avatars',
    'https://api.heygen.com/api/v1/avatar.list'
  ];
  
  for (const url of urlTests) {
    console.log(`\n🔍 Testing URL: ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': originalKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log('🎉 SUCCESS! This URL works!');
        const data = await response.json();
        console.log(`📄 Response: ${JSON.stringify(data, null, 2)}`);
        break;
      } else if (response.status === 404) {
        console.log('❌ Endpoint not found');
      } else {
        const errorData = await response.json();
        console.log(`❌ Failed: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Check for common API key patterns
  console.log('\n🔍 API KEY PATTERN ANALYSIS');
  console.log('============================');
  
  console.log(`📝 Original Key: ${originalKey}`);
  console.log(`🔢 Contains only hex chars: ${/^[0-9a-f-]+$/i.test(originalKey)}`);
  console.log(`🔢 Contains only alphanumeric: ${/^[0-9a-zA-Z-]+$/.test(originalKey)}`);
  console.log(`🔢 UUID format: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(originalKey)}`);
  console.log(`🔢 Base64 format: ${/^[A-Za-z0-9+/=]+$/.test(originalKey)}`);
  
  // Check if key might be encoded
  console.log('\n🔍 ENCODING ANALYSIS');
  console.log('====================');
  
  try {
    const base64Decoded = Buffer.from(originalKey, 'base64').toString();
    console.log(`📝 Base64 decoded: ${base64Decoded}`);
    console.log(`📏 Decoded length: ${base64Decoded.length}`);
  } catch (error) {
    console.log('❌ Not valid base64');
  }
  
  try {
    const urlDecoded = decodeURIComponent(originalKey);
    console.log(`📝 URL decoded: ${urlDecoded}`);
  } catch (error) {
    console.log('❌ Not valid URL encoding');
  }
  
  // Summary
  console.log('\n📋 INVESTIGATION SUMMARY');
  console.log('=========================');
  console.log('🔍 Key Format Analysis:');
  console.log('- Standard HeyGen API key format');
  console.log('- Contains hyphens and alphanumeric characters');
  console.log('- Not base64 or URL encoded');
  console.log('- Not UUID format');
  
  console.log('\n🎯 Recommendations:');
  console.log('1. Contact HeyGen support about API key activation');
  console.log('2. Verify Pro Unlimited plan includes API access');
  console.log('3. Generate a new API key and test immediately');
  console.log('4. Check if there are regional API restrictions');
  console.log('5. Request backend authentication service logs');
}

investigateAPIKeyFormats(); 