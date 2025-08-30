// Re-export enhanced Expert type - cleaned of duplicates
export type { Expert } from './expert-final';

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

// API Request types
export interface ApiPostRequest {
  content: string;
  feeling?: string;
  topic?: string;
  wantsExpertHelp: boolean;
  languageCode: string;
  attachments?: PostAttachment[];
}

export interface ApiCommentRequest {
  postId: string;
  content: string;
  languageCode: string;
}

export interface ApiExpertRegisterRequest {
  name: string;
  email: string;
  phoneNumber?: string;
  specialization: string;
  bio: string;
  headline?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
  };
  languages?: string[];
  pricingModel: 'free' | 'donation' | 'fixed';
  pricingDetails?: string;
  hourlyRate?: number;
  skills?: string[];
  certifications?: string[];
  workExperience?: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
    skills?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
  }>;
  availability?: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    timeSlots: Array<{
      start: string;
      end: string;
      available: boolean;
    }>;
  }>;
  sessionPreferences?: {
    voiceMasking: boolean;
    allowRecording: boolean;
    sessionTypes: {
      chat: boolean;
      voice: boolean;
      video: boolean;
    };
    minDuration: number;
    maxDuration: number;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    instagram?: string;
  };
  yearsOfExperience?: number;
}

export interface ApiChatSessionRequest {
  recipientId: string;
  sessionType: 'chat' | 'voice' | 'video';
}

export interface ApiSanctuaryCreateRequest {
  topic: string;
  description?: string;
  emoji?: string;
  maxParticipants?: number;
  audioOnly: boolean;
  allowAnonymous: boolean;
  moderationEnabled: boolean;
  emergencyContactEnabled: boolean;
  expireHours: number;
}

export interface ApiSanctuaryJoinRequest {
  participantAlias: string;
  isAnonymous?: boolean;
}

// Live Sanctuary types
export interface CreateLiveSanctuaryRequest {
  title: string;
  description?: string;
  tags?: string[];
  maxParticipants?: number;
  isScheduled?: boolean;
  scheduledDateTime?: string;
  estimatedDuration?: number;
  isPrivate?: boolean;
  requireApproval?: boolean;
  emergencyProtocols?: boolean;
  aiMonitoring?: boolean;
  recordingConsent?: boolean;
  language?: string;
}

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

// Export as LiveParticipant (legacy alias) - make them compatible
export interface LiveParticipant {
  id: string;
  alias: string;
  avatarIndex?: number;
  joinedAt: string;
  isHost: boolean;
  isMuted?: boolean;
  isModerator?: boolean;
  isBlocked?: boolean;
  audioLevel?: number;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  handRaised?: boolean;
  speakingTime?: number;
  reactions?: EmojiReaction[];
  isAnonymous?: boolean;
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

// Gemini API types
export interface ApiGeminiModerateRequest {
  content: string;
}

export interface ApiGeminiImproveRequest {
  content: string;
}