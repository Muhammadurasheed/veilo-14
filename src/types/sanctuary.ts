// Sanctuary-specific types

export interface CreateLiveSanctuaryRequest {
  topic: string;
  title?: string;
  description?: string;
  emoji?: string;
  maxParticipants?: number;
  audioOnly?: boolean;
  allowAnonymous?: boolean;
  moderationEnabled?: boolean;
  emergencyContactEnabled?: boolean;
  expireHours?: number;
  scheduledDateTime?: string;
  estimatedDuration?: number;
  tags?: string[];
  language?: string;
  moderationLevel?: string;
}

export interface AIModerationLog {
  id: string;
  sessionId: string;
  type: 'warning' | 'intervention' | 'escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface SanctuaryAlert {
  id: string;
  type: 'crisis' | 'conflict' | 'spam' | 'inappropriate';
  sessionId: string;
  participantId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
}

export interface ModerationAction {
  id: string;
  type: 'warning' | 'mute' | 'kick' | 'ban';
  sessionId: string;
  targetId: string;
  moderatorId: string;
  reason: string;
  timestamp: string;
  duration?: number;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  topic?: string;
  currentParticipants: number;
  maxParticipants: number;
  createdAt: string;
  isActive: boolean;
  isPrivate: boolean;
  hostId: string;
  participants: string[];
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  fileUrl?: string;
  transcriptUrl?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  isActive: boolean;
}

// Use the LiveSanctuarySession from types/index.ts to avoid conflicts
// This interface extends the base one with sanctuary-specific properties
export interface ExtendedLiveSanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  hostId: string;
  hostAlias: string;
  createdAt: string;
  startTime?: string;
  scheduledDateTime?: string;
  isActive: boolean;
  status?: 'pending' | 'active' | 'ended';
  mode: 'public' | 'private' | 'invite-only';
  participants: LiveParticipant[];
  maxParticipants: number;
  currentParticipants?: number;
  estimatedDuration?: number;
  tags?: string[];
  language?: string;
  expiresAt?: string;
  allowAnonymous?: boolean;
  recordingConsent?: boolean;
  aiMonitoring?: boolean;
  moderationLevel?: 'low' | 'medium' | 'high' | 'strict';
  emergencyProtocols?: boolean;
  isRecorded?: boolean;
  hostToken?: string;
  agoraChannelName?: string;
  agoraToken?: string;
  audioOnly?: boolean;
  breakoutRooms?: any[];
  moderationEnabled?: boolean;
  emergencyContactEnabled?: boolean;
}

export interface LiveParticipant {
  id: string;
  alias: string;
  avatarIndex?: number;
  joinedAt: string;
  isHost: boolean;
  isMuted: boolean;
  isModerator?: boolean;
  isBlocked?: boolean;
  audioLevel?: number;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  handRaised?: boolean;
  speakingTime?: number;
  reactions?: EmojiReaction[];
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  participantId: string;
  timestamp: string;
  duration?: number;
}

// Remove the conflicting export since LiveSanctuarySession is defined in index.ts
// export { LiveSanctuarySession } from '@/types/index';