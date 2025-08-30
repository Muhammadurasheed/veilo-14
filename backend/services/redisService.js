const Redis = require('ioredis');

class RedisService {
  constructor() {
    // Parse Redis URL or use individual components
    const redisConfig = process.env.REDIS_URL 
      ? { 
          url: process.env.REDIS_URL,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        }
      : {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        };

    this.client = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.isConnected = false;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      console.log('🔴 Redis connection closed');
      this.isConnected = false;
    });
  }

  async connect() {
    try {
      await Promise.all([
        this.client.connect(),
        this.publisher.connect(),
        this.subscriber.connect()
      ]);
      console.log('✅ All Redis connections established');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      await Promise.all([
        this.client.disconnect(),
        this.publisher.disconnect(),
        this.subscriber.disconnect()
      ]);
      console.log('✅ All Redis connections closed');
    } catch (error) {
      console.error('❌ Error disconnecting from Redis:', error);
    }
  }

  // Session State Management
  async setSessionState(sessionId, state, expireSeconds = 86400) {
    if (!this.isConnected) return false;
    
    try {
      const key = `session:${sessionId}`;
      await this.client.setex(key, expireSeconds, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('❌ Redis setSessionState error:', error);
      return false;
    }
  }

  async getSessionState(sessionId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `session:${sessionId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Redis getSessionState error:', error);
      return null;
    }
  }

  async updateSessionParticipants(sessionId, participants) {
    if (!this.isConnected) return false;
    
    try {
      const key = `session:${sessionId}:participants`;
      await this.client.setex(key, 86400, JSON.stringify(participants));
      
      // Publish participant update event
      await this.publisher.publish(`session:${sessionId}:events`, JSON.stringify({
        type: 'participants_updated',
        data: participants,
        timestamp: Date.now()
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Redis updateSessionParticipants error:', error);
      return false;
    }
  }

  async getSessionParticipants(sessionId) {
    if (!this.isConnected) return [];
    
    try {
      const key = `session:${sessionId}:participants`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Redis getSessionParticipants error:', error);
      return [];
    }
  }

  // Real-time Message Broadcasting
  async publishToSession(sessionId, event, data) {
    if (!this.isConnected) return false;
    
    try {
      const channel = `session:${sessionId}:events`;
      const message = JSON.stringify({
        type: event,
        data,
        timestamp: Date.now()
      });
      
      await this.publisher.publish(channel, message);
      return true;
    } catch (error) {
      console.error('❌ Redis publishToSession error:', error);
      return false;
    }
  }

  async subscribeToSession(sessionId, callback) {
    if (!this.isConnected) return false;
    
    try {
      const channel = `session:${sessionId}:events`;
      await this.subscriber.subscribe(channel);
      
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            console.error('❌ Redis message parsing error:', error);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('❌ Redis subscribeToSession error:', error);
      return false;
    }
  }

  // Voice Modulation Settings
  async setVoiceSettings(sessionId, participantId, settings) {
    if (!this.isConnected) return false;
    
    try {
      const key = `voice:${sessionId}:${participantId}`;
      await this.client.setex(key, 86400, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('❌ Redis setVoiceSettings error:', error);
      return false;
    }
  }

  async getVoiceSettings(sessionId, participantId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `voice:${sessionId}:${participantId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Redis getVoiceSettings error:', error);
      return null;
    }
  }

  // Rate Limiting
  async checkRateLimit(key, maxRequests, windowSeconds) {
    if (!this.isConnected) return true; // Allow if Redis is down
    
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      return current <= maxRequests;
    } catch (error) {
      console.error('❌ Redis checkRateLimit error:', error);
      return true; // Allow if error
    }
  }

  // Scheduled Session Management
  async setScheduledSession(sessionId, scheduledData) {
    if (!this.isConnected) return false;
    
    try {
      const key = `scheduled:${sessionId}`;
      const scheduledTime = new Date(scheduledData.scheduledDateTime).getTime();
      const expireSeconds = Math.max(Math.floor((scheduledTime - Date.now()) / 1000), 60);
      
      await this.client.setex(key, expireSeconds, JSON.stringify(scheduledData));
      return true;
    } catch (error) {
      console.error('❌ Redis setScheduledSession error:', error);
      return false;
    }
  }

  async getScheduledSession(sessionId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `scheduled:${sessionId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Redis getScheduledSession error:', error);
      return null;
    }
  }

  // Emergency Alerts
  async setEmergencyAlert(sessionId, alertData) {
    if (!this.isConnected) return false;
    
    try {
      const key = `emergency:${sessionId}`;
      await this.client.setex(key, 3600, JSON.stringify(alertData)); // 1 hour expiry
      
      // Broadcast emergency alert
      await this.publishToSession(sessionId, 'emergency_alert', alertData);
      return true;
    } catch (error) {
      console.error('❌ Redis setEmergencyAlert error:', error);
      return false;
    }
  }

  // Analytics and Monitoring
  async incrementSessionMetric(sessionId, metric) {
    if (!this.isConnected) return false;
    
    try {
      const key = `metrics:${sessionId}:${metric}`;
      await this.client.incr(key);
      await this.client.expire(key, 86400); // 24 hours
      return true;
    } catch (error) {
      console.error('❌ Redis incrementSessionMetric error:', error);
      return false;
    }
  }

  async getSessionMetrics(sessionId) {
    if (!this.isConnected) return {};
    
    try {
      const pattern = `metrics:${sessionId}:*`;
      const keys = await this.client.keys(pattern);
      const metrics = {};
      
      for (const key of keys) {
        const metric = key.split(':')[2];
        const value = await this.client.get(key);
        metrics[metric] = parseInt(value) || 0;
      }
      
      return metrics;
    } catch (error) {
      console.error('❌ Redis getSessionMetrics error:', error);
      return {};
    }
  }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;