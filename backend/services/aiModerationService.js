const { GoogleGenerativeAI } = require('@google/generative-ai');
const redisService = require('./redisService');

class AIModerationService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.genAI = this.geminiApiKey ? new GoogleGenerativeAI(this.geminiApiKey) : null;
    this.model = this.genAI?.getGenerativeModel({ model: 'gemini-pro' });
    
    // Moderation thresholds
    this.thresholds = {
      low: { toxicity: 0.8, selfHarm: 0.7, harassment: 0.8 },
      medium: { toxicity: 0.6, selfHarm: 0.5, harassment: 0.6 },
      high: { toxicity: 0.4, selfHarm: 0.3, harassment: 0.4 },
      strict: { toxicity: 0.2, selfHarm: 0.1, harassment: 0.2 }
    };

    // Emergency keywords that trigger immediate alerts
    this.emergencyKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'self harm',
      'hurt myself', 'overdose', 'cutting', 'razor', 'pills to die',
      'gun to head', 'jump off', 'hanging myself', 'no reason to live'
    ];

    // Crisis patterns for advanced detection
    this.crisisPatterns = [
      /(?:i want to|going to|plan to).{0,20}(?:kill|hurt|harm).{0,10}myself/i,
      /(?:no one|nobody).{0,20}(?:cares|loves|understands).{0,20}me/i,
      /life.{0,10}(?:is|feels).{0,10}(?:meaningless|pointless|worthless)/i,
      /(?:can't|cannot).{0,10}(?:go on|take it|handle)/i,
      /everything.{0,10}(?:is|feels).{0,10}(?:hopeless|dark|empty)/i
    ];

    console.log('🔍 AI Moderation Service initialized:', {
      geminiEnabled: !!this.geminiApiKey,
      redisEnabled: redisService.isConnected
    });
  }

  isEnabled() {
    return !!this.geminiApiKey;
  }

  async moderateMessage(messageContent, sessionId, participantId, moderationLevel = 'medium') {
    try {
      const startTime = Date.now();
      
      // Quick emergency check first
      const emergencyResult = this.checkEmergencyContent(messageContent);
      if (emergencyResult.isEmergency) {
        console.log('🚨 Emergency content detected, triggering immediate response');
        await this.handleEmergencyContent(sessionId, participantId, messageContent, emergencyResult);
        return {
          isEmergency: true,
          action: 'emergency_alert',
          severity: 'critical',
          reason: emergencyResult.reason,
          processingTime: Date.now() - startTime
        };
      }

      // Basic content filtering
      const basicResult = this.basicContentFilter(messageContent);
      if (basicResult.flagged) {
        return {
          isEmergency: false,
          action: basicResult.action,
          severity: basicResult.severity,
          reason: basicResult.reason,
          processingTime: Date.now() - startTime
        };
      }

      // AI-powered moderation if Gemini is available
      if (this.isEnabled()) {
        const aiResult = await this.geminiModeration(messageContent, moderationLevel);
        return {
          isEmergency: false,
          ...aiResult,
          processingTime: Date.now() - startTime
        };
      }

      // Fallback: no action needed
      return {
        isEmergency: false,
        action: 'none',
        severity: 'low',
        reason: 'Content appears safe',
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ AI Moderation error:', error.message);
      
      // Fallback to emergency check only
      const emergencyResult = this.checkEmergencyContent(messageContent);
      if (emergencyResult.isEmergency) {
        await this.handleEmergencyContent(sessionId, participantId, messageContent, emergencyResult);
        return {
          isEmergency: true,
          action: 'emergency_alert',
          severity: 'critical',
          reason: emergencyResult.reason
        };
      }

      return {
        isEmergency: false,
        action: 'none',
        severity: 'low',
        reason: 'Moderation service unavailable, content allowed',
        error: error.message
      };
    }
  }

  checkEmergencyContent(content) {
    const lowerContent = content.toLowerCase().replace(/[^\w\s]/g, '');
    
    // Check emergency keywords
    for (const keyword of this.emergencyKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        return {
          isEmergency: true,
          reason: `Emergency keyword detected: ${keyword}`,
          confidence: 0.9
        };
      }
    }

    // Check crisis patterns
    for (const pattern of this.crisisPatterns) {
      if (pattern.test(content)) {
        return {
          isEmergency: true,
          reason: 'Crisis language pattern detected',
          confidence: 0.8
        };
      }
    }

    return { isEmergency: false };
  }

  basicContentFilter(content) {
    const lowerContent = content.toLowerCase();
    
    // Spam detection
    if (content.length > 1000) {
      return {
        flagged: true,
        action: 'warning',
        severity: 'medium',
        reason: 'Message too long (spam protection)'
      };
    }

    // Repeated characters (spam)
    if (/(.)\1{10,}/.test(content)) {
      return {
        flagged: true,
        action: 'warning',
        severity: 'medium',
        reason: 'Excessive repeated characters'
      };
    }

    // All caps (shouting)
    if (content.length > 20 && content === content.toUpperCase()) {
      return {
        flagged: true,
        action: 'warning',
        severity: 'low',
        reason: 'Excessive use of capital letters'
      };
    }

    return { flagged: false };
  }

  async geminiModeration(content, moderationLevel) {
    if (!this.model) {
      throw new Error('Gemini AI not configured');
    }

    const prompt = `
Analyze this message for potential issues in an anonymous mental health support session context:

MESSAGE: "${content}"

Please evaluate for:
1. Toxicity/Harassment (0-1 scale)
2. Self-harm content (0-1 scale)
3. Spam/Off-topic (0-1 scale)
4. Inappropriate content (0-1 scale)

Respond in JSON format only:
{
  "toxicity": 0.0,
  "selfHarm": 0.0,
  "spam": 0.0,
  "inappropriate": 0.0,
  "overallSeverity": "low|medium|high",
  "recommendedAction": "none|warning|mute|kick",
  "reason": "brief explanation"
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      let analysis;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse Gemini response:', text);
        throw new Error('Invalid AI response format');
      }

      // Apply moderation level thresholds
      const threshold = this.thresholds[moderationLevel] || this.thresholds.medium;
      let finalAction = 'none';
      let finalSeverity = 'low';

      if (analysis.selfHarm >= threshold.selfHarm) {
        finalAction = 'emergency_alert';
        finalSeverity = 'critical';
      } else if (analysis.toxicity >= threshold.toxicity || analysis.inappropriate >= threshold.harassment) {
        if (analysis.toxicity >= 0.8) {
          finalAction = 'kick';
          finalSeverity = 'high';
        } else if (analysis.toxicity >= 0.6) {
          finalAction = 'mute';
          finalSeverity = 'medium';
        } else {
          finalAction = 'warning';
          finalSeverity = 'low';
        }
      } else if (analysis.spam >= 0.7) {
        finalAction = 'warning';
        finalSeverity = 'low';
      }

      return {
        action: finalAction,
        severity: finalSeverity,
        reason: analysis.reason || 'AI analysis',
        confidence: Math.max(analysis.toxicity, analysis.selfHarm, analysis.inappropriate),
        details: analysis
      };

    } catch (error) {
      console.error('❌ Gemini moderation error:', error.message);
      throw error;
    }
  }

  async handleEmergencyContent(sessionId, participantId, messageContent, emergencyResult) {
    try {
      console.log('🚨 Handling emergency content:', {
        sessionId,
        participantId,
        reason: emergencyResult.reason
      });

      // Store emergency alert in Redis
      const alertData = {
        sessionId,
        participantId,
        messageContent: messageContent.substring(0, 500), // Limit for privacy
        alertType: 'self_harm_risk',
        reason: emergencyResult.reason,
        confidence: emergencyResult.confidence,
        timestamp: new Date().toISOString(),
        status: 'active',
        interventionRequired: true
      };

      await redisService.setEmergencyAlert(sessionId, alertData);

      // Log for audit trail
      console.log('✅ Emergency alert stored and broadcasted');

      return alertData;
    } catch (error) {
      console.error('❌ Error handling emergency content:', error.message);
      throw error;
    }
  }

  async moderateVoiceTranscript(transcript, sessionId, participantId, moderationLevel) {
    // Voice transcripts often have lower accuracy, so we use more lenient thresholds
    const adjustedLevel = this.adjustModerationLevel(moderationLevel, 'voice');
    return await this.moderateMessage(transcript, sessionId, participantId, adjustedLevel);
  }

  adjustModerationLevel(originalLevel, contentType) {
    if (contentType === 'voice') {
      // Voice transcripts can be inaccurate, so use more lenient thresholds
      const levelMap = {
        'strict': 'high',
        'high': 'medium',
        'medium': 'low',
        'low': 'low'
      };
      return levelMap[originalLevel] || 'medium';
    }
    return originalLevel;
  }

  async getModerationStats(sessionId, timeRange = '1h') {
    try {
      const stats = await redisService.getSessionMetrics(sessionId);
      
      return {
        totalMessages: stats.messages_moderated || 0,
        warnings: stats.warnings_issued || 0,
        mutes: stats.mutes_issued || 0,
        kicks: stats.kicks_issued || 0,
        emergencyAlerts: stats.emergency_alerts || 0,
        averageProcessingTime: stats.avg_processing_time || 0,
        moderationLevel: stats.moderation_level || 'medium'
      };
    } catch (error) {
      console.error('❌ Error getting moderation stats:', error.message);
      return {
        totalMessages: 0,
        warnings: 0,
        mutes: 0,
        kicks: 0,
        emergencyAlerts: 0,
        averageProcessingTime: 0,
        moderationLevel: 'medium'
      };
    }
  }

  async updateModerationLevel(sessionId, newLevel) {
    try {
      await redisService.incrementSessionMetric(sessionId, 'moderation_level_changes');
      
      // Store the new level
      const sessionState = await redisService.getSessionState(sessionId) || {};
      sessionState.moderationLevel = newLevel;
      await redisService.setSessionState(sessionId, sessionState);
      
      console.log(`✅ Moderation level updated for session ${sessionId}: ${newLevel}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating moderation level:', error.message);
      return false;
    }
  }

  // Batch processing for analyzing multiple messages
  async batchModerate(messages, sessionId, moderationLevel) {
    const results = [];
    
    for (const message of messages) {
      try {
        const result = await this.moderateMessage(
          message.content,
          sessionId,
          message.participantId,
          moderationLevel
        );
        
        results.push({
          messageId: message.id,
          participantId: message.participantId,
          result
        });
      } catch (error) {
        console.error(`❌ Error moderating message ${message.id}:`, error.message);
        results.push({
          messageId: message.id,
          participantId: message.participantId,
          result: {
            isEmergency: false,
            action: 'none',
            severity: 'low',
            reason: 'Moderation failed, content allowed',
            error: error.message
          }
        });
      }
    }

    return results;
  }
}

// Singleton instance
const aiModerationService = new AIModerationService();

module.exports = aiModerationService;