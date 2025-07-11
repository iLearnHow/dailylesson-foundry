// monitoring/src/analytics-processor.ts - Cloudflare Queue Consumer
import { Analytics } from './services/Analytics';
import { AlertManager } from './services/AlertManager';
import { MetricsCollector } from './services/MetricsCollector';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ANALYTICS_WEBHOOK: string;
  SLACK_WEBHOOK: string;
}

export default {
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    const analytics = new Analytics(env.DB);
    const alerts = new AlertManager(env.SLACK_WEBHOOK);
    const metrics = new MetricsCollector(env.KV);

    for (const message of batch.messages) {
      try {
        const { type, data, timestamp } = message.body;

        switch (type) {
          case 'api_request':
            await analytics.processAPIRequest(data);
            await metrics.updateAPIMetrics(data);
            break;

          case 'lesson_generated':
            await analytics.processLessonGeneration(data);
            await metrics.updateLessonMetrics(data);
            break;

          case 'video_completed':
            await analytics.processVideoCompletion(data);
            await metrics.updateVideoMetrics(data);
            break;

          case 'user_interaction':
            await analytics.processUserInteraction(data);
            await metrics.updateUserMetrics(data);
            break;

          case 'error_occurred':
            await analytics.processError(data);
            await alerts.handleError(data);
            break;

          case 'performance_metric':
            await metrics.updatePerformanceMetrics(data);
            await alerts.checkPerformanceThresholds(data);
            break;
        }

        message.ack();
      } catch (error) {
        console.error('Analytics processing error:', error);
        message.retry();
      }
    }

    // Generate hourly aggregations
    await analytics.generateHourlyAggregations();
    
    // Check system health
    await alerts.checkSystemHealth();
  }
};

// monitoring/src/services/Analytics.ts
export class Analytics {
  constructor(private db: D1Database) {}

  async processAPIRequest(data: {
    key_id: string;
    endpoint: string;
    method: string;
    status_code: number;
    response_time_ms: number;
    request_timestamp: string;
    request_ip: string;
    user_agent: string;
    lesson_id?: string;
    age_requested?: number;
    tone_requested?: string;
    language_requested?: string;
  }) {
    // Store raw request data
    await this.db.prepare(`
      INSERT INTO api_usage (
        key_id, endpoint, method, status_code, response_time_ms,
        request_timestamp, request_ip, user_agent,
        lesson_id, age_requested, tone_requested, language_requested
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.key_id, data.endpoint, data.method, data.status_code, data.response_time_ms,
      data.request_timestamp, data.request_ip, data.user_agent,
      data.lesson_id, data.age_requested, data.tone_requested, data.language_requested
    ).run();

    // Update real-time metrics
    await this.updateRealTimeMetrics(data);
  }

  async processLessonGeneration(data: {
    lesson_id: string;
    age: number;
    tone: string;
    language: string;
    generation_time_ms: number;
    quality_score: number;
    success: boolean;
    error_message?: string;
  }) {
    await this.db.prepare(`
      INSERT INTO lesson_generation_log (
        lesson_id, age, tone, language, generation_time_ms,
        quality_score, success, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.lesson_id, data.age, data.tone, data.language, data.generation_time_ms,
      data.quality_score, data.success, data.error_message || null,
      new Date().toISOString()
    ).run();
  }

  async processVideoCompletion(data: {
    lesson_id: string;
    queue_id: string;
    variation: any;
    processing_time_seconds: number;
    success: boolean;
    video_url?: string;
    error_message?: string;
  }) {
    await this.db.prepare(`
      INSERT INTO video_generation_log (
        lesson_id, queue_id, variation, processing_time_seconds,
        success, video_url, error_message, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.lesson_id, data.queue_id, JSON.stringify(data.variation),
      data.processing_time_seconds, data.success, data.video_url,
      data.error_message || null, new Date().toISOString()
    ).run();
  }

  async processUserInteraction(data: {
    user_id: string;
    lesson_id: string;
    interaction_type: string;
    interaction_data: any;
    timestamp: string;
  }) {
    await this.db.prepare(`
      INSERT INTO user_interactions (
        user_id, lesson_id, interaction_type, interaction_data, timestamp
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      data.user_id, data.lesson_id, data.interaction_type,
      JSON.stringify(data.interaction_data), data.timestamp
    ).run();
  }

  async processError(data: {
    error_type: string;
    error_message: string;
    stack_trace?: string;
    context: any;
    severity: string;
    timestamp: string;
  }) {
    await this.db.prepare(`
      INSERT INTO error_log (
        error_type, error_message, stack_trace, context,
        severity, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      data.error_type, data.error_message, data.stack_trace,
      JSON.stringify(data.context), data.severity, data.timestamp
    ).run();
  }

  private async updateRealTimeMetrics(data: any) {
    const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    
    // Update requests per hour
    await this.incrementHourlyMetric(hour, 'api_requests_total', 1);
    
    // Update success/error rates
    if (data.status_code >= 200 && data.status_code < 300) {
      await this.incrementHourlyMetric(hour, 'api_requests_success', 1);
    } else {
      await this.incrementHourlyMetric(hour, 'api_requests_error', 1);
    }
    
    // Update response time metrics
    await this.updateAverageMetric(hour, 'api_response_time_avg', data.response_time_ms);
  }

  private async incrementHourlyMetric(hour: string, metric: string, value: number) {
    await this.db.prepare(`
      INSERT OR REPLACE INTO hourly_analytics (hour, metric_name, metric_value, calculated_at)
      VALUES (?, ?, COALESCE((SELECT metric_value FROM hourly_analytics WHERE hour = ? AND metric_name = ?), 0) + ?, ?)
    `).bind(hour, metric, hour, metric, value, new Date().toISOString()).run();
  }

  private async updateAverageMetric(hour: string, metric: string, value: number) {
    // Simplified average calculation - in production you'd use more sophisticated aggregation
    const existing = await this.db.prepare(`
      SELECT metric_value, breakdown FROM hourly_analytics WHERE hour = ? AND metric_name = ?
    `).bind(hour, metric).first();
    
    let newValue: number;
    let count: number;
    
    if (existing) {
      const breakdown = existing.breakdown ? JSON.parse(existing.breakdown) : { count: 1 };
      count = breakdown.count + 1;
      newValue = (existing.metric_value * (count - 1) + value) / count;
    } else {
      newValue = value;
      count = 1;
    }
    
    await this.db.prepare(`
      INSERT OR REPLACE INTO hourly_analytics (hour, metric_name, metric_value, breakdown, calculated_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      hour, metric, newValue,
      JSON.stringify({ count }),
      new Date().toISOString()
    ).run();
  }

  async generateHourlyAggregations() {
    const currentHour = new Date().toISOString().slice(0, 13);
    const previousHour = new Date(Date.now() - 3600000).toISOString().slice(0, 13);
    
    // Aggregate API usage metrics
    await this.aggregateAPIMetrics(previousHour);
    
    // Aggregate lesson generation metrics
    await this.aggregateLessonMetrics(previousHour);
    
    // Aggregate user engagement metrics
    await this.aggregateUserMetrics(previousHour);
    
    console.log(`✅ Hourly aggregations completed for ${previousHour}`);
  }

  private async aggregateAPIMetrics(hour: string) {
    const hourStart = `${hour}:00:00`;
    const hourEnd = `${hour}:59:59`;
    
    // Total requests
    const totalRequests = await this.db.prepare(`
      SELECT COUNT(*) as count FROM api_usage 
      WHERE request_timestamp BETWEEN ? AND ?
    `).bind(hourStart, hourEnd).first();
    
    // Success rate
    const successfulRequests = await this.db.prepare(`
      SELECT COUNT(*) as count FROM api_usage 
      WHERE request_timestamp BETWEEN ? AND ? AND status_code >= 200 AND status_code < 300
    `).bind(hourStart, hourEnd).first();
    
    // Average response time
    const avgResponseTime = await this.db.prepare(`
      SELECT AVG(response_time_ms) as avg FROM api_usage 
      WHERE request_timestamp BETWEEN ? AND ?
    `).bind(hourStart, hourEnd).first();
    
    // Store aggregated metrics
    await this.storeHourlyMetric(hour, 'api_total_requests', totalRequests.count);
    await this.storeHourlyMetric(hour, 'api_success_rate', 
      totalRequests.count > 0 ? (successfulRequests.count / totalRequests.count) * 100 : 0
    );
    await this.storeHourlyMetric(hour, 'api_avg_response_time', avgResponseTime.avg || 0);
  }

  private async aggregateLessonMetrics(hour: string) {
    const hourStart = `${hour}:00:00`;
    const hourEnd = `${hour}:59:59`;
    
    // Lessons generated
    const lessonsGenerated = await this.db.prepare(`
      SELECT COUNT(*) as count FROM lesson_generation_log 
      WHERE created_at BETWEEN ? AND ? AND success = true
    `).bind(hourStart, hourEnd).first();
    
    // Average quality score
    const avgQuality = await this.db.prepare(`
      SELECT AVG(quality_score) as avg FROM lesson_generation_log 
      WHERE created_at BETWEEN ? AND ? AND success = true
    `).bind(hourStart, hourEnd).first();
    
    // Popular age groups
    const ageDistribution = await this.db.prepare(`
      SELECT age, COUNT(*) as count FROM lesson_generation_log 
      WHERE created_at BETWEEN ? AND ? AND success = true
      GROUP BY CASE 
        WHEN age <= 8 THEN 'child'
        WHEN age <= 17 THEN 'teen'
        WHEN age <= 35 THEN 'young_adult'
        WHEN age <= 65 THEN 'adult'
        ELSE 'senior'
      END
    `).bind(hourStart, hourEnd).all();
    
    await this.storeHourlyMetric(hour, 'lessons_generated', lessonsGenerated.count);
    await this.storeHourlyMetric(hour, 'avg_lesson_quality', avgQuality.avg || 0);
    await this.storeHourlyMetric(hour, 'age_distribution', 0, JSON.stringify(ageDistribution.results));
  }

  private async aggregateUserMetrics(hour: string) {
    const hourStart = `${hour}:00:00`;
    const hourEnd = `${hour}:59:59`;
    
    // Active users
    const activeUsers = await this.db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM user_interactions 
      WHERE timestamp BETWEEN ? AND ?
    `).bind(hourStart, hourEnd).first();
    
    // Lesson completions
    const completions = await this.db.prepare(`
      SELECT COUNT(*) as count FROM user_progress 
      WHERE completed_at BETWEEN ? AND ? AND status = 'completed'
    `).bind(hourStart, hourEnd).first();
    
    await this.storeHourlyMetric(hour, 'active_users', activeUsers.count);
    await this.storeHourlyMetric(hour, 'lesson_completions', completions.count);
  }

  private async storeHourlyMetric(hour: string, metricName: string, value: number, breakdown?: string) {
    await this.db.prepare(`
      INSERT OR REPLACE INTO hourly_analytics (hour, metric_name, metric_value, breakdown, calculated_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(hour, metricName, value, breakdown || null, new Date().toISOString()).run();
  }

  async getDashboardData(timeRange: string = '24h') {
    const endTime = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
    }
    
    const dashboard = {
      summary: await this.getSummaryMetrics(startTime, endTime),
      apiMetrics: await this.getAPIMetrics(startTime, endTime),
      lessonMetrics: await this.getLessonMetrics(startTime, endTime),
      userMetrics: await this.getUserMetrics(startTime, endTime),
      errorMetrics: await this.getErrorMetrics(startTime, endTime),
      performanceMetrics: await this.getPerformanceMetrics(startTime, endTime)
    };
    
    return dashboard;
  }

  private async getSummaryMetrics(startTime: Date, endTime: Date) {
    const totalRequests = await this.db.prepare(`
      SELECT COUNT(*) as count FROM api_usage 
      WHERE request_timestamp BETWEEN ? AND ?
    `).bind(startTime.toISOString(), endTime.toISOString()).first();
    
    const totalLessons = await this.db.prepare(`
      SELECT COUNT(*) as count FROM lesson_generation_log 
      WHERE created_at BETWEEN ? AND ? AND success = true
    `).bind(startTime.toISOString(), endTime.toISOString()).first();
    
    const totalUsers = await this.db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM user_interactions 
      WHERE timestamp BETWEEN ? AND ?
    `).bind(startTime.toISOString(), endTime.toISOString()).first();
    
    const errorRate = await this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*) as rate
      FROM api_usage 
      WHERE request_timestamp BETWEEN ? AND ?
    `).bind(startTime.toISOString(), endTime.toISOString()).first();
    
    return {
      totalRequests: totalRequests.count,
      totalLessons: totalLessons.count,
      activeUsers: totalUsers.count,
      errorRate: errorRate.rate || 0
    };
  }

  private async getAPIMetrics(startTime: Date, endTime: Date) {
    // Request volume over time
    const requestVolume = await this.db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', request_timestamp) as hour,
        COUNT(*) as requests
      FROM api_usage 
      WHERE request_timestamp BETWEEN ? AND ?
      GROUP BY strftime('%Y-%m-%d %H:00:00', request_timestamp)
      ORDER BY hour
    `).bind(startTime.toISOString(), endTime.toISOString()).all();
    
    // Top endpoints
    const topEndpoints = await this.db.prepare(`
      SELECT endpoint, COUNT(*) as count
      FROM api_usage 
      WHERE request_timestamp BETWEEN ? AND ?
      GROUP BY endpoint
      ORDER BY count DESC
      LIMIT 10
    `).bind(startTime.toISOString(), endTime.toISOString()).all();
    
    // Response time distribution
    const responseTimeStats = await this.db.prepare(`
      SELECT 
        AVG(response_time_ms) as avg,
        MIN(response_time_ms) as min,
        MAX(response_time_ms) as max,
        COUNT(CASE WHEN response_time_ms < 100 THEN 1 END) * 100.0 / COUNT(*) as fast_percent,
        COUNT(CASE WHEN response_time_ms > 1000 THEN 1 END) * 100.0 / COUNT(*) as slow_percent
      FROM api_usage 
      WHERE request_timestamp BETWEEN ? AND ?
    `).bind(startTime.toISOString(), endTime.toISOString()).first();
    
    return {
      requestVolume: requestVolume.results,
      topEndpoints: topEndpoints.results,
      responseTimeStats
    };
  }

  private async getLessonMetrics(startTime: Date, endTime: Date) {
    // Popular age groups
    const ageDistribution = await this.db.prepare(`
      SELECT 
        CASE 
          WHEN age <= 8 THEN 'Early Childhood'
          WHEN age <= 17 THEN 'Youth'
          WHEN age <= 35 THEN 'Young Adult'
          WHEN age <= 65 THEN 'Midlife'
          ELSE 'Wisdom Years'
        END as age_group,
        COUNT(*) as count
      FROM lesson_generation_log 
      WHERE created_at BETWEEN ? AND ? AND success = true
      GROUP BY age_group
      ORDER BY count DESC
    `).bind(startTime.toISOString(), endTime.toISOString()).all();
    
    // Tone preferences
    const toneDistribution = await this.db.prepare(`
      SELECT tone, COUNT(*) as count
      FROM lesson_generation_log 
      WHERE created_at BETWEEN ? AND ? AND success = true
      GROUP BY tone
      ORDER BY count DESC
    `).bind(startTime.toISOString(), endTime.toISOString()).all();
    
    // Language distribution
    const languageDistribution = await this.db.prepare(`
      SELECT language, COUNT(*) as count
      FROM lesson_generation_log 
      WHERE created_at BETWEEN ? AND ? AND success = true
      GROUP BY language
      ORDER BY count DESC
    `).bind(startTime.toISOString(), endTime.toISOString()).all();
    
    // Quality metrics
    const qualityStats = await this.db.prepare(`
      SELECT 
        AVG(quality_score) as avg_quality,
        MIN(quality_score) as min_quality,
        MAX(quality_score) as max_quality,
        COUNT(CASE WHEN quality_score >= 0.9 THEN 1 END) * 100.0 / COUNT(*) as high_quality_percent
      FROM lesson_generation_log 
      WHERE created_at BETWEEN ? AND ? AND success = true
    `).bind(startTime.toISOString(), endTime.toISOString()).first();
    
    return {
      ageDistribution: ageDistribution.results,
      toneDistribution: toneDistribution.results,
      languageDistribution: languageDistribution.results,
      qualityStats
    };
  }

  private async getUserMetrics(startTime: Date, endTime: Date) {
    // User engagement patterns
    const engagement = await this.db.prepare(`
      SELECT 
        interaction_type,
        COUNT(*) as count
      FROM user_interactions 
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY interaction_type
      ORDER BY count DESC
    `).bind(startTime.toISOString(), endTime.toISOString()).all();
    
    // Completion rates
    const completionRate = await this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as rate
      FROM user_progress 
      WHERE started_at BETWEEN ? AND ?
    `).bind(startTime.toISOString(), endTime.toISOString()).first();
    
    return {
      engagement: engagement.results,
      completionRate: completionRate.rate || 0
    };
  }

  private async getErrorMetrics(startTime: Date, endTime: Date) {
    // Error trends
    const errorTrends = await this.db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
        severity,
        COUNT(*) as count
      FROM error_log 
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY hour, severity
      ORDER BY hour, severity
    `).bind(startTime.toISOString(), endTime.toISOString()).all();
    
    // Top errors
    const topErrors = await this.db.prepare(`
      SELECT error_type, error_message, COUNT(*) as count
      FROM error_log 
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY error_type, error_message
      ORDER BY count DESC
      LIMIT 10
    `).bind(startTime.toISOString(), endTime.toISOString()).all();
    
    return {
      errorTrends: errorTrends.results,
      topErrors: topErrors.results
    };
  }

  private async getPerformanceMetrics(startTime: Date, endTime: Date) {
    // Video generation performance
    const videoPerformance = await this.db.prepare(`
      SELECT 
        AVG(processing_time_seconds) as avg_time,
        COUNT(CASE WHEN success = true THEN 1 END) * 100.0 / COUNT(*) as success_rate,
        COUNT(*) as total_videos
      FROM video_generation_log 
      WHERE completed_at BETWEEN ? AND ?
    `).bind(startTime.toISOString(), endTime.toISOString()).first();
    
    return {
      videoGeneration: videoPerformance
    };
  }
}

// monitoring/src/services/AlertManager.ts
export class AlertManager {
  constructor(private slackWebhook: string) {}

  async handleError(data: {
    error_type: string;
    error_message: string;
    severity: string;
    context: any;
  }) {
    // Only alert on high severity errors
    if (data.severity === 'high' || data.severity === 'critical') {
      await this.sendSlackAlert({
        title: `🚨 ${data.severity.toUpperCase()} Error Detected`,
        message: `**Error Type:** ${data.error_type}\n**Message:** ${data.error_message}`,
        color: data.severity === 'critical' ? '#FF0000' : '#FFA500',
        context: data.context
      });
    }
  }

  async checkPerformanceThresholds(data: {
    metric_name: string;
    metric_value: number;
    threshold: number;
  }) {
    if (data.metric_value > data.threshold) {
      await this.sendSlackAlert({
        title: `⚠️ Performance Threshold Exceeded`,
        message: `**Metric:** ${data.metric_name}\n**Value:** ${data.metric_value}\n**Threshold:** ${data.threshold}`,
        color: '#FFA500'
      });
    }
  }

  async checkSystemHealth() {
    // Check various system health indicators
    const healthChecks = [
      this.checkAPIHealth(),
      this.checkDatabaseHealth(),
      this.checkVideoGenerationHealth()
    ];
    
    const results = await Promise.allSettled(healthChecks);
    
    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        await this.sendSlackAlert({
          title: `💥 System Health Check Failed`,
          message: `Health check ${index + 1} failed: ${result.reason}`,
          color: '#FF0000'
        });
      }
    }
  }

  private async checkAPIHealth(): Promise<void> {
    // Implementation would check API response times, error rates, etc.
    // For now, placeholder
  }

  private async checkDatabaseHealth(): Promise<void> {
    // Implementation would check database connection, query performance, etc.
    // For now, placeholder
  }

  private async checkVideoGenerationHealth(): Promise<void> {
    // Implementation would check video generation queue, success rates, etc.
    // For now, placeholder
  }

  private async sendSlackAlert(alert: {
    title: string;
    message: string;
    color: string;
    context?: any;
  }) {
    try {
      const payload = {
        attachments: [{
          color: alert.color,
          title: alert.title,
          text: alert.message,
          footer: 'iLearn.how Monitoring',
          ts: Math.floor(Date.now() / 1000),
          fields: alert.context ? [
            {
              title: 'Context',
              value: JSON.stringify(alert.context, null, 2),
              short: false
            }
          ] : []
        }]
      };

      await fetch(this.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }
}

// monitoring/src/services/MetricsCollector.ts
export class MetricsCollector {
  constructor(private kv: KVNamespace) {}

  async updateAPIMetrics(data: any) {
    const key = `metrics:api:${new Date().toISOString().slice(0, 13)}`; // Hour-based key
    
    const existing = await this.kv.get(key, 'json') || {
      requests: 0,
      errors: 0,
      totalResponseTime: 0
    };
    
    existing.requests += 1;
    if (data.status_code >= 400) existing.errors += 1;
    existing.totalResponseTime += data.response_time_ms;
    
    await this.kv.put(key, JSON.stringify(existing), { expirationTtl: 86400 }); // 24 hours
  }

  async updateLessonMetrics(data: any) {
    const key = `metrics:lessons:${new Date().toISOString().slice(0, 13)}`;
    
    const existing = await this.kv.get(key, 'json') || {
      generated: 0,
      totalQuality: 0,
      ageDistribution: {}
    };
    
    existing.generated += 1;
    existing.totalQuality += data.quality_score;
    existing.ageDistribution[data.age] = (existing.ageDistribution[data.age] || 0) + 1;
    
    await this.kv.put(key, JSON.stringify(existing), { expirationTtl: 86400 });
  }

  async updateVideoMetrics(data: any) {
    const key = `metrics:videos:${new Date().toISOString().slice(0, 13)}`;
    
    const existing = await this.kv.get(key, 'json') || {
      completed: 0,
      failed: 0,
      totalProcessingTime: 0
    };
    
    if (data.success) {
      existing.completed += 1;
      existing.totalProcessingTime += data.processing_time_seconds;
    } else {
      existing.failed += 1;
    }
    
    await this.kv.put(key, JSON.stringify(existing), { expirationTtl: 86400 });
  }

  async updateUserMetrics(data: any) {
    const key = `metrics:users:${new Date().toISOString().slice(0, 13)}`;
    
    const existing = await this.kv.get(key, 'json') || {
      activeUsers: new Set(),
      interactions: 0
    };
    
    existing.activeUsers.add(data.user_id);
    existing.interactions += 1;
    
    // Convert Set to Array for JSON serialization
    const metrics = {
      ...existing,
      activeUsers: Array.from(existing.activeUsers)
    };
    
    await this.kv.put(key, JSON.stringify(metrics), { expirationTtl: 86400 });
  }

  async updatePerformanceMetrics(data: any) {
    const key = `metrics:performance:${data.metric_name}:${new Date().toISOString().slice(0, 13)}`;
    
    await this.kv.put(key, JSON.stringify({
      value: data.metric_value,
      timestamp: Date.now()
    }), { expirationTtl: 86400 });
  }

  async getMetricsSummary(hours: number = 24) {
    const summary = {
      api: { requests: 0, errors: 0, avgResponseTime: 0 },
      lessons: { generated: 0, avgQuality: 0 },
      videos: { completed: 0, failed: 0, avgProcessingTime: 0 },
      users: { activeUsers: new Set(), totalInteractions: 0 }
    };
    
    const now = new Date();
    for (let i = 0; i < hours; i++) {
      const hour = new Date(now.getTime() - i * 3600000).toISOString().slice(0, 13);
      
      // Aggregate API metrics
      const apiMetrics = await this.kv.get(`metrics:api:${hour}`, 'json');
      if (apiMetrics) {
        summary.api.requests += apiMetrics.requests;
        summary.api.errors += apiMetrics.errors;
        summary.api.avgResponseTime += apiMetrics.totalResponseTime;
      }
      
      // Aggregate lesson metrics
      const lessonMetrics = await this.kv.get(`metrics:lessons:${hour}`, 'json');
      if (lessonMetrics) {
        summary.lessons.generated += lessonMetrics.generated;
        summary.lessons.avgQuality += lessonMetrics.totalQuality;
      }
      
      // Aggregate video metrics
      const videoMetrics = await this.kv.get(`metrics:videos:${hour}`, 'json');
      if (videoMetrics) {
        summary.videos.completed += videoMetrics.completed;
        summary.videos.failed += videoMetrics.failed;
        summary.videos.avgProcessingTime += videoMetrics.totalProcessingTime;
      }
      
      // Aggregate user metrics
      const userMetrics = await this.kv.get(`metrics:users:${hour}`, 'json');
      if (userMetrics) {
        userMetrics.activeUsers.forEach(user => summary.users.activeUsers.add(user));
        summary.users.totalInteractions += userMetrics.interactions;
      }
    }
    
    // Calculate averages
    if (summary.api.requests > 0) {
      summary.api.avgResponseTime = summary.api.avgResponseTime / summary.api.requests;
    }
    if (summary.lessons.generated > 0) {
      summary.lessons.avgQuality = summary.lessons.avgQuality / summary.lessons.generated;
    }
    if (summary.videos.completed > 0) {
      summary.videos.avgProcessingTime = summary.videos.avgProcessingTime / summary.videos.completed;
    }
    
    // Convert Set back to count
    summary.users.activeUsers = summary.users.activeUsers.size;
    
    return summary;
  }
}

// monitoring/dashboard/index.html - Real-time Dashboard
const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>iLearn.how System Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #f5f5f7; }
        .header { background: #1d1d1f; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
        .container { max-width: 1400px; margin: 2rem auto; padding: 0 2rem; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .metric-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .metric-value { font-size: 2rem; font-weight: bold; color: #007AFF; }
        .metric-label { color: #666; font-size: 0.9rem; margin-top: 0.5rem; }
        .chart-container { background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; }
        .status-healthy { color: #34C759; }
        .status-warning { color: #FF9500; }
        .status-error { color: #FF3B30; }
        .refresh-btn { background: #007AFF; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 iLearn.how System Dashboard</h1>
        <div>
            <button class="refresh-btn" onclick="refreshData()">🔄 Refresh</button>
            <span id="lastUpdate" style="margin-left: 1rem; opacity: 0.7;"></span>
        </div>
    </div>
    
    <div class="container">
        <!-- Key Metrics -->
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value" id="totalRequests">-</div>
                <div class="metric-label">API Requests (24h)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="totalLessons">-</div>
                <div class="metric-label">Lessons Generated (24h)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="activeUsers">-</div>
                <div class="metric-label">Active Users (24h)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="errorRate">-</div>
                <div class="metric-label">Error Rate (%)</div>
            </div>
        </div>
        
        <!-- API Performance -->
        <div class="chart-container">
            <h3>API Request Volume</h3>
            <canvas id="apiChart" height="100"></canvas>
        </div>
        
        <!-- Lesson Analytics -->
        <div class="chart-container">
            <h3>Lesson Generation by Age Group</h3>
            <canvas id="ageChart" height="100"></canvas>
        </div>
        
        <!-- System Health -->
        <div class="chart-container">
            <h3>System Health Status</h3>
            <div id="systemHealth">
                <div>API Service: <span id="apiStatus" class="status-healthy">● Healthy</span></div>
                <div>Database: <span id="dbStatus" class="status-healthy">● Healthy</span></div>
                <div>Video Generation: <span id="videoStatus" class="status-healthy">● Healthy</span></div>
                <div>CDN: <span id="cdnStatus" class="status-healthy">● Healthy</span></div>
            </div>
        </div>
    </div>
    
    <script>
        let apiChart, ageChart;
        
        async function refreshData() {
            try {
                const response = await fetch('/analytics/dashboard?timeRange=24h');
                const data = await response.json();
                
                updateMetrics(data.summary);
                updateAPIChart(data.apiMetrics.requestVolume);
                updateAgeChart(data.lessonMetrics.ageDistribution);
                
                document.getElementById('lastUpdate').textContent = 
                    'Last updated: ' + new Date().toLocaleTimeString();
                    
            } catch (error) {
                console.error('Failed to refresh data:', error);
            }
        }
        
        function updateMetrics(summary) {
            document.getElementById('totalRequests').textContent = summary.totalRequests.toLocaleString();
            document.getElementById('totalLessons').textContent = summary.totalLessons.toLocaleString();
            document.getElementById('activeUsers').textContent = summary.activeUsers.toLocaleString();
            document.getElementById('errorRate').textContent = summary.errorRate.toFixed(2) + '%';
        }
        
        function updateAPIChart(data) {
            const ctx = document.getElementById('apiChart').getContext('2d');
            
            if (apiChart) apiChart.destroy();
            
            apiChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => new Date(d.hour).toLocaleTimeString()),
                    datasets: [{
                        label: 'Requests',
                        data: data.map(d => d.requests),
                        borderColor: '#007AFF',
                        backgroundColor: 'rgba(0, 122, 255, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        function updateAgeChart(data) {
            const ctx = document.getElementById('ageChart').getContext('2d');
            
            if (ageChart) ageChart.destroy();
            
            ageChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.age_group),
                    datasets: [{
                        data: data.map(d => d.count),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Auto-refresh every 30 seconds
        setInterval(refreshData, 30000);
        
        // Initial load
        refreshData();
    </script>
</body>
</html>
`;

// Export dashboard HTML for use in Cloudflare Pages
export { dashboardHTML };