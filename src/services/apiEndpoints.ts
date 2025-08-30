// FAANG-level API Endpoints - Complete type safety and consistency
import { ApiResponse } from './apiClient';
import {
  User,
  Expert,
  Post,
  Session,
  Booking,
  SanctuarySession,
  LiveSanctuaryParticipant,
  CreateLiveSanctuaryRequest,
  ApiPostRequest,
  ApiCommentRequest,
  ApiExpertRegisterRequest,
  ApiChatSessionRequest,
  ApiSanctuaryCreateRequest,
  ApiSanctuaryJoinRequest,
  ApiGeminiModerateRequest,
  ApiGeminiImproveRequest
} from '@/types';

// Authentication endpoints
export interface AuthEndpoints {
  login: (email: string, password: string) => Promise<ApiResponse<{ token: string; refreshToken: string; user: any }>>;
  register: () => Promise<ApiResponse<{ token: string; refreshToken: string; user: any }>>;
  createAnonymousUser: () => Promise<ApiResponse<{ token: string; refreshToken: string; user: any }>>;
  refreshToken: (refreshToken: string) => Promise<ApiResponse<{ token: string; refreshToken: string }>>;
  updateProfile: (data: any) => Promise<ApiResponse<any>>;
  authenticate: (token: string) => Promise<ApiResponse<any>>;
  getCurrentUser: () => Promise<ApiResponse<any>>;
  refreshIdentity: () => Promise<ApiResponse<any>>;
  updateAvatar: (avatarUrl: string) => Promise<ApiResponse<any>>;
  registerExpertAccount: (userData: Partial<ApiExpertRegisterRequest>) => Promise<ApiResponse<any>>;
}

// Posts endpoints
export interface PostsEndpoints {
  getPosts: () => Promise<ApiResponse<Post[]>>;
  createPost: (postData: ApiPostRequest) => Promise<ApiResponse<Post>>;
  likePost: (postId: string, userId: string) => Promise<ApiResponse<void>>;
  addComment: (commentData: ApiCommentRequest) => Promise<ApiResponse<void>>;
}

// Experts endpoints
export interface ExpertsEndpoints {
  getExperts: () => Promise<ApiResponse<Expert[]>>;
  getExpert: (expertId: string) => Promise<ApiResponse<Expert>>;
  registerExpert: (expertData: ApiExpertRegisterRequest) => Promise<ApiResponse<Expert>>;
  updateExpert: (expertId: string, expertData: Partial<Expert>) => Promise<ApiResponse<Expert>>;
  searchExperts: (query: string) => Promise<ApiResponse<Expert[]>>;
  followExpert: (expertId: string) => Promise<ApiResponse<{ isFollowing: boolean }>>;
  getPendingExperts: () => Promise<ApiResponse<{ experts: Expert[] }>>;
  updateExpertStatus: (id: string, data: { verificationLevel: string; status: string }) => Promise<ApiResponse<any>>;
}

// Sessions endpoints
export interface SessionsEndpoints {
  createSession: (sessionData: ApiChatSessionRequest) => Promise<ApiResponse<Session>>;
  getSession: (sessionId: string) => Promise<ApiResponse<Session>>;
  getUserSessions: (userId: string) => Promise<ApiResponse<Session[]>>;
  endSession: (sessionId: string) => Promise<ApiResponse<void>>;
  rateSession: (sessionId: string, rating: number, feedback?: string) => Promise<ApiResponse<void>>;
}

// Bookings endpoints
export interface BookingsEndpoints {
  createBooking: (bookingData: Omit<Booking, 'id'>) => Promise<ApiResponse<Booking>>;
  getUserBookings: (userId: string) => Promise<ApiResponse<Booking[]>>;
  getExpertBookings: (expertId: string) => Promise<ApiResponse<Booking[]>>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<ApiResponse<Booking>>;
  cancelBooking: (bookingId: string) => Promise<ApiResponse<void>>;
}

// Sanctuary endpoints
export interface SanctuaryEndpoints {
  createSession: (sessionData: ApiSanctuaryCreateRequest) => Promise<ApiResponse<any>>;
  getSession: (sessionId: string) => Promise<ApiResponse<SanctuarySession>>;
  joinSession: (sessionId: string, joinData: ApiSanctuaryJoinRequest) => Promise<ApiResponse<SanctuarySession>>;
  endSession: (sessionId: string, hostToken?: string) => Promise<ApiResponse<void>>;
  removeParticipant: (sessionId: string, participantId: string, hostToken?: string) => Promise<ApiResponse<void>>;
  leaveSession: (sessionId: string, participantId?: string) => Promise<ApiResponse<void>>;
  flagSession: (sessionId: string, reason: string) => Promise<ApiResponse<any>>;
  getSubmissions: () => Promise<ApiResponse<any>>;
}

// Live Sanctuary endpoints for enhanced features
export interface LiveSanctuaryEndpoints {
  createSession: (sessionData: CreateLiveSanctuaryRequest) => Promise<ApiResponse<SanctuarySession>>;
  joinSession: (sessionId: string, participantData: { alias: string }) => Promise<ApiResponse<SanctuarySession>>;
  leaveSession: (sessionId: string) => Promise<ApiResponse<SanctuarySession>>;
  getActiveSessions: () => Promise<ApiResponse<SanctuarySession[]>>;
  getUserSessions: (userId: string) => Promise<ApiResponse<SanctuarySession[]>>;
  getSessionDetails: (sessionId: string) => Promise<ApiResponse<SanctuarySession>>;
  inviteToSession: (sessionId: string, inviteData: any) => Promise<ApiResponse<any>>;
  getSessionStatus: (sessionId: string) => Promise<ApiResponse<SanctuarySession>>;
  updateSessionSettings: (sessionId: string, settings: any) => Promise<ApiResponse<SanctuarySession>>;
  getSessionRecording: (sessionId: string) => Promise<ApiResponse<any>>;
  enableRecording: (sessionId: string) => Promise<ApiResponse<any>>;
  disableRecording: (sessionId: string) => Promise<ApiResponse<any>>;
}

// Gemini AI endpoints
export interface GeminiEndpoints {
  moderate: (data: ApiGeminiModerateRequest) => Promise<ApiResponse<any>>;
  improve: (data: ApiGeminiImproveRequest) => Promise<ApiResponse<any>>;
}

// Complete API interface
export interface ApiEndpoints {
  auth: AuthEndpoints;
  posts: PostsEndpoints;
  experts: ExpertsEndpoints;
  sessions: SessionsEndpoints;
  bookings: BookingsEndpoints;
  sanctuary: SanctuaryEndpoints;
  liveSanctuary: LiveSanctuaryEndpoints;
  gemini: GeminiEndpoints;
}

// Legacy export alias for backwards compatibility
export type SanctuaryApi = SanctuaryEndpoints;
export type LiveSanctuaryApi = LiveSanctuaryEndpoints;