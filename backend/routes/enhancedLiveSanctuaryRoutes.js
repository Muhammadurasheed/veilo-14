const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const qrcode = require('qrcode');
const LiveSanctuarySession = require('../models/LiveSanctuarySession');
const SanctuaryInvitation = require('../models/SanctuaryInvitation');
const SessionAcknowledgment = require('../models/SessionAcknowledgment');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { generateRtcToken } = require('../utils/agoraTokenGenerator');
const redisService = require('../services/redisService');
const elevenLabsService = require('../services/elevenLabsService');
const aiModerationService = require('../services/aiModerationService');

// Enhanced Live Sanctuary session creation with scheduling support
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      topic,
      description,
      emoji,
      maxParticipants = 50,
      audioOnly = true,
      allowAnonymous = true,
      moderationEnabled = true,
      emergencyContactEnabled = true,
      scheduledDateTime,
      estimatedDuration = 60,
      tags = [],
      language = 'en',
      moderationLevel = 'medium',
      aiMonitoring = true,
      isRecorded = false,
      voiceModulationEnabled = true
    } = req.body;

    console.log('🎙️ Creating enhanced live sanctuary session:', { 
      topic, 
      hostId: req.user.id,
      scheduled: !!scheduledDateTime,
      voiceModulation: voiceModulationEnabled
    });

    if (!topic || topic.trim().length === 0) {
      return res.error('Topic is required', 400);
    }

    // Generate unique session ID and channel name
    const sessionId = `live-sanctuary-${nanoid(8)}`;
    const channelName = `sanctuary_${sessionId}`;
    const hostAlias = req.user.alias || `Host_${nanoid(4)}`;
    
    // Handle scheduling
    let isScheduled = false;
    let scheduledTime = null;
    let expiresAt = new Date();
    
    if (scheduledDateTime) {
      scheduledTime = new Date(scheduledDateTime);
      if (scheduledTime <= new Date()) {
        return res.error('Scheduled time must be in the future', 400);
      }
      isScheduled = true;
      // Expire 2 hours after scheduled end time
      expiresAt = new Date(scheduledTime.getTime() + (estimatedDuration + 120) * 60 * 1000);
    } else {
      // For immediate sessions, expire after 24 hours
      expiresAt.setHours(expiresAt.getHours() + 24);
    }
    
    // Generate Agora tokens with proper error handling
    let agoraToken, hostToken;
    try {
      const tokenDuration = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));
      agoraToken = generateRtcToken(channelName, 0, 'subscriber', tokenDuration * 3600);
      hostToken = generateRtcToken(channelName, req.user.id, 'publisher', tokenDuration * 3600);
      console.log('✅ Agora tokens generated successfully');
    } catch (agoraError) {
      console.warn('⚠️ Agora token generation failed, using placeholder:', agoraError.message);
      agoraToken = `temp_token_${nanoid(16)}`;
      hostToken = `temp_host_token_${nanoid(16)}`;
    }

    // Create session document
    const session = new LiveSanctuarySession({
      id: sessionId,
      topic: topic.trim(),
      description: description?.trim(),
      emoji: emoji || '🎙️',
      hostId: req.user.id,
      hostAlias,
      hostToken,
      agoraChannelName: channelName,
      agoraToken,
      expiresAt,
      scheduledAt: scheduledTime,
      isActive: !isScheduled, // Inactive if scheduled for future
      status: isScheduled ? 'scheduled' : 'active',
      participants: [{
        id: req.user.id,
        alias: hostAlias,
        isHost: true,
        isModerator: true,
        isMuted: false,
        isBlocked: false,
        handRaised: false,
        joinedAt: new Date(),
        avatarIndex: req.user.avatarIndex || 1,
        connectionStatus: 'connected',
        audioLevel: 0,
        speakingTime: 0
      }],
      maxParticipants,
      currentParticipants: isScheduled ? 0 : 1,
      allowAnonymous,
      audioOnly,
      moderationEnabled,
      emergencyContactEnabled,
      startTime: isScheduled ? null : new Date(),
      isRecorded,
      recordingConsent: [req.user.id],
      breakoutRooms: [],
      moderationLevel,
      emergencyProtocols: emergencyContactEnabled,
      aiMonitoring,
      estimatedDuration,
      tags,
      language
    });

    await session.save();

    // Store in Redis for real-time access
    const sessionState = {
      id: sessionId,
      topic: session.topic,
      hostId: session.hostId,
      hostAlias: session.hostAlias,
      isScheduled,
      scheduledDateTime: scheduledTime?.toISOString(),
      status: session.status,
      participants: session.participants,
      moderationLevel,
      voiceModulationEnabled,
      createdAt: new Date().toISOString()
    };
    
    await redisService.setSessionState(sessionId, sessionState);
    
    if (isScheduled) {
      await redisService.setScheduledSession(sessionId, {
        sessionId,
        topic: session.topic,
        scheduledDateTime: scheduledTime.toISOString(),
        hostId: session.hostId,
        hostAlias: session.hostAlias
      });
    }

    console.log('✅ Enhanced live sanctuary session created:', {
      sessionId,
      channelName,
      isScheduled,
      scheduledTime: scheduledTime?.toISOString()
    });

    // Enhanced response with scheduling info
    const sessionResponse = {
      id: session.id,
      topic: session.topic,
      description: session.description,
      emoji: session.emoji,
      hostId: session.hostId,
      hostAlias: session.hostAlias,
      agoraChannelName: session.agoraChannelName,
      agoraToken: session.agoraToken,
      hostToken: session.hostToken,
      expiresAt: session.expiresAt,
      scheduledAt: session.scheduledAt,
      estimatedDuration: session.estimatedDuration,
      maxParticipants: session.maxParticipants,
      currentParticipants: session.currentParticipants,
      allowAnonymous: session.allowAnonymous,
      audioOnly: session.audioOnly,
      moderationEnabled: session.moderationEnabled,
      moderationLevel: session.moderationLevel,
      emergencyContactEnabled: session.emergencyContactEnabled,
      status: session.status,
      isActive: session.isActive,
      isScheduled,
      tags: session.tags,
      language: session.language,
      voiceModulationEnabled,
      participants: session.participants
    };

    res.success({
      session: sessionResponse,
      id: sessionResponse.id,
      hostToken: sessionResponse.hostToken,
      scheduling: {
        isScheduled,
        scheduledDateTime: scheduledTime?.toISOString(),
        timeUntilStart: scheduledTime ? scheduledTime.getTime() - Date.now() : 0
      }
    }, 'Enhanced live sanctuary session created successfully');

  } catch (error) {
    console.error('❌ Enhanced live sanctuary creation error:', error);
    res.error('Failed to create live sanctuary session: ' + error.message, 500);
  }
});

// Create invitation link for session
router.post('/:sessionId/invite', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      maxUses = -1,
      expiryHours = 24,
      requireAuthentication = false,
      customWelcomeMessage,
      autoJoin = false
    } = req.body;

    const session = await LiveSanctuarySession.findOne({ id: sessionId });
    if (!session) {
      return res.error('Live sanctuary session not found', 404);
    }

    // Check if user is host or authorized
    if (session.hostId !== req.user.id && req.user.role !== 'admin') {
      return res.error('Only the host can create invitations', 403);
    }

    const inviteCode = nanoid(8).toUpperCase();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const inviteUrl = `${baseUrl}/sanctuary/join/${inviteCode}`;
    
    // Generate QR code
    let qrCodeUrl = null;
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(inviteUrl);
      qrCodeUrl = qrCodeDataUrl;
    } catch (qrError) {
      console.warn('⚠️ QR code generation failed:', qrError.message);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    const invitation = new SanctuaryInvitation({
      sessionId,
      inviteCode,
      inviteUrl,
      qrCodeUrl,
      createdBy: req.user.id,
      creatorAlias: req.user.alias,
      sessionDetails: {
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        scheduledDateTime: session.scheduledAt,
        estimatedDuration: session.estimatedDuration,
        maxParticipants: session.maxParticipants,
        hostAlias: session.hostAlias
      },
      maxUses,
      restrictions: {
        requireAuthentication,
        oneTimeUse: maxUses === 1
      },
      settings: {
        customWelcomeMessage,
        autoJoin,
        requireAcknowledgment: !autoJoin
      },
      expiresAt
    });

    await invitation.save();

    console.log('✅ Invitation created:', {
      sessionId,
      inviteCode,
      createdBy: req.user.id
    });

    res.success({
      invitation: {
        id: invitation.id,
        inviteCode: invitation.inviteCode,
        inviteUrl: invitation.inviteUrl,
        qrCodeUrl: invitation.qrCodeUrl,
        maxUses: invitation.maxUses,
        currentUses: invitation.currentUses,
        expiresAt: invitation.expiresAt,
        settings: invitation.settings
      }
    }, 'Invitation created successfully');

  } catch (error) {
    console.error('❌ Invitation creation error:', error);
    res.error('Failed to create invitation: ' + error.message, 500);
  }
});

// Join session via invitation code
router.post('/join/:inviteCode', optionalAuthMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { acknowledged = false, userAlias, voicePreferences = {} } = req.body;
    
    console.log('🚪 Joining via invitation code:', {
      inviteCode,
      hasUser: !!req.user,
      acknowledged
    });

    const invitation = await SanctuaryInvitation.findByInviteCode(inviteCode);
    if (!invitation) {
      return res.error('Invalid or expired invitation code', 404);
    }

    const userInfo = {
      userId: req.user?.id || `anonymous_${nanoid(8)}`,
      userAlias: userAlias || req.user?.alias || `Guest_${nanoid(4)}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Check if invitation can be used
    const canUse = invitation.canBeUsed(userInfo);
    if (!canUse.allowed) {
      return res.error(canUse.reason, 400);
    }

    const session = await LiveSanctuarySession.findOne({ id: invitation.sessionId });
    if (!session) {
      return res.error('Session not found', 404);
    }

    // Handle scheduled sessions
    if (session.status === 'scheduled' && session.scheduledAt) {
      const now = new Date();
      const scheduledTime = new Date(session.scheduledAt);
      const timeUntilStart = scheduledTime.getTime() - now.getTime();
      
      if (timeUntilStart > 15 * 60 * 1000) { // More than 15 minutes early
        return res.success({
          sessionStatus: 'scheduled',
          timeUntilStart,
          scheduledDateTime: session.scheduledAt,
          sessionDetails: {
            topic: session.topic,
            description: session.description,
            emoji: session.emoji,
            hostAlias: session.hostAlias,
            estimatedDuration: session.estimatedDuration
          },
          requiresAcknowledgment: invitation.settings.requireAcknowledgment && !acknowledged
        }, 'Session is scheduled for the future');
      }
    }

    // Check if acknowledgment is required
    if (invitation.settings.requireAcknowledgment && !acknowledged) {
      return res.success({
        sessionStatus: 'requires_acknowledgment',
        sessionDetails: {
          topic: session.topic,
          description: session.description,
          emoji: session.emoji,
          hostAlias: session.hostAlias,
          scheduledDateTime: session.scheduledAt,
          estimatedDuration: session.estimatedDuration,
          maxParticipants: session.maxParticipants,
          currentParticipants: session.currentParticipants,
          moderationLevel: session.moderationLevel,
          aiMonitoring: session.aiMonitoring
        },
        welcomeMessage: invitation.settings.customWelcomeMessage,
        consentRequired: {
          participationConsent: true,
          recordingConsent: session.isRecorded,
          aiModerationConsent: session.aiMonitoring,
          emergencyProtocolConsent: session.emergencyProtocols
        }
      }, 'Acknowledgment required before joining');
    }

    // Record acknowledgment
    const acknowledgment = new SessionAcknowledgment({
      sessionId: session.id,
      invitationId: invitation.id,
      userId: userInfo.userId,
      userAlias: userInfo.userAlias,
      isAnonymous: !req.user,
      acknowledgmentType: 'invitation_link',
      sessionDetails: {
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        hostAlias: session.hostAlias,
        scheduledDateTime: session.scheduledAt,
        estimatedDuration: session.estimatedDuration,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        isScheduled: !!session.scheduledAt
      },
      clientInfo: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        platform: req.get('sec-ch-ua-platform')
      },
      voiceSettings: {
        preferredVoiceStyle: voicePreferences.voiceStyle || 'natural',
        voiceModulationEnabled: voicePreferences.enableModulation || false
      },
      consentGiven: {
        participationConsent: acknowledged,
        recordingConsent: acknowledged && session.isRecorded,
        aiModerationConsent: acknowledged && session.aiMonitoring,
        emergencyProtocolConsent: acknowledged && session.emergencyProtocols
      },
      consentTimestamp: acknowledged ? new Date() : null
    });

    await acknowledgment.save();

    // Increment invitation usage
    await invitation.incrementUsage(userInfo);

    console.log('✅ User acknowledged session via invitation:', {
      sessionId: session.id,
      userId: userInfo.userId,
      inviteCode
    });

    res.success({
      sessionStatus: 'acknowledged',
      sessionId: session.id,
      acknowledgmentId: acknowledgment.id,
      sessionDetails: {
        id: session.id,
        topic: session.topic,
        description: session.description,
        emoji: session.emoji,
        hostAlias: session.hostAlias,
        agoraChannelName: session.agoraChannelName,
        agoraToken: session.agoraToken,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        moderationLevel: session.moderationLevel,
        allowAnonymous: session.allowAnonymous,
        emergencyContactEnabled: session.emergencyContactEnabled
      },
      userToken: {
        userId: userInfo.userId,
        userAlias: userInfo.userAlias,
        voiceSettings: acknowledgment.voiceSettings
      }
    }, 'Session acknowledged successfully');

  } catch (error) {
    console.error('❌ Join via invitation error:', error);
    res.error('Failed to join session: ' + error.message, 500);
  }
});

// Get available voice styles from ElevenLabs
router.get('/voice-styles', optionalAuthMiddleware, async (req, res) => {
  try {
    if (!elevenLabsService.isEnabled()) {
      return res.error('Voice modulation service not available', 503);
    }

    const voiceStyles = elevenLabsService.getAvailableVoiceStyles();
    
    res.success({
      voiceStyles,
      isEnabled: true,
      defaultStyle: 'natural'
    }, 'Voice styles retrieved successfully');

  } catch (error) {
    console.error('❌ Voice styles error:', error);
    res.error('Failed to get voice styles: ' + error.message, 500);
  }
});

// Update participant voice settings
router.post('/:sessionId/voice-settings', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { voiceStyle, enableModulation = false, voiceSettings = {} } = req.body;

    // Validate voice style
    const validatedSettings = await elevenLabsService.validateVoiceSettings({
      voice_style: voiceStyle,
      enableModulation,
      ...voiceSettings
    });

    // Store in Redis for real-time access
    await redisService.setVoiceSettings(sessionId, req.user.id, validatedSettings);

    // Update acknowledgment record if exists
    const acknowledgment = await SessionAcknowledgment.findByUserAndSession(req.user.id, sessionId);
    if (acknowledgment) {
      await acknowledgment.updateVoiceSettings(validatedSettings);
    }

    console.log('✅ Voice settings updated:', {
      sessionId,
      userId: req.user.id,
      voiceStyle: validatedSettings.voice_style
    });

    res.success({
      voiceSettings: validatedSettings
    }, 'Voice settings updated successfully');

  } catch (error) {
    console.error('❌ Voice settings update error:', error);
    res.error('Failed to update voice settings: ' + error.message, 500);
  }
});

// Enhanced session status with scheduling info
router.get('/:sessionId/status', optionalAuthMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Try Redis first for real-time status
    let sessionState = await redisService.getSessionState(sessionId);
    
    if (!sessionState) {
      // Fallback to database
      const session = await LiveSanctuarySession.findOne({ id: sessionId });
      if (!session) {
        return res.error('Session not found', 404);
      }

      sessionState = {
        id: session.id,
        topic: session.topic,
        status: session.status,
        isScheduled: !!session.scheduledAt,
        scheduledDateTime: session.scheduledAt?.toISOString(),
        currentParticipants: session.currentParticipants,
        maxParticipants: session.maxParticipants
      };
    }

    const now = new Date();
    let timeUntilStart = 0;
    let canJoin = true;
    let joinMessage = 'Ready to join';

    if (sessionState.isScheduled && sessionState.scheduledDateTime) {
      const scheduledTime = new Date(sessionState.scheduledDateTime);
      timeUntilStart = scheduledTime.getTime() - now.getTime();
      
      if (timeUntilStart > 15 * 60 * 1000) { // More than 15 minutes early
        canJoin = false;
        joinMessage = `Session starts in ${Math.ceil(timeUntilStart / (1000 * 60))} minutes`;
      } else if (timeUntilStart > 0) {
        joinMessage = 'Session starting soon - you can join now';
      }
    }

    res.success({
      sessionId,
      status: sessionState.status,
      isScheduled: sessionState.isScheduled,
      scheduledDateTime: sessionState.scheduledDateTime,
      timeUntilStart,
      canJoin,
      joinMessage,
      currentParticipants: sessionState.currentParticipants,
      maxParticipants: sessionState.maxParticipants,
      isFull: sessionState.currentParticipants >= sessionState.maxParticipants
    }, 'Session status retrieved');

  } catch (error) {
    console.error('❌ Session status error:', error);
    res.error('Failed to get session status: ' + error.message, 500);
  }
});

module.exports = router;