// apps/cms/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { LessonDNAEditor } from './components/LessonDNAEditor';
import { LessonLibrary } from './components/LessonLibrary';
import { VideoGeneration } from './components/VideoGeneration';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading CMS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <main className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<Navigate to="/lessons" replace />} />
          <Route path="/lessons" element={<LessonLibrary />} />
          <Route path="/lessons/new" element={<LessonDNAEditor />} />
          <Route path="/lessons/:id/edit" element={<LessonDNAEditor />} />
          <Route path="/video-generation" element={<VideoGeneration />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

// apps/cms/src/components/LessonDNAEditor.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, Play, Settings, Globe, Users, Brain } from 'lucide-react';
import { LessonDNAForm } from './LessonDNAForm';
import { LessonPreview } from './LessonPreview';
import { CMSApi } from '../services/cmsApi';

interface LessonDNA {
  lesson_id: string;
  day: number;
  date: string;
  universal_concept: string;
  core_principle: string;
  learning_essence: string;
  age_expressions: Record<string, any>;
  tone_delivery_dna: Record<string, any>;
  core_lesson_structure: Record<string, any>;
  example_selector_data: Record<string, any>;
  daily_fortune_elements: Record<string, any>;
  language_adaptation_framework: Record<string, any>;
  quality_validation_targets: Record<string, any>;
}

export function LessonDNAEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lessonDNA, setLessonDNA] = useState<LessonDNA | null>(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [previewSettings, setPreviewSettings] = useState({
    age: 25,
    tone: 'neutral',
    language: 'english'
  });

  const api = new CMSApi();

  useEffect(() => {
    if (id && id !== 'new') {
      loadLessonDNA(id);
    } else {
      // Initialize new lesson DNA
      setLessonDNA(createEmptyLessonDNA());
    }
  }, [id]);

  const loadLessonDNA = async (lessonId: string) => {
    try {
      const data = await api.getLessonDNA(lessonId);
      setLessonDNA(data);
    } catch (error) {
      console.error('Failed to load lesson DNA:', error);
    }
  };

  const createEmptyLessonDNA = (): LessonDNA => ({
    lesson_id: `lesson_${Date.now()}`,
    day: 1,
    date: new Date().toLocaleDateString(),
    universal_concept: '',
    core_principle: '',
    learning_essence: '',
    age_expressions: {
      early_childhood: {
        concept_name: '',
        core_metaphor: '',
        complexity_level: 'concrete_actions_and_feelings',
        attention_span: '3-4_minutes',
        cognitive_focus: '',
        examples: [],
        vocabulary: [],
        abstract_concepts: {}
      },
      youth: {
        concept_name: '',
        core_metaphor: '',
        complexity_level: 'social_scenarios_and_relationships',
        attention_span: '5-6_minutes',
        cognitive_focus: '',
        examples: [],
        vocabulary: [],
        abstract_concepts: {}
      },
      young_adult: {
        concept_name: '',
        core_metaphor: '',
        complexity_level: 'systems_thinking_and_application',
        attention_span: '6_minutes',
        cognitive_focus: '',
        examples: [],
        vocabulary: [],
        abstract_concepts: {}
      },
      midlife: {
        concept_name: '',
        core_metaphor: '',
        complexity_level: 'leadership_and_mentoring',
        attention_span: '6_minutes',
        cognitive_focus: '',
        examples: [],
        vocabulary: [],
        abstract_concepts: {}
      },
      wisdom_years: {
        concept_name: '',
        core_metaphor: '',
        complexity_level: 'wisdom_integration_and_legacy',
        attention_span: '6_minutes',
        cognitive_focus: '',
        examples: [],
        vocabulary: [],
        abstract_concepts: {}
      }
    },
    tone_delivery_dna: {
      grandmother: {
        voice_character: '',
        emotional_temperature: 'warm_patient_nurturing',
        language_patterns: {
          openings: [],
          transitions: [],
          encouragements: [],
          closings: []
        },
        metaphor_style: '',
        question_approach: '',
        validation_style: ''
      },
      fun: {
        voice_character: '',
        emotional_temperature: 'high_energy_celebratory_playful',
        language_patterns: {
          openings: [],
          transitions: [],
          encouragements: [],
          closings: []
        },
        metaphor_style: '',
        question_approach: '',
        validation_style: ''
      },
      neutral: {
        voice_character: '',
        emotional_temperature: 'calm_confident_respectful',
        language_patterns: {
          openings: [],
          transitions: [],
          encouragements: [],
          closings: []
        },
        metaphor_style: '',
        question_approach: '',
        validation_style: ''
      }
    },
    core_lesson_structure: {
      question_1: {
        concept_focus: '',
        universal_principle: '',
        cognitive_target: '',
        choice_architecture: {
          option_a: '',
          option_b: ''
        },
        teaching_moments: {
          option_a_response: '',
          option_b_response: ''
        }
      },
      question_2: {
        concept_focus: '',
        universal_principle: '',
        cognitive_target: '',
        choice_architecture: {
          option_a: '',
          option_b: ''
        },
        teaching_moments: {
          option_a_response: '',
          option_b_response: ''
        }
      },
      question_3: {
        concept_focus: '',
        universal_principle: '',
        cognitive_target: '',
        choice_architecture: {
          option_a: '',
          option_b: ''
        },
        teaching_moments: {
          option_a_response: '',
          option_b_response: ''
        }
      }
    },
    example_selector_data: {},
    daily_fortune_elements: {
      core_identity_shift: '',
      skill_celebration: '',
      relationship_impact: '',
      universal_connection: ''
    },
    language_adaptation_framework: {},
    quality_validation_targets: {}
  });

  const handleSave = async () => {
    if (!lessonDNA) return;
    
    setIsSaving(true);
    try {
      if (id === 'new') {
        await api.createLessonDNA(lessonDNA);
        navigate(`/lessons/${lessonDNA.lesson_id}/edit`);
      } else {
        await api.updateLessonDNA(lessonDNA.lesson_id, lessonDNA);
      }
    } catch (error) {
      console.error('Failed to save lesson DNA:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateLesson = async () => {
    if (!lessonDNA) return;
    
    try {
      const lesson = await api.generateLesson(lessonDNA.lesson_id, previewSettings);
      console.log('Generated lesson:', lesson);
    } catch (error) {
      console.error('Failed to generate lesson:', error);
    }
  };

  if (!lessonDNA) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {id === 'new' ? 'Create New Lesson DNA' : 'Edit Lesson DNA'}
            </h1>
            <p className="text-gray-400">
              {lessonDNA.lesson_id} • Day {lessonDNA.day}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? 'Saving...' : 'Save DNA'}
            </button>
            
            <button
              onClick={handleGenerateLesson}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-colors"
            >
              <Play size={20} />
              Generate Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg mb-8">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'editor' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings size={18} />
            DNA Editor
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'preview' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye size={18} />
            Live Preview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'analytics' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Brain size={18} />
            Quality Analytics
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'editor' && (
        <LessonDNAForm 
          lessonDNA={lessonDNA} 
          onChange={setLessonDNA}
        />
      )}
      
      {activeTab === 'preview' && (
        <LessonPreview 
          lessonDNA={lessonDNA}
          settings={previewSettings}
          onSettingsChange={setPreviewSettings}
        />
      )}
      
      {activeTab === 'analytics' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quality Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Age Appropriateness</h3>
              <div className="text-3xl font-bold text-green-400">94%</div>
              <p className="text-gray-400 text-sm">Vocabulary & complexity aligned</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Cultural Sensitivity</h3>
              <div className="text-3xl font-bold text-blue-400">89%</div>
              <p className="text-gray-400 text-sm">Inclusive across cultures</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Educational Integrity</h3>
              <div className="text-3xl font-bold text-purple-400">92%</div>
              <p className="text-gray-400 text-sm">Learning objectives met</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// apps/cms/src/components/LessonDNAForm.tsx
import React from 'react';
import { AgeExpressionEditor } from './AgeExpressionEditor';
import { ToneDeliveryEditor } from './ToneDeliveryEditor';
import { LessonStructureEditor } from './LessonStructureEditor';

interface LessonDNAFormProps {
  lessonDNA: any;
  onChange: (lessonDNA: any) => void;
}

export function LessonDNAForm({ lessonDNA, onChange }: LessonDNAFormProps) {
  const [activeSection, setActiveSection] = React.useState('basics');

  const updateLessonDNA = (path: string, value: any) => {
    const pathArray = path.split('.');
    const updated = { ...lessonDNA };
    let current = updated;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    onChange(updated);
  };

  const sections = [
    { id: 'basics', name: 'Basic Info', icon: '📝' },
    { id: 'ages', name: 'Age Expressions', icon: '👥' },
    { id: 'tones', name: 'Tone Delivery', icon: '🎭' },
    { id: 'structure', name: 'Lesson Structure', icon: '🏗️' },
    { id: 'examples', name: 'Examples', icon: '💡' },
    { id: 'language', name: 'Language & Culture', icon: '🌍' }
  ];

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Sidebar Navigation */}
      <div className="col-span-3">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4">DNA Sections</h3>
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-9">
        <div className="bg-gray-800 rounded-lg p-6">
          {activeSection === 'basics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Basic Information</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lesson ID
                  </label>
                  <input
                    type="text"
                    value={lessonDNA.lesson_id}
                    onChange={(e) => updateLessonDNA('lesson_id', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Day Number
                  </label>
                  <input
                    type="number"
                    value={lessonDNA.day}
                    onChange={(e) => updateLessonDNA('day', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Universal Concept
                </label>
                <input
                  type="text"
                  value={lessonDNA.universal_concept}
                  onChange={(e) => updateLessonDNA('universal_concept', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., collaborative_problem_solving_through_understanding"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Core Principle
                </label>
                <textarea
                  value={lessonDNA.core_principle}
                  onChange={(e) => updateLessonDNA('core_principle', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="The fundamental truth this lesson teaches..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Learning Essence
                </label>
                <textarea
                  value={lessonDNA.learning_essence}
                  onChange={(e) => updateLessonDNA('learning_essence', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="What the learner will understand and be able to do..."
                />
              </div>
            </div>
          )}

          {activeSection === 'ages' && (
            <AgeExpressionEditor 
              ageExpressions={lessonDNA.age_expressions}
              onChange={(ageExpressions) => updateLessonDNA('age_expressions', ageExpressions)}
            />
          )}

          {activeSection === 'tones' && (
            <ToneDeliveryEditor 
              toneDeliveryDNA={lessonDNA.tone_delivery_dna}
              onChange={(toneDeliveryDNA) => updateLessonDNA('tone_delivery_dna', toneDeliveryDNA)}
            />
          )}

          {activeSection === 'structure' && (
            <LessonStructureEditor 
              lessonStructure={lessonDNA.core_lesson_structure}
              onChange={(lessonStructure) => updateLessonDNA('core_lesson_structure', lessonStructure)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// apps/cms/src/services/cmsApi.ts
export class CMSApi {
  private baseUrl = process.env.REACT_APP_API_URL || 'https://api.ilearn.how/v1';
  private apiKey = process.env.REACT_APP_CMS_API_KEY!;

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getLessonDNA(lessonId: string) {
    return this.request(`/cms/lesson-dna/${lessonId}`);
  }

  async createLessonDNA(lessonDNA: any) {
    return this.request('/cms/lesson-dna', {
      method: 'POST',
      body: JSON.stringify(lessonDNA),
    });
  }

  async updateLessonDNA(lessonId: string, lessonDNA: any) {
    return this.request(`/cms/lesson-dna/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(lessonDNA),
    });
  }

  async generateLesson(lessonId: string, settings: { age: number; tone: string; language: string }) {
    return this.request('/cms/generate-lesson', {
      method: 'POST',
      body: JSON.stringify({
        lesson_id: lessonId,
        ...settings,
      }),
    });
  }

  async getLessonLibrary(filters?: any) {
    const params = new URLSearchParams(filters);
    return this.request(`/cms/lesson-library?${params}`);
  }

  async generateVideos(lessonId: string, variations: Array<{ age: number; tone: string; language: string }>) {
    return this.request('/cms/generate-videos', {
      method: 'POST',
      body: JSON.stringify({
        lesson_id: lessonId,
        variations,
      }),
    });
  }
}