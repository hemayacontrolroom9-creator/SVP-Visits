import apiClient from './client';

export const alertsApi = {
  getAll: (params?: any) => apiClient.get('/alerts', { params }),
  acknowledge: (id: string) => apiClient.patch(`/alerts/${id}/acknowledge`),
  resolve: (id: string) => apiClient.patch(`/alerts/${id}/resolve`),
};
