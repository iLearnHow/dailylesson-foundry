#!/usr/bin/env node

// Alternative AI Video Generation Services Check
import dotenv from 'dotenv';

dotenv.config();

async function checkAlternativeServices() {
  console.log('🔍 ALTERNATIVE AI VIDEO GENERATION SERVICES');
  console.log('============================================');
  
  const services = [
    {
      name: 'RunwayML',
      url: 'https://api.runwayml.com/v1',
      status: 'check',
      pricing: '$0.05-0.20 per second',
      features: ['Text-to-video', 'Image-to-video', 'Video editing'],
      apiDocs: 'https://docs.runwayml.com/'
    },
    {
      name: 'Synthesia',
      url: 'https://api.synthesia.io/v2',
      status: 'check',
      pricing: '$30/month for 10 videos',
      features: ['AI avatars', 'Text-to-speech', 'Custom avatars'],
      apiDocs: 'https://docs.synthesia.io/'
    },
    {
      name: 'D-ID',
      url: 'https://api.d-id.com',
      status: 'check',
      pricing: '$5.99/month for 20 videos',
      features: ['Talking photos', 'AI avatars', 'Video generation'],
      apiDocs: 'https://docs.d-id.com/'
    },
    {
      name: 'Pictory',
      url: 'https://api.pictory.ai',
      status: 'check',
      pricing: '$19/month',
      features: ['Video creation', 'Text-to-video', 'Templates'],
      apiDocs: 'https://pictory.ai/api'
    },
    {
      name: 'Lumen5',
      url: 'https://api.lumen5.com',
      status: 'check',
      pricing: '$19/month',
      features: ['Video creation', 'Branding', 'Templates'],
      apiDocs: 'https://lumen5.com/api'
    },
    {
      name: 'InVideo',
      url: 'https://api.invideo.io',
      status: 'check',
      pricing: '$15/month',
      features: ['Video creation', 'Templates', 'Branding'],
      apiDocs: 'https://invideo.io/api'
    },
    {
      name: 'Kapwing',
      url: 'https://api.kapwing.com',
      status: 'check',
      pricing: '$20/month',
      features: ['Video editing', 'Collaboration', 'Templates'],
      apiDocs: 'https://kapwing.com/api'
    },
    {
      name: 'FlexClip',
      url: 'https://api.flexclip.com',
      status: 'check',
      pricing: '$9.99/month',
      features: ['Video creation', 'Templates', 'Stock media'],
      apiDocs: 'https://flexclip.com/api'
    }
  ];
  
  console.log('\n📊 SERVICE COMPARISON');
  console.log('=====================');
  
  for (const service of services) {
    console.log(`\n🔍 ${service.name}`);
    console.log(`💰 Pricing: ${service.pricing}`);
    console.log(`✨ Features: ${service.features.join(', ')}`);
    console.log(`📚 API Docs: ${service.apiDocs}`);
    
    // Try to check if the service is reachable
    try {
      const response = await fetch(service.url, { 
        method: 'HEAD',
        timeout: 5000
      });
      console.log(`🌐 Status: ${response.status} (reachable)`);
    } catch (error) {
      console.log(`🌐 Status: Unreachable (${error.message})`);
    }
  }
  
  // Check specific services that might be good alternatives
  console.log('\n🎯 RECOMMENDED ALTERNATIVES FOR HEYGEN');
  console.log('=======================================');
  
  const recommendations = [
    {
      name: 'Synthesia',
      reason: 'Most similar to HeyGen - AI avatars with text-to-speech',
      pros: ['Similar avatar-based approach', 'Good API documentation', 'Reliable service'],
      cons: ['Higher pricing', 'Limited customization'],
      migration: 'Medium effort - similar API structure'
    },
    {
      name: 'D-ID',
      reason: 'Talking photos and AI avatars - very similar to HeyGen',
      pros: ['Talking photos feature', 'Good pricing', 'Simple API'],
      cons: ['Less avatar variety', 'Basic features'],
      migration: 'Low effort - very similar to HeyGen'
    },
    {
      name: 'RunwayML',
      reason: 'Advanced video generation with more creative control',
      pros: ['High quality output', 'Advanced features', 'Creative control'],
      cons: ['Higher pricing', 'More complex API', 'Different approach'],
      migration: 'High effort - different API structure'
    }
  ];
  
  for (const rec of recommendations) {
    console.log(`\n🎯 ${rec.name}`);
    console.log(`📝 Reason: ${rec.reason}`);
    console.log(`✅ Pros: ${rec.pros.join(', ')}`);
    console.log(`❌ Cons: ${rec.cons.join(', ')}`);
    console.log(`🔄 Migration: ${rec.migration}`);
  }
  
  // Quick API test for D-ID (free tier available)
  console.log('\n🧪 QUICK D-ID API TEST');
  console.log('======================');
  
  try {
    const didResponse = await fetch('https://api.d-id.com/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 D-ID Health Check: ${didResponse.status}`);
    
    if (didResponse.ok) {
      const healthData = await didResponse.json();
      console.log(`📄 Health Data: ${JSON.stringify(healthData, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ D-ID Test Failed: ${error.message}`);
  }
  
  // Quick API test for Synthesia
  console.log('\n🧪 QUICK SYNTHESIA API TEST');
  console.log('============================');
  
  try {
    const synthResponse = await fetch('https://api.synthesia.io/v2/avatars', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Synthesia Avatars: ${synthResponse.status}`);
    
    if (synthResponse.status === 401) {
      console.log('✅ API endpoint exists (requires authentication)');
    } else if (synthResponse.ok) {
      console.log('✅ API accessible without authentication');
    }
  } catch (error) {
    console.log(`❌ Synthesia Test Failed: ${error.message}`);
  }
  
  // Implementation recommendations
  console.log('\n📋 IMPLEMENTATION RECOMMENDATIONS');
  console.log('==================================');
  
  console.log('\n1. 🚀 IMMEDIATE FALLBACK (D-ID)');
  console.log('   - Sign up for free D-ID account');
  console.log('   - Test with their talking photos API');
  console.log('   - Similar to HeyGen talking_photo feature');
  console.log('   - Low migration effort');
  
  console.log('\n2. 🔄 MEDIUM-TERM ALTERNATIVE (Synthesia)');
  console.log('   - Sign up for Synthesia Pro plan');
  console.log('   - Test their avatar-based video generation');
  console.log('   - Most similar to HeyGen approach');
  console.log('   - Medium migration effort');
  
  console.log('\n3. 🎨 LONG-TERM SOLUTION (RunwayML)');
  console.log('   - Consider for advanced video generation');
  console.log('   - Higher quality but different approach');
  console.log('   - High migration effort but more creative control');
  
  console.log('\n4. 🔧 HYBRID APPROACH');
  console.log('   - Use D-ID for talking photos');
  console.log('   - Use Synthesia for avatar videos');
  console.log('   - Use RunwayML for advanced editing');
  console.log('   - Implement service selection based on requirements');
  
  // Cost comparison
  console.log('\n💰 COST COMPARISON');
  console.log('==================');
  
  const costComparison = [
    { service: 'HeyGen Pro Unlimited', cost: '$29/month', credits: 'Unlimited' },
    { service: 'D-ID', cost: '$5.99/month', credits: '20 videos' },
    { service: 'Synthesia', cost: '$30/month', credits: '10 videos' },
    { service: 'RunwayML', cost: '$0.05-0.20/sec', credits: 'Per second' }
  ];
  
  costComparison.forEach(item => {
    console.log(`💵 ${item.service}: ${item.cost} (${item.credits})`);
  });
  
  console.log('\n🎯 NEXT STEPS');
  console.log('==============');
  console.log('1. Contact HeyGen support with forensic report');
  console.log('2. Sign up for D-ID free trial as immediate fallback');
  console.log('3. Test D-ID API with talking photos feature');
  console.log('4. Consider Synthesia for avatar-based videos');
  console.log('5. Implement service selection logic in pipeline');
  console.log('6. Monitor HeyGen support response');
}

checkAlternativeServices(); 