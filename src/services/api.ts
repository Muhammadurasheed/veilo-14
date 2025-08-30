/**
 * FLAGSHIP API - Complete Refactor for Production Excellence
 * This replaces all legacy patterns with enterprise-grade architecture
 */

// Import the new flagship systems
import { VeiloApi } from './apiEndpoints';
import { apiClient } from './apiClient';
import { realTimeService } from './realTimeService';

// Export the flagship API as default
export default VeiloApi;

// Export all flagship components
export { VeiloApi, apiClient, realTimeService };

// Legacy compatibility exports - DEPRECATED but maintained for transition
export const UserApi = VeiloApi.Auth;
export const ExpertApi = VeiloApi.Expert;
export const PostApi = VeiloApi.Post;
export const AdminApi = VeiloApi.Admin;
export const SanctuaryApi = VeiloApi.Sanctuary;
export const LiveSanctuaryApi = VeiloApi.LiveSanctuary;
export const AIApi = VeiloApi.AI;
export const AgoraApi = VeiloApi.Agora;

// Legacy socket service export
export const SocketService = realTimeService;

// Legacy admin token function
export const setAdminToken = (token: string) => {
  localStorage.setItem('admin_token', token);
  console.warn('setAdminToken is deprecated. Use VeiloApi.client for all requests.');
};

// Export types
export type { ApiResponse } from './apiClient';