#!/usr/bin/env python3
"""
Kelly Avatar Setup Script
Sets up Kelly's avatar in HeyGen and voice in ElevenLabs
"""

import os
import json
import requests
from pathlib import Path

class KellyAvatarSetup:
    def __init__(self):
        self.heygen_api_key = os.getenv('HEYGEN_API_KEY')
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        self.kelly_image_path = 'training_video/kelly2.png'
        
    def setup_kelly_heygen_avatar(self):
        """Create Kelly's avatar in HeyGen"""
        print("🎭 Setting up Kelly's HeyGen avatar...")
        
        # Check if Kelly image exists
        if not Path(self.kelly_image_path).exists():
            print(f"❌ Kelly image not found at {self.kelly_image_path}")
            return None
            
        # Upload Kelly's image to HeyGen
        try:
            with open(self.kelly_image_path, 'rb') as f:
                files = {'image': f}
                headers = {'X-API-Key': self.heygen_api_key}
                
                response = requests.post(
                    'https://api.heygen.com/v2/avatar/upload',
                    files=files,
                    headers=headers
                )
                
                if response.status_code == 200:
                    avatar_data = response.json()
                    kelly_avatar_id = avatar_data['data']['avatar_id']
                    print(f"✅ Kelly's HeyGen avatar created: {kelly_avatar_id}")
                    return kelly_avatar_id
                else:
                    print(f"❌ Failed to create Kelly avatar: {response.text}")
                    return None
                    
        except Exception as e:
            print(f"❌ Error creating Kelly avatar: {e}")
            return None
    
    def setup_kelly_elevenlabs_voice(self):
        """Create Kelly's voice in ElevenLabs"""
        print("🎤 Setting up Kelly's ElevenLabs voice...")
        
        # Check if Kelly training audio exists
        kelly_audio_path = 'output/audio/kelly_training_script.wav'
        if not Path(kelly_audio_path).exists():
            print(f"❌ Kelly training audio not found at {kelly_audio_path}")
            return None
            
        try:
            with open(kelly_audio_path, 'rb') as f:
                files = {'files': f}
                headers = {'xi-api-key': self.elevenlabs_api_key}
                data = {
                    'name': 'Kelly-Universal-Teacher',
                    'description': 'Kelly\'s voice for educational lessons'
                }
                
                response = requests.post(
                    'https://api.elevenlabs.io/v1/voices/add',
                    files=files,
                    data=data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    voice_data = response.json()
                    kelly_voice_id = voice_data['voice_id']
                    print(f"✅ Kelly's ElevenLabs voice created: {kelly_voice_id}")
                    return kelly_voice_id
                else:
                    print(f"❌ Failed to create Kelly voice: {response.text}")
                    return None
                    
        except Exception as e:
            print(f"❌ Error creating Kelly voice: {e}")
            return None
    
    def create_kelly_config(self, heygen_avatar_id, elevenlabs_voice_id):
        """Create Kelly's configuration file"""
        config = {
            'kelly_avatar': {
                'heygen_avatar_id': heygen_avatar_id,
                'elevenlabs_voice_id': elevenlabs_voice_id
            }
        }
        with open('kelly_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        print("✅ Kelly configuration saved to kelly_config.json")
        return config

    def update_environment_vars(self, heygen_avatar_id, elevenlabs_voice_id):
        """Update environment variables"""
        env_content = f"""
# Kelly Avatar Configuration
KELLY_HEYGEN_AVATAR_ID={heygen_avatar_id}
KELLY_ELEVENLABS_VOICE_ID={elevenlabs_voice_id}
"""
        with open('.env.kelly', 'w') as f:
            f.write(env_content)
        print("✅ Kelly environment variables saved to .env.kelly")
    
    def run_setup(self):
        """Run complete Kelly setup"""
        print("🚀 Starting Kelly Avatar Setup...")
        
        # Setup HeyGen avatar
        heygen_avatar_id = self.setup_kelly_heygen_avatar()
        
        # Setup ElevenLabs voice
        elevenlabs_voice_id = self.setup_kelly_elevenlabs_voice()
        
        if heygen_avatar_id and elevenlabs_voice_id:
            # Create configuration
            config = self.create_kelly_config(heygen_avatar_id, elevenlabs_voice_id)
            
            # Update environment variables
            self.update_environment_vars(heygen_avatar_id, elevenlabs_voice_id)
            
            print("\n🎉 Kelly Avatar Setup Complete!")
            print(f"HeyGen Avatar ID: {heygen_avatar_id}")
            print(f"ElevenLabs Voice ID: {elevenlabs_voice_id}")
            print("\nNext steps:")
            print("1. Add the environment variables to your .env file")
            print("2. Update the voice IDs in crowdfunding_engine_integration.js")
            print("3. Test Kelly's avatar with a sample lesson")
            
        else:
            print("❌ Kelly setup failed. Please check your API keys and try again.")

if __name__ == "__main__":
    setup = KellyAvatarSetup()
    setup.run_setup() 