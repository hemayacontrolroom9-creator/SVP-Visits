import apiClient from './client';

export const reportsApi = {
  getDashboard: () => apiClient.get('/reports/dashboard'),
  getVisitSummary: (params: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/visits/summary', { params }),
  getVisitsBySupervisor: (params: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/visits/by-supervisor', { params }),
  getVisitsBySite: (params: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/visits/by-site', { params }),
  getCompliance: (params: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/compliance', { params }),
  getActivityHeatmap: (params: { startDate?: string; endDate?: string }) =>
    apiClient.get('/reports/activity/heatmap', { params }),
};
