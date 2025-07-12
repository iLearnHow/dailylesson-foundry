-- iLearn.how Database Schema for Cloudflare D1
-- Run these commands to set up your database

-- Lessons table - stores all generated lessons
CREATE TABLE IF NOT EXISTS lessons (
    lesson_id TEXT PRIMARY KEY,
    metadata TEXT NOT NULL, -- JSON blob with lesson metadata
    scripts TEXT NOT NULL,  -- JSON blob with script segments
    audio_url TEXT,         -- URL to generated audio file
    video_url TEXT,         -- URL to generated video file
    thumbnail_url TEXT,     -- URL to lesson thumbnail
    production_notes TEXT,  -- JSON blob with production metadata
    status TEXT DEFAULT 'generating', -- generating, ready, failed
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- API keys table - manage API access
CREATE TABLE IF NOT EXISTS api_keys (
    key_id TEXT PRIMARY KEY,
    key_hash TEXT NOT NULL,  -- Hashed API key for security
    key_prefix TEXT NOT NULL, -- First few chars for identification
    user_email TEXT,
    plan_type TEXT DEFAULT 'free', -- free, starter, growth, pro
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_hour INTEGER DEFAULT 100,
    created_at TEXT NOT NULL,
    last_used_at TEXT
);

-- Usage tracking table - monitor API usage
CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_timestamp TEXT NOT NULL,
    request_ip TEXT,
    user_agent TEXT,
    FOREIGN KEY (key_id) REFERENCES api_keys(key_id)
);

-- Daily topics table - your 366 predefined topics
CREATE TABLE IF NOT EXISTS daily_topics (
    day_of_year INTEGER PRIMARY KEY, -- 1-366
    topic TEXT NOT NULL,
    category TEXT,
    difficulty_level TEXT,
    tags TEXT, -- JSON array of tags
    created_at TEXT NOT NULL
);

-- Lesson templates table - reusable lesson structures
CREATE TABLE IF NOT EXISTS lesson_templates (
    template_id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    format TEXT NOT NULL, -- 3x2x1, etc.
    age_range_min INTEGER,
    age_range_max INTEGER,
    structure TEXT NOT NULL, -- JSON describing lesson structure
    variables TEXT, -- JSON array of customizable variables
    is_active BOOLEAN DEFAULT true,
    created_at TEXT NOT NULL
);

-- User progress tracking (for dailylesson.org users)
CREATE TABLE IF NOT EXISTS user_progress (
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    status TEXT DEFAULT 'started', -- started, completed, bookmarked
    progress_percentage INTEGER DEFAULT 0,
    completion_time_seconds INTEGER,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    PRIMARY KEY (user_id, lesson_id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
);

-- Subscription tracking
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    plan_type TEXT NOT NULL, -- starter, growth, pro
    status TEXT DEFAULT 'active', -- active, cancelled, expired
    current_period_start TEXT NOT NULL,
    current_period_end TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Webhooks log - track incoming webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
    event_id TEXT PRIMARY KEY,
    source TEXT NOT NULL, -- heygen, stripe, etc.
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON blob
    processed BOOLEAN DEFAULT false,
    processed_at TEXT,
    error_message TEXT,
    received_at TEXT NOT NULL
);

-- Video generation queue - track video production
CREATE TABLE IF NOT EXISTS video_queue (
    queue_id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    avatar_type TEXT NOT NULL, -- ken, kelly
    script_text TEXT NOT NULL,
    heygen_video_id TEXT,
    status TEXT DEFAULT 'queued', -- queued, processing, completed, failed
    priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
    queued_at TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
);

-- Content moderation log
CREATE TABLE IF NOT EXISTS content_moderation (
    moderation_id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL,
    content_type TEXT NOT NULL, -- script, metadata
    flagged_content TEXT,
    flag_reason TEXT,
    severity TEXT, -- low, medium, high
    auto_approved BOOLEAN DEFAULT false,
    reviewer_email TEXT,
    reviewed_at TEXT,
    action_taken TEXT, -- approved, rejected, modified
    created_at TEXT NOT NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id)
);

-- Analytics aggregation table
CREATE TABLE IF NOT EXISTS daily_analytics (
    date TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value INTEGER NOT NULL,
    breakdown TEXT, -- JSON object with additional dimensions
    PRIMARY KEY (date, metric_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at);
CREATE INDEX IF NOT EXISTS idx_lessons_metadata_age ON lessons(json_extract(metadata, '$.age_target'));
CREATE INDEX IF NOT EXISTS idx_lessons_metadata_language ON lessons(json_extract(metadata, '$.language'));
CREATE INDEX IF NOT EXISTS idx_lessons_metadata_tone ON lessons(json_extract(metadata, '$.tone'));

CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

CREATE INDEX IF NOT EXISTS idx_api_usage_key_timestamp ON api_usage(key_id, request_timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(request_timestamp);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_progress(status);

CREATE INDEX IF NOT EXISTS idx_video_queue_status ON video_queue(status);
CREATE INDEX IF NOT EXISTS idx_video_queue_priority ON video_queue(priority, queued_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON webhook_events(received_at);

-- Insert your 366 daily topics (sample data - replace with your actual topics)
INSERT OR REPLACE INTO daily_topics (day_of_year, topic, category, difficulty_level, tags) VALUES
(1, 'Setting Intentions for Growth', 'personal_development', 'beginner', '["goals", "mindset", "growth"]'),
(2, 'The Science of Habit Formation', 'psychology', 'intermediate', '["habits", "behavior", "science"]'),
(3, 'Effective Communication Basics', 'communication', 'beginner', '["speaking", "listening", "relationships"]'),
(4, 'Time Management Fundamentals', 'productivity', 'beginner', '["time", "planning", "efficiency"]'),
(5, 'Understanding Emotional Intelligence', 'psychology', 'intermediate', '["emotions", "intelligence", "relationships"]'),
-- Add the remaining 361 topics here...
(366, 'Reflection and Continuous Learning', 'personal_development', 'advanced', '["reflection", "learning", "growth"]');

-- Insert default lesson templates
INSERT OR REPLACE INTO lesson_templates (template_id, template_name, format, age_range_min, age_range_max, structure, variables) VALUES
('3x2x1_default', '3x2x1 Standard Format', '3x2x1', 5, 102, 
'{"segments": [
    {"type": "intro_question1", "duration": 30, "purpose": "engagement"},
    {"type": "choice1", "duration": 15, "purpose": "interaction"},
    {"type": "question2", "duration": 30, "purpose": "exploration"},
    {"type": "choice2", "duration": 15, "purpose": "decision"},
    {"type": "question3", "duration": 45, "purpose": "application"},
    {"type": "choice3", "duration": 15, "purpose": "commitment"},
    {"type": "daily_fortune", "duration": 30, "purpose": "inspiration"}
]}',
'["topic", "age_target", "tone", "cultural_context"]'),

('storytelling_format', 'Narrative Storytelling', 'story', 3, 12,
'{"segments": [
    {"type": "story_opening", "duration": 45, "purpose": "setup"},
    {"type": "character_introduction", "duration": 30, "purpose": "connection"},
    {"type": "problem_presentation", "duration": 60, "purpose": "tension"},
    {"type": "solution_journey", "duration": 90, "purpose": "learning"},
    {"type": "resolution", "duration": 45, "purpose": "conclusion"},
    {"type": "lesson_takeaway", "duration": 30, "purpose": "application"}
]}',
'["story_theme", "main_character", "lesson_moral", "age_target"]');

-- Insert sample API key for testing (replace with your actual implementation)
INSERT OR REPLACE INTO api_keys (key_id, key_hash, key_prefix, user_email, plan_type, rate_limit_per_hour, created_at) VALUES
('test_key_1', 'hashed_test_key', 'ilearn_test_sk_123', 'test@ilearn.how', 'free', 100, datetime('now')),
('live_key_1', 'hashed_live_key', 'ilearn_live_sk_456', 'founder@ilearn.how', 'pro', 10000, datetime('now'));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_lessons_timestamp 
    AFTER UPDATE ON lessons
    BEGIN
        UPDATE lessons SET updated_at = CURRENT_TIMESTAMP WHERE lesson_id = NEW.lesson_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_subscriptions_timestamp 
    AFTER UPDATE ON subscriptions
    BEGIN
        UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE subscription_id = NEW.subscription_id;
    END;

-- Views for common queries
CREATE VIEW IF NOT EXISTS recent_lessons AS
SELECT 
    lesson_id,
    json_extract(metadata, '$.title') as title,
    json_extract(metadata, '$.age_target') as age_target,
    json_extract(metadata, '$.tone') as tone,
    json_extract(metadata, '$.language') as language,
    status,
    created_at
FROM lessons 
WHERE created_at >= date('now', '-30 days')
ORDER BY created_at DESC;

CREATE VIEW IF NOT EXISTS api_usage_summary AS
SELECT 
    key_id,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests,
    AVG(response_time_ms) as avg_response_time,
    DATE(request_timestamp) as usage_date
FROM api_usage 
GROUP BY key_id, DATE(request_timestamp);

-- Sample data validation queries to run after setup:
-- SELECT COUNT(*) FROM lessons; -- Should show your existing lessons
-- SELECT COUNT(*) FROM daily_topics; -- Should show 366 topics
-- SELECT * FROM api_keys WHERE is_active = true; -- Should show active API keys
-- SELECT * FROM recent_lessons LIMIT 10; -- Should show recent lessons