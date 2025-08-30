// FAANG-level type system - Complete and consistent
// Re-export complete Expert type - no duplicates
export type { Expert } from './expert-complete';
export type { LiveParticipant } from './sanctuary';

// Import complete API types
export type {
  ApiSanctuaryCreateRequest,
  ApiSanctuaryJoinRequest,
  CreateLiveSanctuaryRequest,
  ApiPostRequest,
  ApiCommentRequest,
  ApiExpertRegisterRequest,
  ApiChatSessionRequest,
  ApiGeminiModerateRequest,
  ApiGeminiImproveRequest
} from './api-complete';

// User-related types
export enum UserRole {
  SHADOW = "shadow",
  BEACON = "beacon", 
  ADMIN = "admin"
}

export interface User {
  id: string;
  alias: string;
  avatarIndex: number;
  loggedIn: boolean;
  role?: UserRole;
  expertId?: string;
  isAnonymous?: boolean;
  avatarUrl?: string;
}

// Post-related types
export interface PostAttachment {
  type: 'image' | 'video';
  url: string;
  filename: string;
  size: number;
}

export interface Post {
  id: string;
  userId: string;
  userAlias: string;
  userAvatarIndex: number;
  content: string;
  feeling?: string;
  topic?: string;
  timestamp: string;
  likes: string[];
  comments: Comment[];
  attachments?: PostAttachment[];
  wantsExpertHelp: boolean;
  languageCode: string;
  flagged?: boolean;
  flagReason?: string;
  status?: 'active' | 'flagged' | 'hidden';
}

export interface Comment {
  id: string;
  userId: string;
  userAlias: string;
  userAvatarIndex: number;
  isExpert: boolean;
  expertId?: string;
  content: string;
  timestamp: string;
  languageCode: string;
}

// Sanctuary types  
export interface SanctuaryMessage {
  id: string;
  participantId: string;
  participantAlias: string;
  content: string;
  timestamp: string;
  type: "text" | "system" | "emoji-reaction";
}

export interface AdminNote {
  id: string;
  note: string;
  category: string;
  date: string | Date;
  adminId: string;
  action: string;
}

export interface Testimonial {
  id: string;
  text: string;
  user: {
    alias: string;
    avatarIndex: number;
  };
}

export interface VerificationDocument {
  id: string;
  type: 'id' | 'credential' | 'certificate' | 'other' | 'photo' | 'resume' | 'cv';
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  status: "pending" | "approved" | "rejected";
}

// Session-related types
export interface Session {
  id: string;
  sessionId: string;
  user1Id: string;
  user2Id: string;
  expertId?: string;
  sessionType: 'chat' | 'voice' | 'video';
  status: 'active' | 'ended' | 'cancelled' | 'requested' | 'scheduled' | 'completed' | 'canceled';
  startTime: string;
  endTime?: string;
  scheduledTime?: string;
  rating?: number;
  feedback?: string;
  notes?: string;
  createdAt?: string; // Added missing field
}

export interface Booking {
  id: string;
  userId: string;
  expertId: string;
  sessionType: 'chat' | 'voice' | 'video';
  scheduledDateTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

// Live Sanctuary types - Complete with all required properties
export interface LiveSanctuarySession {
  id: string;
  title: string;
  topic?: string; // backward compatibility  
  emoji?: string; // backward compatibility
  description?: string;
  hostId: string;
  hostAlias: string;
  participants: LiveSanctuaryParticipant[];
  maxParticipants: number;
  status: 'waiting' | 'active' | 'ended';
  isScheduled?: boolean;
  scheduledDateTime?: string;
  estimatedDuration?: number;
  tags?: string[];
  language?: string;
  moderationLevel?: string;
  hostToken: string;
  inviteLink: string;
  createdAt: string;
  updatedAt: string;
  // Additional properties for backwards compatibility
  mode?: 'public' | 'private' | 'invite-only';
  startTime?: string;
  currentParticipants?: number;
  participantCount?: number; // Added for compatibility
  isActive?: boolean;
  expiresAt?: string;
  recordingConsent?: any;
  agoraChannelName?: string;
  agoraToken?: string;
  breakoutRooms?: any[];
  isRecorded?: boolean;
  aiMonitoring?: boolean;
  emergencyProtocols?: boolean;
}

// Main Sanctuary Session type (backwards compatible)
export interface SanctuarySession extends LiveSanctuarySession {
  // All LiveSanctuarySession properties included via extension
  topic: string; // Make topic required for backwards compatibility
}

export interface LiveSanctuaryParticipant {
  id: string;
  alias: string;
  isHost: boolean;
  isAnonymous: boolean;
  joinedAt: string;
  isMuted?: boolean;
  micPermission?: 'granted' | 'denied' | 'pending';
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  participantId: string;
  timestamp: string;
  duration?: number;
}

export interface LiveSanctuaryInvitation {
  id: string;
  sessionId: string;
  invitedBy: string;
  invitedByAlias: string;
  inviteToken: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}