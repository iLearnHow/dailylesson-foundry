-- database/migrations/001_initial_schema.sql
-- Complete iLearn.how Database Schema for Production

-- Core lessons table with enhanced structure
CREATE TABLE IF NOT EXISTS lessons (
    lesson_id TEXT PRIMARY KEY,
    metadata TEXT NOT NULL, -- JSON blob with lesson metadata
    scripts TEXT NOT NULL,  -- JSON blob with script segments
    audio_url TEXT,         -- URL to generated audio file
    video_url TEXT,         -- URL to generated video file
    video_segments TEXT,    -- JSON array of individual video segments
    thumbnail_url TEXT,     -- URL to lesson thumbnail
    production_notes TEXT,  -- JSON blob with production metadata
    status TEXT DEFAULT 'generating', -- generating, ready, failed, archived
    quality_score REAL DEFAULT 0.0,
    engagement_score REAL DEFAULT 0.0,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- Extracted fields for better querying
    day_of_year INTEGER,
    age_target INTEGER,
    tone TEXT,
    language TEXT,
    complexity_level TEXT,
    category TEXT,
    
    -- Indexes for performance
    FOREIGN KEY (day_of_year) REFERENCES daily_topics(day_of_year)
);

-- Lesson DNA storage for CMS
CREATE TABLE IF NOT EXISTS lesson_dna (
    lesson_id TEXT PRIMARY KEY,
    dna_content TEXT NOT NULL, -- Complete JSON DNA structure
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- DNA validation scores
    age_appropriateness_score REAL DEFAULT 0.0,
    cultural_sensitivity_score REAL DEFAULT 0.0,
    educational_integrity_score REAL DEFAULT 0.0
);

-- API keys with enhanced security
CREATE TABLE IF NOT EXISTS api_keys (
    key_id TEXT PRIMARY KEY,
    key_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hashed API key
    key_prefix TEXT NOT NULL,       -- First 12 chars for identification
    user_email TEXT,
    organization TEXT,
    plan_type TEXT DEFAULT 'free',  -- free, starter, growth, pro, enterprise
    is_active BOOLEAN DEFAULT true,
    
    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 100,
    rate_limit_per_day INTEGER DEFAULT 2000,
    rate_limit_burst INTEGER DEFAULT 10,
    
    -- Usage tracking
    total_requests INTEGER DEFAULT 0,
    last_used_at TEXT,
    
    -- Billing
    billing_cycle_start TEXT,
    billing_cycle_requests INTEGER DEFAULT 0,
    
    created_at TEXT NOT NULL,
    expires_at TEXT, -- Optional expiration
    
    -- Permissions
    permissions TEXT DEFAULT '["lessons:read"]' -- JSON array of permissions
);

-- Enhanced API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    request_timestamp TEXT NOT NULL,
    request_ip TEXT,
    user_agent TEXT,
    country_code TEXT, -- From Cloudflare
    error_message TEXT,
    
    -- Request details
    lesson_id TEXT,
    age_requested INTEGER,
    tone_requested TEXT,
    language_requested TEXT,
    
    FOREIGN KEY (key_id) REFERENCES api_keys(key_id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
);

-- Daily topics - your 366 predefined topics
CREATE TABLE IF NOT EXISTS daily_topics (
    day_of_year INTEGER PRIMARY KEY, -- 1-366
    topic TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT,
    difficulty_level TEXT DEFAULT 'intermediate',
    tags TEXT, -- JSON array of tags
    learning_objectives TEXT, -- JSON array of objectives
    
    -- Content relationships
    prerequisite_topics TEXT, -- JSON array of prerequisite day numbers
    related_topics TEXT,      -- JSON array of related day numbers
    
    -- Metadata
    created_at TEXT NOT NULL,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Video generation queue with priority system
CREATE TABLE IF NOT EXISTS video_queue (
    queue_id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    variation_config TEXT NOT NULL, -- JSON with age, tone, language
    avatar_type TEXT DEFAULT 'ken', -- ken, kelly, user_avatar
    script_segments TEXT NOT NULL,  -- JSON array of script segments
    
    -- HeyGen integration
    heygen_video_ids TEXT, -- JSON array of HeyGen video IDs
    heygen_callback_url TEXT,
    
    -- Queue management
    status TEXT DEFAULT 'queued', -- queued, processing, completed, failed, cancelled
    priority INTEGER DEFAULT 5,   -- 1-10, lower = higher priority
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timing
    queued_at TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    estimated_completion_at TEXT,
    
    -- Error handling
    error_message TEXT,
    error_details TEXT, -- JSON with detailed error info
    
    -- Resource tracking
    processing_time_seconds INTEGER,
    total_segments INTEGER,
    completed_segments INTEGER,
    
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
);

-- User progress tracking for dailylesson.org
CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    
    -- Progress details
    status TEXT DEFAULT 'started', -- started, in_progress, completed, bookmarked, skipped
    progress_percentage INTEGER DEFAULT 0,
    current_segment INTEGER DEFAULT 0,
    completion_time_seconds INTEGER,
    
    -- User choices and interactions
    user_choices TEXT, -- JSON object with question responses
    replay_count INTEGER DEFAULT 0,
    setting_changes TEXT, -- JSON array of setting changes during lesson
    
    -- Timing
    started_at TEXT NOT NULL,
    last_accessed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    
    -- User settings when taking lesson
    age_setting INTEGER,
    tone_setting TEXT,
    language_setting TEXT,
    
    PRIMARY KEY (user_id, lesson_id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
);

-- Subscription management
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    api_key_id TEXT,
    
    -- Plan details
    plan_type TEXT NOT NULL, -- starter, growth, pro, enterprise
    plan_name TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, cancelled, expired, past_due, paused
    
    -- Billing periods
    current_period_start TEXT NOT NULL,
    current_period_end TEXT NOT NULL,
    trial_end TEXT,
    
    -- Stripe integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    
    -- Usage limits
    monthly_request_limit INTEGER,
    monthly_requests_used INTEGER DEFAULT 0,
    
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TEXT,
    
    FOREIGN KEY (api_key_id) REFERENCES api_keys(key_id)
);

-- Webhook events tracking
CREATE TABLE IF NOT EXISTS webhook_events (
    event_id TEXT PRIMARY KEY,
    source TEXT NOT NULL, -- heygen, stripe, elevenlabs, etc.
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON blob of the complete webhook payload
    
    -- Processing status
    processed BOOLEAN DEFAULT false,
    processed_at TEXT,
    processing_attempts INTEGER DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    error_details TEXT,
    
    -- Relationships
    related_lesson_id TEXT,
    related_queue_id TEXT,
    related_subscription_id TEXT,
    
    received_at TEXT NOT NULL,
    
    FOREIGN KEY (related_lesson_id) REFERENCES lessons(lesson_id),
    FOREIGN KEY (related_queue_id) REFERENCES video_queue(queue_id),
    FOREIGN KEY (related_subscription_id) REFERENCES subscriptions(subscription_id)
);

-- Content moderation and quality control
CREATE TABLE IF NOT EXISTS content_moderation (
    moderation_id TEXT PRIMARY KEY,
    lesson_id TEXT,
    lesson_dna_id TEXT,
    content_type TEXT NOT NULL, -- script, metadata, dna_structure
    
    -- Content details
    flagged_content TEXT,
    flag_reason TEXT NOT NULL,
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    
    -- Moderation status
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, needs_revision
    auto_approved BOOLEAN DEFAULT false,
    
    -- Review details
    reviewer_email TEXT,
    reviewer_notes TEXT,
    reviewed_at TEXT,
    action_taken TEXT, -- approved, rejected, modified, escalated
    
    -- AI moderation scores
    toxicity_score REAL DEFAULT 0.0,
    bias_score REAL DEFAULT 0.0,
    age_appropriateness_score REAL DEFAULT 0.0,
    
    created_at TEXT NOT NULL,
    
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id),
    FOREIGN KEY (lesson_dna_id) REFERENCES lesson_dna(lesson_id)
);

-- Analytics aggregation tables
CREATE TABLE IF NOT EXISTS daily_analytics (
    date TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value INTEGER NOT NULL,
    breakdown TEXT, -- JSON object with additional dimensions
    
    -- Metadata
    calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (date, metric_name)
);

CREATE TABLE IF NOT EXISTS hourly_analytics (
    hour TEXT NOT NULL, -- YYYY-MM-DD-HH format
    metric_name TEXT NOT NULL,
    metric_value INTEGER NOT NULL,
    breakdown TEXT,
    
    calculated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (hour, metric_name)
);

-- User avatar management
CREATE TABLE IF NOT EXISTS user_avatars (
    avatar_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    
    -- Avatar details
    avatar_name TEXT,
    avatar_type TEXT DEFAULT 'heygen', -- heygen, d_id, custom
    
    -- HeyGen specifics
    heygen_avatar_id TEXT,
    heygen_voice_id TEXT,
    
    -- Avatar settings
    appearance_settings TEXT, -- JSON with customization options
    voice_settings TEXT,      -- JSON with voice preferences
    
    -- Status
    status TEXT DEFAULT 'creating', -- creating, ready, failed
    is_active BOOLEAN DEFAULT true,
    
    -- Generation details
    source_photo_url TEXT,
    source_voice_sample_url TEXT,
    
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for better query speed
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_day_age_tone_lang ON lessons(day_of_year, age_target, tone, language);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_metadata_composite ON lessons(day_of_year, age_target, tone, language, status);

CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_email ON api_keys(user_email);

CREATE INDEX IF NOT EXISTS idx_api_usage_key_timestamp ON api_usage(key_id, request_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint, request_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage(status_code, request_timestamp);

CREATE INDEX IF NOT EXISTS idx_video_queue_status ON video_queue(status);
CREATE INDEX IF NOT EXISTS idx_video_queue_priority ON video_queue(priority, queued_at);
CREATE INDEX IF NOT EXISTS idx_video_queue_lesson ON video_queue(lesson_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_source_type ON webhook_events(source, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_lessons_timestamp 
    AFTER UPDATE ON lessons
    BEGIN
        UPDATE lessons SET updated_at = CURRENT_TIMESTAMP WHERE lesson_id = NEW.lesson_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_lesson_dna_timestamp 
    AFTER UPDATE ON lesson_dna
    BEGIN
        UPDATE lesson_dna SET updated_at = CURRENT_TIMESTAMP WHERE lesson_id = NEW.lesson_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_subscriptions_timestamp 
    AFTER UPDATE ON subscriptions
    BEGIN
        UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE subscription_id = NEW.subscription_id;
    END;

-- Views for common complex queries
CREATE VIEW IF NOT EXISTS lesson_summary AS
SELECT 
    l.lesson_id,
    l.day_of_year,
    dt.topic,
    dt.category,
    JSON_EXTRACT(l.metadata, '$.title') as title,
    l.age_target,
    l.tone,
    l.language,
    l.status,
    l.quality_score,
    l.created_at,
    CASE 
        WHEN l.video_url IS NOT NULL THEN 'ready'
        WHEN vq.status = 'processing' THEN 'generating'
        WHEN vq.status = 'failed' THEN 'failed'
        ELSE 'pending'
    END as media_status
FROM lessons l
LEFT JOIN daily_topics dt ON l.day_of_year = dt.day_of_year
LEFT JOIN video_queue vq ON l.lesson_id = vq.lesson_id
WHERE l.status != 'archived';

CREATE VIEW IF NOT EXISTS api_usage_summary AS
SELECT 
    key_id,
    DATE(request_timestamp) as usage_date,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests,
    AVG(response_time_ms) as avg_response_time,
    SUM(request_size_bytes) as total_request_bytes,
    SUM(response_size_bytes) as total_response_bytes
FROM api_usage 
GROUP BY key_id, DATE(request_timestamp);

CREATE VIEW IF NOT EXISTS subscription_usage AS
SELECT 
    s.subscription_id,
    s.user_email,
    s.plan_type,
    s.monthly_request_limit,
    s.monthly_requests_used,
    ROUND((s.monthly_requests_used * 100.0 / s.monthly_request_limit), 2) as usage_percentage,
    s.current_period_start,
    s.current_period_end,
    s.status
FROM subscriptions s
WHERE s.status = 'active';

-- database/migrations/002_seed_data.sql
-- Insert the 366 daily topics
INSERT OR REPLACE INTO daily_topics (day_of_year, topic, category, subject, difficulty_level, tags, learning_objectives) VALUES
(1, 'Setting Intentions for Growth', 'personal_development', 'Goal Setting', 'beginner', '["goals", "mindset", "growth", "new_year"]', '["Understand the psychology of goal setting", "Create meaningful personal intentions", "Develop growth mindset"]'),
(2, 'The Science of Habit Formation', 'psychology', 'Behavioral Science', 'intermediate', '["habits", "behavior", "science", "psychology"]', '["Understand the habit loop", "Apply scientific principles to behavior change", "Create sustainable habits"]'),
(3, 'Effective Communication Basics', 'communication', 'Interpersonal Skills', 'beginner', '["speaking", "listening", "relationships", "communication"]', '["Practice active listening", "Communicate clearly and empathetically", "Build stronger relationships"]'),
(4, 'Time Management Fundamentals', 'productivity', 'Personal Effectiveness', 'beginner', '["time", "planning", "efficiency", "productivity"]', '["Prioritize tasks effectively", "Eliminate time wasters", "Create sustainable routines"]'),
(5, 'Understanding Emotional Intelligence', 'psychology', 'Social Skills', 'intermediate', '["emotions", "intelligence", "relationships", "self-awareness"]', '["Recognize emotional patterns", "Manage emotions effectively", "Improve social interactions"]'),

-- Continue with all 366 topics...
-- (For brevity, showing just first 5. In production, you'd have all 366)

(365, 'Reflection and Continuous Learning', 'personal_development', 'Growth Mindset', 'advanced', '["reflection", "learning", "growth", "year_end"]', '["Evaluate personal growth over time", "Plan for continued learning", "Develop wisdom from experience"]'),
(366, 'Celebrating Growth and New Beginnings', 'personal_development', 'Achievement', 'intermediate', '["celebration", "growth", "achievement", "transition"]', '["Acknowledge personal progress", "Prepare for new challenges", "Integrate learning into identity"]');

-- Insert default lesson templates
INSERT OR REPLACE INTO lesson_dna (lesson_id, dna_content, created_by, created_at) VALUES
('template_3x2x1_basic', '{
  "lesson_id": "template_3x2x1_basic",
  "template_type": "3x2x1_format",
  "universal_concept": "{{UNIVERSAL_CONCEPT}}",
  "core_principle": "{{CORE_PRINCIPLE}}",
  "learning_essence": "{{LEARNING_ESSENCE}}",
  "age_expressions": {
    "early_childhood": {
      "concept_name": "{{CONCEPT_NAME_CHILD}}",
      "core_metaphor": "{{METAPHOR_CHILD}}",
      "complexity_level": "concrete_actions_and_feelings",
      "attention_span": "3-4_minutes",
      "examples": ["{{EXAMPLE_1}}", "{{EXAMPLE_2}}", "{{EXAMPLE_3}}"],
      "vocabulary": ["{{VOCAB_1}}", "{{VOCAB_2}}", "{{VOCAB_3}}"]
    }
  }
}', 'system', datetime('now'));

-- Insert sample API keys for testing
INSERT OR REPLACE INTO api_keys (key_id, key_hash, key_prefix, user_email, plan_type, rate_limit_per_hour, created_at) VALUES
('test_key_1', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'ilearn_test_sk_', 'test@ilearn.how', 'free', 100, datetime('now')),
('demo_key_1', 'b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb9', 'ilearn_live_sk_', 'demo@ilearn.how', 'pro', 10000, datetime('now'));

-- database/setup.js - Database initialization script
const fs = require('fs');
const path = require('path');

class DatabaseSetup {
  constructor(d1Database) {
    this.db = d1Database;
  }

  async runMigrations() {
    console.log('🗄️ Running database migrations...');
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split on semicolons and execute each statement
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.db.prepare(statement).run();
        }
      }
      
      console.log(`✅ Migration completed: ${file}`);
    }
    
    console.log('✅ All migrations completed successfully');
  }

  async validateSchema() {
    console.log('🔍 Validating database schema...');
    
    const tables = await this.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all();
    
    const expectedTables = [
      'lessons', 'lesson_dna', 'api_keys', 'api_usage', 'daily_topics',
      'video_queue', 'user_progress', 'subscriptions', 'webhook_events',
      'content_moderation', 'daily_analytics', 'hourly_analytics', 'user_avatars'
    ];
    
    const existingTables = tables.results.map(t => t.name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    console.log('✅ Schema validation passed');
    return true;
  }

  async seedTestData() {
    console.log('🌱 Seeding test data...');
    
    // Check if data already exists
    const lessonCount = await this.db.prepare('SELECT COUNT(*) as count FROM daily_topics').first();
    
    if (lessonCount.count > 0) {
      console.log('📚 Test data already exists, skipping seed');
      return;
    }
    
    // Insert sample lessons for testing
    const sampleLessons = [
      {
        lesson_id: 'test_lesson_negotiation',
        day_of_year: 1,
        age_target: 25,
        tone: 'neutral',
        language: 'english',
        metadata: JSON.stringify({
          title: 'Negotiation Skills for Daily Life',
          duration: '6 minutes',
          complexity: 'Intermediate'
        }),
        scripts: JSON.stringify([
          {
            script_number: 1,
            type: 'intro_question1',
            voice_text: 'We are going to make sure you understand negotiation perfectly. Here\'s our best next step together.',
            on_screen_text: 'Understanding Negotiation'
          }
        ]),
        status: 'ready'
      }
    ];
    
    for (const lesson of sampleLessons) {
      await this.db.prepare(`
        INSERT OR REPLACE INTO lessons (
          lesson_id, day_of_year, age_target, tone, language,
          metadata, scripts, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        lesson.lesson_id, lesson.day_of_year, lesson.age_target,
        lesson.tone, lesson.language, lesson.metadata, lesson.scripts,
        lesson.status, new Date().toISOString()
      ).run();
    }
    
    console.log('✅ Test data seeded successfully');
  }

  async getSystemStats() {
    const stats = {};
    
    // Count records in each table
    const tables = ['lessons', 'daily_topics', 'api_keys', 'api_usage', 'video_queue'];
    
    for (const table of tables) {
      const result = await this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).first();
      stats[table] = result.count;
    }
    
    // Get recent activity
    const recentLessons = await this.db.prepare(`
      SELECT COUNT(*) as count FROM lessons 
      WHERE created_at >= datetime('now', '-7 days')
    `).first();
    stats.lessons_last_7_days = recentLessons.count;
    
    const recentAPI = await this.db.prepare(`
      SELECT COUNT(*) as count FROM api_usage 
      WHERE request_timestamp >= datetime('now', '-24 hours')
    `).first();
    stats.api_requests_last_24h = recentAPI.count;
    
    return stats;
  }
}

module.exports = DatabaseSetup;