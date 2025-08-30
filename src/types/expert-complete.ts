// Complete Expert type with all required properties - FAANG level type safety
export interface ExpertComplete {
  // Core identification
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  
  // Professional info
  specialization: string;
  bio: string;
  headline?: string;
  
  // Location and languages
  location?: {
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
  };
  languages?: string[];
  
  // Verification and status
  verificationLevel: 'blue' | 'gold' | 'platinum' | 'none';
  verified: boolean;
  accountStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  
  // Pricing
  pricingModel: 'free' | 'donation' | 'fixed';
  pricingDetails?: string;
  hourlyRate?: number;
  
  // Performance metrics - REQUIRED fields that were missing
  rating: number;
  totalRatings?: number;
  totalSessions: number;
  completedSessions: number;
  profileViews: number;
  profileViewsThisMonth: number;
  followersCount: number;
  
  // Activity tracking
  responseTime?: string;
  isOnline?: boolean;
  lastActive?: string;
  createdAt: string;
  lastUpdated: string;
  
  // Content and social
  testimonials?: Array<{
    id: string;
    text: string;
    user: {
      alias: string;
      avatarIndex: number;
    };
  }>;
  topicsHelped?: string[];
  skills?: string[];
  certifications?: string[];
  followers?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    instagram?: string;
  };
  achievements?: string[];
  yearsOfExperience?: number;
  
  // Experience and education
  workExperience?: Array<{
    id: string;
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
    skills?: string[];
  }>;
  education?: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
  }>;
  
  // Availability and preferences
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
  
  // Verification documents
  verificationDocuments?: Array<{
    id: string;
    type: 'id' | 'credential' | 'certificate' | 'other' | 'photo' | 'resume' | 'cv';
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  
  // Admin notes
  adminNotes?: Array<{
    id: string;
    note: string;
    category: string;
    date: string;
    adminId: string;
    action: string;
  }>;
  
  // Additional data
  resumeData?: any;
  profileEnhancements?: any;
}

// Helper function to create complete Expert with defaults
export const createCompleteExpert = (partial: Partial<ExpertComplete>): ExpertComplete => {
  const now = new Date().toISOString();
  
  return {
    // Required fields with defaults
    id: partial.id || '',
    userId: partial.userId || '',
    name: partial.name || '',
    email: partial.email || '',
    specialization: partial.specialization || '',
    bio: partial.bio || '',
    verificationLevel: partial.verificationLevel || 'none',
    verified: partial.verified ?? false,
    accountStatus: partial.accountStatus || 'pending',
    pricingModel: partial.pricingModel || 'free',
    rating: partial.rating ?? 0,
    totalSessions: partial.totalSessions ?? 0,
    completedSessions: partial.completedSessions ?? 0,
    profileViews: partial.profileViews ?? 0,
    profileViewsThisMonth: partial.profileViewsThisMonth ?? 0,
    followersCount: partial.followersCount ?? 0,
    createdAt: partial.createdAt || now,
    lastUpdated: partial.lastUpdated || now,
    
    // Optional fields
    ...partial
  };
};

// Export as Expert for backward compatibility
export type Expert = ExpertComplete;