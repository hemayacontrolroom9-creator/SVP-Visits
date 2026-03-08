import apiClient from './client';

export const visitsApi = {
  getAll: (params?: any) => apiClient.get('/visits', { params }),
  getMyVisits: (params?: any) => apiClient.get('/visits/my-visits', { params }),
  getToday: () => apiClient.get('/visits/today'),
  getActive: () => apiClient.get('/visits/active'),
  getOne: (id: string) => apiClient.get(`/visits/${id}`),
  create: (data: any) => apiClient.post('/visits', data),
  update: (id: string, data: any) => apiClient.patch(`/visits/${id}`, data),
  checkIn: (id: string, data: any) => apiClient.post(`/visits/${id}/check-in`, data),
  checkOut: (id: string, data: any) => apiClient.post(`/visits/${id}/check-out`, data),
  updateGpsTrack: (id: string, data: any) => apiClient.patch(`/visits/${id}/gps-track`, data),
  cancel: (id: string) => apiClient.delete(`/visits/${id}`),
};
