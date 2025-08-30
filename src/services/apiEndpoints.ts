/**
 * FLAGSHIP API ENDPOINTS - Centralized API Endpoint Management
 * 
 * This module provides a type-safe, centralized way to manage all API endpoints.
 * All API calls should use these predefined endpoints to ensure consistency
 * and make endpoint changes manageable across the entire application.
 */

import { apiClient, ApiResponse } from './apiClient';
import type {
  User,
  Expert,
  Post,
  Comment,
  Session,
  SanctuarySession,
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

/**
 * Authentication Endpoints
 */
export const AuthApi = {
  // User registration and login
  async register(userData: Partial<User> = {}): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    return apiClient.post('/api/auth/register', userData);
  },

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    return apiClient.post('/api/auth/login', credentials);
  },

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post('/api/auth/logout');
  },

  // Token management
  async verify(token: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get('/api/auth/verify', {
      headers: { 'x-auth-token': token }
    });
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
    return apiClient.post('/api/auth/refresh-token', { refreshToken });
  },

  // Legacy authentication method
  async authenticate(token: string): Promise<ApiResponse<{ user: User }>> {
    return this.verify(token);
  },

  // Anonymous user creation
  async createAnonymous(): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> {
    return apiClient.post('/api/auth/anonymous');
  },

  // Profile management
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put('/api/auth/profile', updates);
  },

  async refreshIdentity(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/api/auth/refresh-identity');
  },

  async updateAvatar(avatarUrl: string): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put('/api/auth/avatar', { avatarUrl });
  },

  // Admin authentication
  async adminLogin(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    return apiClient.post('/api/auth/admin/login', credentials);
  },

  async verifyAdmin(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get('/api/admin/verify');
  }
} as const;

/**
 * Expert Management Endpoints
 */
export const ExpertApi = {
  // Expert registration and profile
  async register(expertData: ApiExpertRegisterRequest): Promise<ApiResponse<{ expert: Expert }>> {
    return apiClient.post('/api/experts/register', expertData);
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    specialization?: string;
    verificationLevel?: string;
    search?: string;
  }): Promise<ApiResponse<{ experts: Expert[]; pagination?: any }>> {
    return apiClient.get('/api/experts', { params });
  },

  // Legacy method names for compatibility
  async getExperts(params?: any): Promise<ApiResponse<{ experts: Expert[]; pagination?: any }>> {
    return this.getAll(params);
  },

  async getById(id: string): Promise<ApiResponse<{ expert: Expert }>> {
    return apiClient.get(`/api/experts/${id}`);
  },

  async update(id: string, updates: Partial<Expert>): Promise<ApiResponse<{ expert: Expert }>> {
    return apiClient.put(`/api/experts/${id}`, updates);
  },

  // Document management
  async uploadDocument(
    expertId: string, 
    file: File, 
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ document: any }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    return apiClient.upload(`/api/experts/${expertId}/document`, formData, onProgress);
  },

  // Legacy method names for compatibility
  async uploadVerificationDocument(
    expertId: string, 
    file: File, 
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ document: any }>> {
    return this.uploadDocument(expertId, file, documentType, onProgress);
  },

  async getDocuments(expertId: string): Promise<ApiResponse<{ documents: any[] }>> {
    return apiClient.get(`/api/experts/${expertId}/documents`);
  },

  // Following system
  async follow(expertId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return apiClient.post(`/api/experts/${expertId}/follow`);
  },

  async unfollow(expertId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return apiClient.delete(`/api/experts/${expertId}/follow`);
  },

  async getFollowStatus(expertId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return apiClient.get(`/api/experts/${expertId}/follow-status`);
  },

  async getFollowedExperts(): Promise<ApiResponse<{ experts: Expert[] }>> {
    return apiClient.get('/api/experts/followed');
  }
} as const;

/**
 * Post and Content Endpoints
 */
export const PostApi = {
  // Post CRUD operations
  async create(postData: ApiPostRequest): Promise<ApiResponse<{ post: Post }>> {
    return apiClient.post('/api/posts', postData);
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    topic?: string;
    wantsExpertHelp?: boolean;
  }): Promise<ApiResponse<{ posts: Post[]; pagination?: any }>> {
    return apiClient.get('/api/posts', { params });
  },

  // Legacy method names for compatibility
  async getPosts(params?: any): Promise<ApiResponse<{ posts: Post[]; pagination?: any }>> {
    return this.getAll(params);
  },

  async createPost(postData: ApiPostRequest): Promise<ApiResponse<{ post: Post }>> {
    return this.create(postData);
  },

  async createPostWithAttachments(postData: ApiPostRequest): Promise<ApiResponse<{ post: Post }>> {
    return this.create(postData);
  },

  async getById(id: string): Promise<ApiResponse<{ post: Post }>> {
    return apiClient.get(`/api/posts/${id}`);
  },

  async update(id: string, updates: Partial<Post>): Promise<ApiResponse<{ post: Post }>> {
    return apiClient.put(`/api/posts/${id}`, updates);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/posts/${id}`);
  },

  // Engagement
  async like(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return apiClient.post(`/api/posts/${postId}/like`);
  },

  // Legacy method names for compatibility
  async likePost(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return this.like(postId);
  },

  async unlike(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return apiClient.delete(`/api/posts/${postId}/like`);
  },

  // Legacy method names for compatibility
  async unlikePost(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
    return this.unlike(postId);
  },

  // Moderation
  async flagPost(postId: string, reason: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/api/posts/${postId}/flag`, { reason });
  },

  // Comments
  async addComment(postId: string, commentData: ApiCommentRequest): Promise<ApiResponse<{ comment: Comment }>> {
    return apiClient.post(`/api/posts/${postId}/comments`, commentData);
  },

  async getComments(postId: string): Promise<ApiResponse<{ comments: Comment[] }>> {
    return apiClient.get(`/api/posts/${postId}/comments`);
  },

  async updateComment(postId: string, commentId: string, updates: Partial<Comment>): Promise<ApiResponse<{ comment: Comment }>> {
    return apiClient.put(`/api/posts/${postId}/comments/${commentId}`, updates);
  },

  async deleteComment(postId: string, commentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/posts/${postId}/comments/${commentId}`);
  }
} as const;

/**
 * Session and Booking Endpoints
 */
export const SessionApi = {
  // Session management
  async create(sessionData: ApiChatSessionRequest): Promise<ApiResponse<{ session: Session }>> {
    return apiClient.post('/api/sessions', sessionData);
  },

  async getAll(params?: {
    status?: string;
    expertId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ sessions: Session[]; pagination?: any }>> {
    return apiClient.get('/api/sessions', { params });
  },

  async getById(id: string): Promise<ApiResponse<{ session: Session }>> {
    return apiClient.get(`/api/sessions/${id}`);
  },

  async update(id: string, updates: Partial<Session>): Promise<ApiResponse<{ session: Session }>> {
    return apiClient.put(`/api/sessions/${id}`, updates);
  },

  async cancel(id: string, reason?: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/api/sessions/${id}/cancel`, { reason });
  },

  // Session rating
  async rate(sessionId: string, rating: number, feedback?: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/api/sessions/${sessionId}/rate`, { rating, feedback });
  }
} as const;

/**
 * Sanctuary Endpoints
 */
export const SanctuaryApi = {
  // Basic sanctuary operations
  async create(sanctuaryData: ApiSanctuaryCreateRequest): Promise<ApiResponse<{ session: SanctuarySession; hostToken?: string; id?: string; topic?: string; description?: string; emoji?: string }>> {
    return apiClient.post('/api/sanctuary', sanctuaryData);
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }): Promise<ApiResponse<{ sessions: SanctuarySession[]; pagination?: any }>> {
    return apiClient.get('/api/sanctuary', { params });
  },

  async getById(id: string): Promise<ApiResponse<{ session: SanctuarySession }>> {
    return apiClient.get(`/api/sanctuary/${id}`);
  },

  // Legacy method names for compatibility
  async getSession(id: string): Promise<ApiResponse<{ session: SanctuarySession }>> {
    return this.getById(id);
  },

  async join(sessionId: string, joinData: ApiSanctuaryJoinRequest): Promise<ApiResponse<{ participant: any }>> {
    return apiClient.post(`/api/sanctuary/${sessionId}/join`, joinData);
  },

  // Legacy method names for compatibility
  async joinSession(sessionId: string, joinData: ApiSanctuaryJoinRequest): Promise<ApiResponse<{ participant: any }>> {
    return this.join(sessionId, joinData);
  },

  async leave(sessionId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/api/sanctuary/${sessionId}/leave`);
  },

  async getSubmissions(sessionId: string): Promise<ApiResponse<{ submissions: any[] }>> {
    return apiClient.get(`/api/sanctuary/${sessionId}/submissions`);
  },

  async endSession(sessionId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/api/sanctuary/${sessionId}/end`);
  },

  async flagSession(sessionId: string, reason: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/api/sanctuary/${sessionId}/flag`, { reason });
  },

  async removeParticipant(sessionId: string, participantId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/sanctuary/${sessionId}/participants/${participantId}`);
  }
} as const;

/**
 * Live Sanctuary Endpoints (Real-time audio sessions)
 */
export const LiveSanctuaryApi = {
  // Live session management
  async create(sessionData: CreateLiveSanctuaryRequest): Promise<ApiResponse<{ session: LiveSanctuarySession; hostToken: string; id?: string; topic?: string; description?: string; emoji?: string }>> {
    return apiClient.post('/api/live-sanctuary', sessionData);
  },

  async getAll(params?: {
    page?: number;
    limit?: number;
    active?: boolean;
  }): Promise<ApiResponse<{ sessions: LiveSanctuarySession[]; pagination?: any }>> {
    return apiClient.get('/api/live-sanctuary', { params });
  },

  async getSession(sessionId: string): Promise<ApiResponse<LiveSanctuarySession>> {
    return apiClient.get(`/api/live-sanctuary/${sessionId}`);
  },

  async join(sessionId: string, joinData: {
    alias?: string;
    isAnonymous?: boolean;
    voiceModulation?: string;
  }): Promise<ApiResponse<{ session: { id: string; agoraChannelName: string; agoraToken: string; participant: LiveSanctuaryParticipant } }>> {
    return apiClient.post(`/api/live-sanctuary/${sessionId}/join`, joinData);
  },

  // Legacy method names for compatibility
  async joinSession(sessionId: string, joinData: any): Promise<ApiResponse<{ session: any }>> {
    return this.join(sessionId, joinData);
  },

  async leave(sessionId: string): Promise<ApiResponse<{ sessionEnded: boolean }>> {
    return apiClient.post(`/api/live-sanctuary/${sessionId}/leave`);
  },

  async end(sessionId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/api/live-sanctuary/${sessionId}/end`);
  },

  async leaveSession(sessionId: string): Promise<ApiResponse<{ sessionEnded: boolean }>> {
    return this.leave(sessionId);
  }
} as const;

/**
 * AI and Moderation Endpoints
 */
export const AIApi = {
  // Content moderation
  async moderateContent(data: ApiGeminiModerateRequest): Promise<ApiResponse<{ 
    isAppropriate: boolean; 
    issues?: string[]; 
    severity?: string; 
  }>> {
    return apiClient.post('/api/ai/moderate', data);
  },

  async improveContent(data: ApiGeminiImproveRequest): Promise<ApiResponse<{ 
    improvedContent: string; 
    suggestions?: string[]; 
  }>> {
    return apiClient.post('/api/ai/improve', data);
  },

  async moderateImage(imageUrl: string): Promise<ApiResponse<{ 
    isAppropriate: boolean; 
    issues?: string[]; 
    severity?: string; 
  }>> {
    return apiClient.post('/api/ai/moderate-image', { imageUrl });
  }
} as const;

/**
 * Admin Endpoints
 */
export const AdminApi = {
  // User management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<ApiResponse<{ users: User[]; pagination?: any }>> {
    return apiClient.get('/api/admin/users', { params });
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put(`/api/admin/users/${userId}`, updates);
  },

  // Expert management
  async getPendingExperts(): Promise<ApiResponse<{ experts: Expert[] }>> {
    return apiClient.get('/api/admin/experts/pending');
  },

  async verifyExpert(expertId: string, data: {
    verificationLevel: string;
    status: string;
    feedback?: string;
  }): Promise<ApiResponse<{ expert: Expert }>> {
    return apiClient.patch(`/api/admin/experts/${expertId}/verify`, data);
  },

  async getExpertsAdvanced(params: {
    page?: number;
    limit?: number;
    status?: string;
    verificationLevel?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<{ experts: Expert[]; pagination?: any }>> {
    return apiClient.get('/api/admin/experts/advanced', { params });
  },

  // Analytics and monitoring
  async getPlatformOverview(params?: { timeframe?: string }): Promise<ApiResponse<any>> {
    return apiClient.get('/api/admin/analytics/platform-overview', { params });
  },

  async getModerationQueue(params?: { priority?: string; type?: string }): Promise<ApiResponse<any>> {
    return apiClient.get('/api/admin/moderation/queue', { params });
  },

  async getCrisisDetection(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/admin/monitoring/crisis-detection');
  },

  async getSanctuaryMonitoring(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/admin/monitoring/sanctuary-sessions');
  },

  async getExpertPerformance(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/admin/analytics/expert-performance');
  }
} as const;

/**
 * Agora (Video/Audio) Endpoints
 */
export const AgoraApi = {
  async generateToken(channelName: string, uid: number, role: 'publisher' | 'subscriber'): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post('/api/agora/token', { channelName, uid, role });
  }
} as const;

/**
 * File Upload Endpoints
 */
export const FileApi = {
  async uploadImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    
    return apiClient.upload('/api/upload/image', formData, onProgress);
  },

  async uploadDocument(
    file: File,
    type: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    
    return apiClient.upload('/api/upload/document', formData, onProgress);
  }
} as const;

/**
 * Analytics API for backward compatibility
 */
export const AnalyticsApi = {
  async getPlatformAnalytics(params?: { timeframe?: string }): Promise<ApiResponse<any>> {
    return apiClient.get('/api/analytics/platform-overview', { params });
  },
  
  async getExpertAnalytics(expertId: string, timeframe: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/api/analytics/expert/${expertId}`, { params: { timeframe } });
  },
  
  async getExpertRankings(sortBy: string, limit: number): Promise<ApiResponse<any[]>> {
    return apiClient.get('/api/analytics/expert-rankings', { params: { sortBy, limit } });
  },
} as const;

/**
 * Gemini API for AI content processing
 */
export const GeminiApi = {
  async moderateContent(content: string): Promise<ApiResponse<{ isAppropriate: boolean; issues?: string[] }>> {
    return AIApi.moderateContent({ content });
  },
  
  async improveContent(content: string): Promise<ApiResponse<{ improvedContent: string }>> {
    return AIApi.improveContent({ content });
  },
  
  async refinePost(content: string): Promise<ApiResponse<{ improvedContent: string }>> {
    return this.improveContent(content);
  }
} as const;

/**
 * Legacy API request function
 */
export const apiRequest = async (endpoint: string, options: any = {}) => {
  const method = options.method || 'GET';
  const data = options.data || options.body;
  
  switch (method.toUpperCase()) {
    case 'POST':
      return apiClient.post(endpoint, data, options);
    case 'PUT':
      return apiClient.put(endpoint, data, options);
    case 'PATCH':
      return apiClient.patch(endpoint, data, options);
    case 'DELETE':
      return apiClient.delete(endpoint, options);
    default:
      return apiClient.get(endpoint, options);
  }
};

/**
 * Export all API endpoints
 */
export const VeiloApi = {
  Auth: AuthApi,
  Expert: ExpertApi,
  Post: PostApi,
  Session: SessionApi,
  Sanctuary: SanctuaryApi,
  LiveSanctuary: LiveSanctuaryApi,
  AI: AIApi,
  Admin: AdminApi,
  Agora: AgoraApi,
  File: FileApi,
  
  // Legacy compatibility
  Analytics: AnalyticsApi,
  Gemini: GeminiApi,
  
  // Direct access to the API client for custom requests
  client: apiClient,
  
  // Legacy methods
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient)
} as const;

export default VeiloApi;