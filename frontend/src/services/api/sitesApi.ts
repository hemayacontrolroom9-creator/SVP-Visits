import apiClient from './client';

export const sitesApi = {
  getAll: (params?: any) => apiClient.get('/sites', { params }),
  getMapSites: () => apiClient.get('/sites/map'),
  getOne: (id: string) => apiClient.get(`/sites/${id}`),
  create: (data: any) => apiClient.post('/sites', data),
  update: (id: string, data: any) => apiClient.patch(`/sites/${id}`, data),
  delete: (id: string) => apiClient.delete(`/sites/${id}`),
  getQrCode: (id: string) => apiClient.get(`/sites/${id}/qr-code`),
  assignSupervisor: (siteId: string, supervisorId: string) =>
    apiClient.post(`/sites/${siteId}/assign-supervisor/${supervisorId}`),
};
