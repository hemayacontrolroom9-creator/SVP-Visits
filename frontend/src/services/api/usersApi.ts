import apiClient from './client';

export const usersApi = {
  getAll: (params?: any) => apiClient.get('/users', { params }),
  getSupervisors: () => apiClient.get('/users/supervisors'),
  getOne: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: any) => apiClient.post('/users', data),
  update: (id: string, data: any) => apiClient.patch(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};
