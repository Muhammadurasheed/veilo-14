// Final Expert type to override all conflicts  
export interface Expert {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
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
  verificationLevel: 'blue' | 'gold' | 'platinum' | 'none';
  verified: boolean;
  pricingModel: 'free' | 'donation' | 'fixed';
  pricingDetails?: string;
  hourlyRate?: number;
  rating: number;
  totalRatings?: number;
  totalSessions: number;
  completedSessions: number;
  responseTime?: string;
  isOnline?: boolean;
  lastActive?: string;
  createdAt: string;
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
  verificationDocuments?: Array<{
    id: string;
    type: 'id' | 'credential' | 'certificate' | 'other' | 'photo' | 'resume' | 'cv';
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  accountStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  adminNotes?: Array<{
    id: string;
    note: string;
    category: string;
    date: string;
    adminId: string;
    action: string;
  }>;
  profileViews: number;
  profileViewsThisMonth: number;
  lastUpdated: string;
  followers?: string[];
  followersCount: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    instagram?: string;
  };
  achievements?: string[];
  yearsOfExperience?: number;
  resumeData?: any;
  profileEnhancements?: any;
}

