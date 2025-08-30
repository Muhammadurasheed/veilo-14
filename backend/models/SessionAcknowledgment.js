const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sessionAcknowledgmentSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `ack-${nanoid(10)}`,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  invitationId: {
    type: String,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  userAlias: {
    type: String,
    required: true
  },
  userEmail: String,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  acknowledgmentType: {
    type: String,
    enum: ['direct_join', 'invitation_link', 'scheduled_session', 'emergency_join'],
    required: true
  },
  sessionDetails: {
    topic: String,
    description: String,
    emoji: String,
    hostAlias: String,
    scheduledDateTime: Date,
    estimatedDuration: Number,
    maxParticipants: Number,
    currentParticipants: Number,
    isScheduled: Boolean,
    timeUntilStart: Number // milliseconds
  },
  clientInfo: {
    ipAddress: String,
    userAgent: String,
    platform: String,
    browser: String,
    location: {
      country: String,
      region: String,
      city: String
    }
  },
  acknowledgedAt: {
    type: Date,
    default: Date.now
  },
  joinedAt: Date,
  leftAt: Date,
  sessionDuration: Number, // milliseconds
  participationStats: {
    messagesCount: { type: Number, default: 0 },
    voiceActiveTime: { type: Number, default: 0 }, // milliseconds
    handsRaised: { type: Number, default: 0 },
    reactionsGiven: { type: Number, default: 0 },
    moderationFlags: { type: Number, default: 0 }
  },
  voiceSettings: {
    preferredVoiceStyle: String,
    voiceModulationEnabled: { type: Boolean, default: false },
    micPermissionGranted: { type: Boolean, default: false },
    speakerPermissionGranted: { type: Boolean, default: false }
  },
  consentGiven: {
    participationConsent: { type: Boolean, default: false },
    recordingConsent: { type: Boolean, default: false },
    aiModerationConsent: { type: Boolean, default: false },
    emergencyProtocolConsent: { type: Boolean, default: false },
    dataProcessingConsent: { type: Boolean, default: false }
  },
  consentTimestamp: Date,
  exitReason: {
    type: String,
    enum: ['user_left', 'session_ended', 'kicked_out', 'connection_lost', 'emergency_exit'],
  },
  exitDetails: String,
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    suggestions: String,
    wouldRecommend: Boolean,
    reportIssues: [String],
    submittedAt: Date
  },
  followUp: {
    interestedInSimilarSessions: { type: Boolean, default: false },
    subscribedToUpdates: { type: Boolean, default: false },
    contactPreferences: {
      email: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    }
  },
  moderationFlags: [{
    flagType: String,
    flagReason: String,
    flaggedBy: String,
    flaggedAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolvedBy: String,
    resolvedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: { expireAfterSeconds: 0 }
  }
});

// Compound indexes for efficient queries
sessionAcknowledgmentSchema.index({ sessionId: 1, acknowledgedAt: -1 });
sessionAcknowledgmentSchema.index({ userId: 1, acknowledgedAt: -1 });
sessionAcknowledgmentSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
sessionAcknowledgmentSchema.index({ invitationId: 1, acknowledgedAt: -1 });

// Methods
sessionAcknowledgmentSchema.methods.recordJoin = function() {
  this.joinedAt = new Date();
  this.isActive = true;
  return this.save();
};

sessionAcknowledgmentSchema.methods.recordLeave = function(exitReason = 'user_left', exitDetails = '') {
  this.leftAt = new Date();
  this.exitReason = exitReason;
  this.exitDetails = exitDetails;
  
  if (this.joinedAt) {
    this.sessionDuration = this.leftAt.getTime() - this.joinedAt.getTime();
  }
  
  this.isActive = false;
  return this.save();
};

sessionAcknowledgmentSchema.methods.updateParticipationStats = function(stats) {
  Object.assign(this.participationStats, stats);
  return this.save();
};

sessionAcknowledgmentSchema.methods.updateVoiceSettings = function(settings) {
  Object.assign(this.voiceSettings, settings);
  return this.save();
};

sessionAcknowledgmentSchema.methods.giveConsent = function(consentType, granted = true) {
  if (this.consentGiven.hasOwnProperty(consentType)) {
    this.consentGiven[consentType] = granted;
    this.consentTimestamp = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

sessionAcknowledgmentSchema.methods.submitFeedback = function(feedbackData) {
  this.feedback = {
    ...this.feedback,
    ...feedbackData,
    submittedAt: new Date()
  };
  return this.save();
};

sessionAcknowledgmentSchema.methods.addModerationFlag = function(flagType, flagReason, flaggedBy) {
  this.moderationFlags.push({
    flagType,
    flagReason,
    flaggedBy,
    flaggedAt: new Date(),
    resolved: false
  });
  return this.save();
};

sessionAcknowledgmentSchema.methods.resolveModerationFlag = function(flagId, resolvedBy) {
  const flag = this.moderationFlags.id(flagId);
  if (flag) {
    flag.resolved = true;
    flag.resolvedBy = resolvedBy;
    flag.resolvedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
sessionAcknowledgmentSchema.statics.findActiveBySession = function(sessionId) {
  return this.find({
    sessionId,
    isActive: true,
    joinedAt: { $exists: true }
  }).sort({ joinedAt: -1 });
};

sessionAcknowledgmentSchema.statics.findByUserAndSession = function(userId, sessionId) {
  return this.findOne({ userId, sessionId });
};

sessionAcknowledgmentSchema.statics.getSessionStatistics = function(sessionId) {
  return this.aggregate([
    { $match: { sessionId } },
    {
      $group: {
        _id: null,
        totalAcknowledgments: { $sum: 1 },
        totalJoined: { $sum: { $cond: [{ $ifNull: ['$joinedAt', false] }, 1, 0] } },
        averageSessionDuration: { $avg: '$sessionDuration' },
        totalMessages: { $sum: '$participationStats.messagesCount' },
        totalVoiceTime: { $sum: '$participationStats.voiceActiveTime' },
        averageRating: { $avg: '$feedback.rating' },
        consentRates: {
          participation: { $avg: { $cond: ['$consentGiven.participationConsent', 1, 0] } },
          recording: { $avg: { $cond: ['$consentGiven.recordingConsent', 1, 0] } },
          aiModeration: { $avg: { $cond: ['$consentGiven.aiModerationConsent', 1, 0] } }
        }
      }
    }
  ]);
};

sessionAcknowledgmentSchema.statics.getUserParticipationHistory = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ acknowledgedAt: -1 })
    .limit(limit)
    .populate('sessionId', 'topic description hostAlias createdAt');
};

// Pre-save middleware
sessionAcknowledgmentSchema.pre('save', function(next) {
  // Auto-calculate session duration if not set
  if (this.joinedAt && this.leftAt && !this.sessionDuration) {
    this.sessionDuration = this.leftAt.getTime() - this.joinedAt.getTime();
  }
  
  next();
});

module.exports = mongoose.model('SessionAcknowledgment', sessionAcknowledgmentSchema);