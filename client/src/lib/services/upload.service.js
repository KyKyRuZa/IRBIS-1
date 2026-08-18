import { api } from '@/lib/api.js';

export const uploadService = {
  uploadCertificate: (formData) =>
    api.post('/api/upload/certificate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  uploadSignature: (formData) =>
    api.post('/api/upload/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};
