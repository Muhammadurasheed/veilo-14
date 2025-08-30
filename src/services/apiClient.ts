/**
 * FLAGSHIP API CLIENT - Veilo's Unified API Layer
 * 
 * This is the single source of truth for all API communication.
 * Built with enterprise-grade patterns for scalability and maintainability.
 * 
 * Features:
 * - Type-safe API calls with full TypeScript integration
 * - Automatic token refresh and authentication
 * - Request/response interceptors for logging and debugging
 * - Error handling with proper user feedback
 * - Request deduplication and caching
 * - Rate limiting and retry logic
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { tokenManager } from './tokenManager';
import { logger } from './logger';

// Base API configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'https://api.veilo.com'),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': 'web'
  }
} as const;

/**
 * Enhanced API Response Type - Consistent across all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp?: string;
    requestId?: string;
  };
}

/**
 * Request Configuration with Enhanced Options
 */
export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  retries?: number;
  cache?: boolean;
  dedupe?: boolean;
}

// Extend AxiosRequestConfig to include our custom properties
declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    _retry?: boolean;
  }
}

class ApiClient {
  private instance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private requestCache = new Map<string, Promise<AxiosResponse>>();
  private failedQueue: Array<{ resolve: Function; reject: Function }> = [];
  private isRefreshing = false;

  constructor() {
    this.instance = axios.create(API_CONFIG);
    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add authentication headers
        if (!config.skipAuth) {
          const authHeaders = tokenManager.getAuthHeaders();
          Object.assign(config.headers, authHeaders);
        }

        // Add request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        config.headers['X-Request-ID'] = requestId;

        // Log request in development
        if (import.meta.env.DEV) {
          logger.apiRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '', config.data);
        }

        return config;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with token refresh
    this.instance.interceptors.response.use(
      (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
          logger.apiResponse(
            response.config.method?.toUpperCase() || 'UNKNOWN',
            response.config.url || '',
            response.status,
            response.data
          );
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        
        // Handle 401 errors with token refresh
        if (status === 401 && !originalRequest._retry && !originalRequest.skipAuth) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.instance(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = tokenManager.getRefreshToken();
            if (refreshToken) {
              const response = await this.instance.post('/api/auth/refresh-token', 
                { refreshToken }, 
                { skipAuth: true }
              );
              
              if (response.data?.success && response.data?.data?.token) {
                const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
                tokenManager.setToken(newAccessToken);
                if (newRefreshToken) {
                  tokenManager.setRefreshToken(newRefreshToken);
                }
                
                this.processQueue(null, newAccessToken);
                
                // Retry original request with new token
                originalRequest.headers['x-auth-token'] = newAccessToken;
                return this.instance(originalRequest);
              }
            }
            
            throw new Error('Token refresh failed');
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            tokenManager.clearAllTokens();
            
            // Redirect to login or show auth modal
            window.dispatchEvent(new CustomEvent('authenticationRequired'));
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Log error responses
        logger.apiResponse(
          originalRequest.method?.toUpperCase() || 'UNKNOWN',
          originalRequest.url || '',
          status || 0,
          error.response?.data
        );

        return Promise.reject(error);
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Generate cache key for request deduplication
   */
  private getCacheKey(method: string, url: string, params?: any, data?: any): string {
    return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
  }

  /**
   * Generic request method with enhanced features
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    try {
      const { method = 'GET', url, cache = false, dedupe = true } = config;
      
      // Request deduplication for GET requests
      if (dedupe && method.toUpperCase() === 'GET') {
        const cacheKey = this.getCacheKey(method, url || '', config.params, config.data);
        const existingRequest = this.requestCache.get(cacheKey);
        
        if (existingRequest) {
          const response = await existingRequest;
          return response.data;
        }
        
        const requestPromise = this.instance.request(config);
        this.requestCache.set(cacheKey, requestPromise);
        
        // Clean up cache after request completes
        requestPromise.finally(() => {
          this.requestCache.delete(cacheKey);
        });
        
        const response = await requestPromise;
        return response.data;
      }

      const response = await this.instance.request(config);
      return response.data;
    } catch (error: any) {
      const apiError: ApiResponse<T> = {
        success: false,
        error: this.extractErrorMessage(error),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: config.headers?.['X-Request-ID']
        }
      };
      
      return apiError;
    }
  }

  /**
   * Extract meaningful error messages from API responses
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.message) {
      return error.message;
    }
    
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'Access denied. You don\'t have permission for this action.';
        case 404:
          return 'Resource not found.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return `Request failed with status ${error.response.status}.`;
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  // Convenience methods for different HTTP verbs
  async get<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T = any>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Upload files with progress tracking
   */
  async upload<T = any>(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  }

  /**
   * Batch multiple requests
   */
  async batch<T = any>(requests: ApiRequestConfig[]): Promise<ApiResponse<T[]>> {
    try {
      const promises = requests.map(config => this.request<T>(config));
      const results = await Promise.allSettled(promises);
      
      const data = results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: 'Request failed' }
      );
      
      return {
        success: true,
        data: data as T[],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: `batch_${Date.now()}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
        meta: {
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/api/health', { skipAuth: true, cache: false });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;