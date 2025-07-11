import React from 'react';
import Link from 'next/link';
import { BookOpen, Brain, Zap, Settings, User, Users } from 'lucide-react';

export default function LessonGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Universal Lesson Generator
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Create personalized educational content with real curriculum data
          </p>
          <p className="text-gray-500">
            3x2x1 Format • DNA-Powered • Age & Tone Adaptation • Avatar Integration
          </p>
        </div>

        {/* Generator Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Basic Interface */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Basic Interface</h2>
              <p className="text-gray-600">Simple lesson generation with real curriculum content</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                Kelly & Ken avatar switching
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Settings className="w-4 h-4 mr-2" />
                Age, tone, and language controls
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Zap className="w-4 h-4 mr-2" />
                3x2x1 lesson format
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BookOpen className="w-4 h-4 mr-2" />
                Real curriculum integration
              </div>
            </div>
            
            <Link href="/universal-lesson">
              <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Launch Basic Interface
              </button>
            </Link>
          </div>

          {/* Advanced Interface */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Advanced Generator</h2>
              <p className="text-gray-600">DNA-powered lesson generation with full adaptation</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Brain className="w-4 h-4 mr-2" />
                DNA-based content adaptation
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                Multi-age group support
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Zap className="w-4 h-4 mr-2" />
                Tone delivery DNA
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <BookOpen className="w-4 h-4 mr-2" />
                Complete curriculum integration
              </div>
            </div>
            
            <Link href="/advanced-lesson">
              <button className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Launch Advanced Generator
              </button>
            </Link>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">System Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Real Curriculum</h3>
              <p className="text-sm text-gray-600">
                Uses actual daily lesson topics from the approved 365-day curriculum
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">DNA System</h3>
              <p className="text-sm text-gray-600">
                Age-appropriate content adaptation using proven DNA templates
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Avatar Integration</h3>
              <p className="text-sm text-gray-600">
                Kelly and Ken avatar switching with tone-appropriate delivery
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500">
          <p>Universal Lesson System • Powered by Real Curriculum Data</p>
          <p className="text-sm mt-1">
            No placeholder content • Real learning objectives • DNA-powered adaptation
          </p>
        </div>
      </div>
    </div>
  );
} 