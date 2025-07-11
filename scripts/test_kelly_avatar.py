#!/usr/bin/env python3
"""
Kelly Avatar Test Script
Tests Kelly's avatar and voice with a sample lesson
"""

import os
import json
import requests
from pathlib import Path

class KellyAvatarTest:
    def __init__(self):
        self.heygen_api_key = os.getenv('HEYGEN_API_KEY')
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        self.kelly_config_path = 'kelly_config.json'
        
    def load_kelly_config(self):
        """Load Kelly's configuration"""
        if not Path(self.kelly_config_path).exists():
            print(f"❌ Kelly config not found at {self.kelly_config_path}")
            print("Please run setup_kelly_avatar.py first")
            return None
            
        with open(self.kelly_config_path, 'r') as f:
            return json.load(f)
    
    def test_kelly_voice(self, voice_id):
        """Test Kelly's voice with a sample text"""
        print("🎤 Testing Kelly's voice...")
        
        sample_text = "Hello! I'm Kelly, your universal teacher. Today we're going to explore something amazing together."
        
        try:
            headers = {
                'xi-api-key': self.elevenlabs_api_key,
                'Content-Type': 'application/json'
            }
            
            data = {
                'text': sample_text,
                'model_id': 'eleven_monolingual_v1',
                'voice_settings': {
                    'stability': 0.75,
                    'similarity_boost': 0.85,
                    'style': 0.60,
                    'use_speaker_boost': True
                }
            }
            
            response = requests.post(
                f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                # Save test audio
                with open('test_kelly_voice.wav', 'wb') as f:
                    f.write(response.content)
                print("✅ Kelly's voice test successful - saved as test_kelly_voice.wav")
                return True
            else:
                print(f"❌ Kelly voice test failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing Kelly voice: {e}")
            return False
    
    def test_kelly_avatar(self, avatar_id):
        """Test Kelly's avatar with a sample video"""
        print("🎭 Testing Kelly's avatar...")
        
        sample_script = "Hello! I'm Kelly, your universal teacher. Today we're going to explore something amazing together."
        
        try:
            headers = {
                'X-API-Key': self.heygen_api_key,
                'Content-Type': 'application/json'
            }
            
            data = {
                'video_inputs': [{
                    'character': {
                        'type': 'avatar',
                        'avatar_id': avatar_id
                    },
                    'voice': {
                        'type': 'text',
                        'input_text': sample_script
                    }
                }],
                'test': True,
                'aspect_ratio': '16:9'
            }
            
            response = requests.post(
                'https://api.heygen.com/v2/video/generate',
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                video_data = response.json()
                video_id = video_data['data']['video_id']
                print(f"✅ Kelly's avatar test successful - video ID: {video_id}")
                
                # Poll for completion
                self.poll_video_completion(video_id)
                return True
            else:
                print(f"❌ Kelly avatar test failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing Kelly avatar: {e}")
            return False
    
    def poll_video_completion(self, video_id):
        """Poll for video completion"""
        print(f"⏳ Polling for video completion: {video_id}")
        
        headers = {'X-API-Key': self.heygen_api_key}
        
        for i in range(30):  # Poll for up to 5 minutes
            response = requests.get(
                f'https://api.heygen.com/v2/video/{video_id}',
                headers=headers
            )
            
            if response.status_code == 200:
                video_data = response.json()
                status = video_data['data']['status']
                
                if status == 'completed':
                    video_url = video_data['data']['video_url']
                    print(f"✅ Video completed: {video_url}")
                    return video_url
                elif status == 'failed':
                    print("❌ Video generation failed")
                    return None
                else:
                    print(f"⏳ Video status: {status}")
                    
            import time
            time.sleep(10)  # Wait 10 seconds between polls
            
        print("❌ Video polling timeout")
        return None
    
    def test_full_pipeline(self):
        """Test the full Kelly pipeline with a sample lesson"""
        print("🚀 Testing full Kelly pipeline...")
        
        config = self.load_kelly_config()
        if not config:
            return False
            
        kelly_config = config['kelly_avatar']
        voice_id = kelly_config['elevenlabs_voice_id']
        avatar_id = kelly_config['heygen_avatar_id']
        
        # Test voice
        voice_success = self.test_kelly_voice(voice_id)
        
        # Test avatar
        avatar_success = self.test_kelly_avatar(avatar_id)
        
        if voice_success and avatar_success:
            print("\n🎉 Full Kelly pipeline test successful!")
            print("Kelly is ready for production use.")
            return True
        else:
            print("\n❌ Kelly pipeline test failed.")
            return False
    
    def run_test(self):
        """Run complete Kelly test"""
        print("🧪 Starting Kelly Avatar Test...")
        
        success = self.test_full_pipeline()
        
        if success:
            print("\n✅ Kelly is fully operational!")
            print("You can now use Kelly in your lesson pipeline.")
        else:
            print("\n❌ Kelly test failed. Please check your setup.")

if __name__ == "__main__":
    test = KellyAvatarTest()
    test.run_test() 