// Enhanced Expert types with complete property definitions
export interface Expert {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  specialization: string;
  bio: string;
  headline: string; // Now required
  location: {
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
  };
  languages: string[]; // Now required
  verificationLevel: 'blue' | 'gold' | 'platinum' | 'none';
  verified: boolean;
  pricingModel: 'free' | 'donation' | 'fixed';
  pricingDetails?: string;
  hourlyRate: number; // Now required
  rating: number;
  totalRatings: number; // Now required
  totalSessions: number;
  completedSessions: number;
  responseTime: string; // Now required
  isOnline: boolean; // Now required
  lastActive?: string;
  createdAt: string;
  testimonials: Array<{
    id: string;
    text: string;
    user: {
      alias: string;
      avatarIndex: number;
    };
  }>;
  topicsHelped?: string[];
  skills: string[]; // Now required
  certifications: string[]; // Now required
  workExperience: Array<{
    id: string;
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
    skills?: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
  }>;
  availability: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    timeSlots: Array<{
      start: string;
      end: string;
      available: boolean;
    }>;
  }>;
  sessionPreferences: {
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
  followers: string[]; // Now required
  followersCount: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    instagram?: string;
  };
  achievements?: string[];
  yearsOfExperience?: number;
  resumeData?: {
    personalInfo?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    education?: Array<{
      degree?: string;
      institution?: string;
      field?: string;
      year?: string;
      raw?: string;
    }>;
    experience?: Array<{
      position?: string;
      company?: string;
      duration?: string;
      responsibilities?: string[];
      raw?: string;
    }>;
    skills?: {
      technical?: string[];
      clinical?: string[];
      soft?: string[];
      other?: string[];
    };
    certifications?: Array<{
      name?: string;
      type?: string;
      year?: string;
      mentioned?: boolean;
    }>;
    summary?: string;
    specializations?: Array<{
      name?: string;
      confidence?: number;
      matchedKeywords?: string[];
    }>;
    yearsOfExperience?: number;
    keyHighlights?: string[];
    lastParsed?: string | Date;
  };
  profileEnhancements?: {
    professionalSummary?: string;
    timeline?: Array<{
      year?: string;
      title?: string;
      description?: string;
      type?: 'education' | 'experience' | 'certification' | 'achievement';
    }>;
    expertise?: Array<{
      category?: string;
      skills?: string[];
      level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    }>;
    achievements?: string[];
    specialtyTags?: string[];
  };
}

// Type utility to provide default values for Expert properties
export const createExpertDefaults = (expert: Partial<Expert>): Expert => ({
  headline: '',
  location: {},
  languages: [],
  hourlyRate: 0,
  totalRatings: 0,
  responseTime: 'Within 24 hours',
  isOnline: false,
  testimonials: [],
  skills: [],
  certifications: [],
  workExperience: [],
  education: [],
  availability: [],
  sessionPreferences: {
    voiceMasking: false,
    allowRecording: false,
    sessionTypes: {
      chat: true,
      voice: true,
      video: false,
    },
    minDuration: 30,
    maxDuration: 120,
  },
  followers: [],
  ...expert,
} as Expert);