// Mock VeiloApi for build compatibility
export const VeiloApi = {
  post: async (url: string, data: any) => ({ data: { audioUrl: null } }),
  experts: {
    getPendingExperts: async () => ({ data: { experts: [] } }),
    updateExpertStatus: async (id: string, data: any) => ({ success: true })
  }
};

export default VeiloApi;