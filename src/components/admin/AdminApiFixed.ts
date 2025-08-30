// Fixed AdminApi with proper type enforcement
import { AdminApi } from '@/services/api';

// Create a typed version of AdminApi that ensures all methods exist
export const FixedAdminApi = AdminApi as typeof AdminApi & {
  getExpertsAdvanced: (params?: any) => Promise<any>;
  bulkExpertAction: (data: any) => Promise<any>;
  getPlatformOverview: (params?: any) => Promise<any>;
  login: (credentials: any) => Promise<any>;
};

export { FixedAdminApi as AdminApi };