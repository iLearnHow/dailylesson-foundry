#!/usr/bin/env python3
"""
Dual-Avatar Lesson Generation Script
Generates the negotiation lesson for both Kelly and Ken using config in kelly_config.json
"""

import os
import json
import requests
from pathlib import Path

class DualAvatarLessonGenerator:
    def __init__(self):
        self.heygen_api_key = os.getenv('HEYGEN_API_KEY')
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        self.config_path = 'kelly_config.json'
        self.output_dir = Path('output')
        self.output_dir.mkdir(exist_ok=True)
        self.lesson_topic = 'negotiation'
        self.tone = 'fun'
        self.age = 'adult'
        self.language = 'english'

    def load_config(self):
        with open(self.config_path, 'r') as f:
            return json.load(f)

    def generate_sample_lesson(self):
        # This would be replaced by your real lesson DNA loader
        return {
            'topic': self.lesson_topic,
            'tone': self.tone,
            'age': self.age,
            'language': self.language,
            'scripts': [
                {
                    'segment': 'opening',
                    'voice_text': "Welcome! Today we're going to have fun learning how to negotiate like a pro. Let's get started!",
                    'timing_notes': 'fun, energetic opening'
                },
                {
                    'segment': 'question_1',
                    'voice_text': "When you negotiate, is it better to start with your highest demand, your lowest, or something in the middle?",
                    'timing_notes': 'presenting choices'
                },
                {
                    'segment': 'question_1_feedback',
                    'voice_text': "Great thinking! The best negotiators know how to anchor the conversation in their favor.",
                    'timing_notes': 'positive reinforcement'
                },
                {
                    'segment': 'fortune',
                    'voice_text': "Your daily fortune: Every negotiation is a chance to build a bridge, not a wall.",
                    'timing_notes': 'fortune delivery'
                }
            ]
        }

    def generate_video_segments_tts(self, lesson, avatar_id, avatar_name):
        print(f"\n🎭 Generating video for {avatar_name} (HeyGen TTS)...")
        video_segments = []
        for i, script in enumerate(lesson['scripts']):
            print(f"  Generating video for segment {i+1}: {script['segment']}")
            try:
                headers = {
                    'X-API-Key': self.heygen_api_key,
                    'Content-Type': 'application/json'
                }
                if avatar_name == 'ken':
                    data = {
                        'video_inputs': [{
                            'character': {
                                'type': 'avatar',
                                'avatar_id': '3b21add7fc3a4bfc81c59281340c4c16',
                                'avatar_style': 'normal'
                            },
                            'voice': {
                                'type': 'text',
                                'input_text': script['voice_text'],
                                'voice_id': 'bd9428b49722494bb4def9b1a8292c9a',
                                'speed': 1.0
                            },
                            'background': {
                                'type': 'color',
                                'value': '#f0f8ff'
                            }
                        }],
                        'dimension': { 'width': 1920, 'height': 1080 },
                        'aspect_ratio': '16:9',
                        'test': False
                    }
                else:
                    data = {
                        'video_inputs': [{
                            'character': {
                                'type': 'talking_photo',
                                'talking_photo_id': avatar_id
                            },
                            'voice': {
                                'type': 'text',
                                'input_text': script['voice_text']
                            }
                        }],
                        'aspect_ratio': '16:9',
                        'background': f'{avatar_name}_educational_background'
                    }
                response = requests.post(
                    'https://api.heygen.com/v2/video/generate',
                    headers=headers,
                    json=data
                )
                if response.status_code == 200:
                    video_data = response.json()
                    video_id = video_data['data']['video_id']
                    video_segments.append({
                        'segment': script['segment'],
                        'video_id': video_id,
                        'text': script['voice_text']
                    })
                    print(f"    ✅ Video job created: {video_id}")
                else:
                    print(f"    ❌ Video generation failed: {response.text}")
            except Exception as e:
                print(f"    ❌ Error: {e}")
        return video_segments

    def generate_for_avatar(self, avatar_key, avatar_config):
        avatar_id = avatar_config['avatar_id']
        avatar_name = avatar_key
        lesson = self.generate_sample_lesson()
        video_segments = self.generate_video_segments_tts(lesson, avatar_id, avatar_name)
        lesson_data = {
            'lesson': lesson,
            'video_segments': video_segments,
            'generated_at': str(Path().cwd()),
            'avatar_used': avatar_name
        }
        output_json = self.output_dir / f"negotiation_{self.tone}_{self.age}_{self.language}_{avatar_name}.json"
        with open(output_json, 'w') as f:
            json.dump(lesson_data, f, indent=2)
        print(f"\n🎉 {avatar_name.capitalize()} lesson generation complete!")
        print(f"Lesson data saved to: {output_json}")

    def run_generation(self):
        config = self.load_config()
        for avatar_key, avatar_config in config.items():
            self.generate_for_avatar(avatar_key, avatar_config)
        print("\n✅ Dual avatar lesson generation complete! Both versions are ready for deployment.")

if __name__ == "__main__":
    generator = DualAvatarLessonGenerator()
    generator.run_generation() 