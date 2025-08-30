const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const sanctuaryInvitationSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => `invitation-${nanoid(12)}`,
    unique: true,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  inviteCode: {
    type: String,
    default: () => nanoid(8),
    unique: true,
    required: true,
    index: true
  },
  inviteUrl: {
    type: String,
    required: true
  },
  qrCodeUrl: {
    type: String
  },
  createdBy: {
    type: String,
    required: true
  },
  creatorAlias: {
    type: String,
    required: true
  },
  sessionDetails: {
    topic: String,
    description: String,
    emoji: String,
    scheduledDateTime: Date,
    estimatedDuration: Number,
    maxParticipants: Number,
    hostAlias: String
  },
  accessLevel: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'invite_only'
  },
  maxUses: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  currentUses: {
    type: Number,
    default: 0
  },
  usageLog: [{
    userId: String,
    userAlias: String,
    ipAddress: String,
    userAgent: String,
    usedAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: Date
  }],
  restrictions: {
    requireAuthentication: { type: Boolean, default: false },
    allowedDomains: [String],
    blockedUsers: [String],
    oneTimeUse: { type: Boolean, default: false }
  },
  settings: {
    showSessionDetails: { type: Boolean, default: true },
    requireAcknowledgment: { type: Boolean, default: true },
    customWelcomeMessage: String,
    autoJoin: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: Date,
  deactivatedBy: String,
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
sanctuaryInvitationSchema.index({ sessionId: 1, isActive: 1 });
sanctuaryInvitationSchema.index({ createdBy: 1, createdAt: -1 });
sanctuaryInvitationSchema.index({ inviteCode: 1, isActive: 1 });

module.exports = mongoose.model('SanctuaryInvitation', sanctuaryInvitationSchema);