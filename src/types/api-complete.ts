// Complete API types for FAANG-level type safety

// API Request types - Complete with all required fields
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
  alias?: string; // For backwards compatibility
  isAnonymous?: boolean;
}

export interface CreateLiveSanctuaryRequest {
  title: string;
  topic?: string; // For backwards compatibility
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
  // Additional backwards compatibility fields
  emoji?: string;
  expireHours?: number;
  scheduledAt?: Date;
}

export interface ApiPostRequest {
  content: string;
  feeling?: string;
  topic?: string;
  wantsExpertHelp: boolean;
  languageCode: string;
  attachments?: any[];
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

export interface ApiGeminiModerateRequest {
  content: string;
}

export interface ApiGeminiImproveRequest {
  content: string;
}

// Export all for easy importing
export type {
  ApiSanctuaryCreateRequest as ApiSanctuaryCreate,
  ApiSanctuaryJoinRequest as ApiSanctuaryJoin,
  CreateLiveSanctuaryRequest as CreateLiveSanctuary,
  ApiPostRequest as ApiPost,
  ApiCommentRequest as ApiComment,
  ApiExpertRegisterRequest as ApiExpertRegister,
  ApiChatSessionRequest as ApiChatSession,
  ApiGeminiModerateRequest as ApiGeminiModerate,
  ApiGeminiImproveRequest as ApiGeminiImprove
};