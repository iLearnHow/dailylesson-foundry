#!/usr/bin/env node

// Test script for HeyGen to R2 pipeline
import HeyGenVideoPipeline from './heygen_r2_pipeline.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPipeline() {
  console.log('🧪 Testing HeyGen to R2 Pipeline...');
  
  // Check required environment variables
  const requiredEnvVars = [
    'HEYGEN_API_KEY',
    'R2_ACCOUNT_ID', 
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded');
  
  // Initialize pipeline
  const pipeline = new HeyGenVideoPipeline({
    heygenApiKey: process.env.HEYGEN_API_KEY,
    maxConcurrent: 2, // Conservative for testing
    retryAttempts: 2,
    retryDelay: 3000,
    pollInterval: 15000, // Faster polling for testing
    stateFile: './test_pipeline_state.json',
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKey: process.env.R2_ACCESS_KEY_ID,
    r2SecretKey: process.env.R2_SECRET_ACCESS_KEY,
    r2Bucket: process.env.R2_BUCKET
  });

  // Test lessons with Kelly and Ken
  const testLessons = [
    {
      id: 'test_kelly_001',
      avatar: 'kelly',
      script: 'Hello! I\'m Kelly, your universal teacher. This is a test of our video pipeline.',
      title: 'Kelly Test Lesson'
    },
    {
      id: 'test_ken_001',
      avatar: 'ken', 
      script: 'Welcome! I\'m Ken, and this is a test of our video generation system.',
      title: 'Ken Test Lesson'
    }
  ];

  try {
    console.log('🚀 Starting test pipeline...');
    console.log(`Testing ${testLessons.length} lessons (Kelly + Ken)`);
    
    const results = await pipeline.processLessons(testLessons);
    
    console.log('\n📋 Test Results:');
    console.log('================');
    
    let successCount = 0;
    let failureCount = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        console.log(`✅ ${testLessons[index].id}: SUCCESS`);
        successCount++;
      } else {
        console.log(`❌ ${testLessons[index].id}: FAILED`);
        if (result.reason) {
          console.log(`   Error: ${result.reason.message}`);
        }
        failureCount++;
      }
    });
    
    console.log(`\n🎯 Test Summary: ${successCount} successful, ${failureCount} failed`);
    
    if (successCount > 0) {
      console.log('🎉 Pipeline test successful! Videos should now be available in R2.');
      console.log('Check your R2 bucket for the generated videos.');
    } else {
      console.log('❌ Pipeline test failed. Check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Pipeline test crashed:', error);
    process.exit(1);
  }
}

// Run the test
testPipeline().catch(console.error); 