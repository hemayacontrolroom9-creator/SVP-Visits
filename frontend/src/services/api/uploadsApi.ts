import apiClient from './client';

export const uploadsApi = {
  uploadPhoto: (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    return apiClient.post('/uploads/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (folder) formData.append('folder', folder);
    return apiClient.post('/uploads/photos/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
