// Re-export enhanced Expert type
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
  expertId: string;
  userId: string;
  userAlias: string;
  scheduledTime?: string;
  status: "requested" | "scheduled" | "completed" | "canceled";
  sessionType: "chat" | "video" | "voice";
  notes?: string;
  meetingUrl?: string;
  createdAt: string;
}

// Sanctuary Session types
export interface SanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  expiresAt: string;
  participantCount: number;
  isActive: boolean;
  allowAnonymous?: boolean;
  mode?: 'public' | 'private' | 'invite-only';
}

export interface SanctuaryParticipant {
  id: string;
  alias: string;
  joinedAt: string;
  isAnonymous?: boolean;
  isHost?: boolean;
}

// API request types
export interface ApiPostRequest {
  content: string;
  feeling?: string;
  topic?: string;
  wantsExpertHelp?: boolean;
  languageCode?: string;
}

export interface ApiCommentRequest {
  content: string;
  languageCode?: string;
}

export interface ApiExpertRegisterRequest {
  name: string;
  email: string;
  specialization: string;
  bio: string;
  pricingModel: "free" | "donation" | "fixed";
  pricingDetails?: string;
  phoneNumber?: string;
}

export interface ApiChatSessionRequest {
  expertId: string;
  initialMessage?: string;
  sessionType: "chat" | "video" | "voice";
  scheduledTime?: string;
}

export interface ApiVerificationRequest {
  verificationLevel: "blue" | "gold" | "platinum" | "none";
  status: "approved" | "rejected";
  feedback?: string;
}

// Sanctuary API request types
export interface ApiSanctuaryCreateRequest {
  topic: string;
  description?: string;
  emoji?: string;
  expireHours?: number;
  allowAnonymous?: boolean;
}

export interface ApiSanctuaryJoinRequest {
  alias?: string;
  isAnonymous?: boolean;
}

// API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Gemini API request types
export interface ApiGeminiModerateRequest {
  content: string;
}

export interface ApiGeminiImproveRequest {
  content: string;
}

export interface ApiGeminiModerateImageRequest {
  imageUrl: string;
}

// Post form data type
export interface PostFormData {
  content: string;
  feeling?: string;
  topic?: string;
  wantsExpertHelp?: boolean;
}

// Live Sanctuary types
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

export interface LiveSanctuarySession {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  hostId: string;
  hostAlias?: string;
  participants: LiveSanctuaryParticipant[];
  participantCount: number;
  maxParticipants: number;
  audioOnly: boolean;
  allowAnonymous: boolean;
  moderationEnabled: boolean;
  emergencyContactEnabled: boolean;
  status: 'scheduled' | 'active' | 'ended';
  scheduledDateTime?: string;
  startedAt?: string;
  endedAt?: string;
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