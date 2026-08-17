import axios from 'axios';

function getAuthToken() {
  const raw = localStorage.getItem('token');
  if (!raw) return null;
  return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
}

export const api = axios.create();

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = token;
  return config;
});

export function downloadBlob(url, params = {}) {
  return api.get(url, { params, responseType: 'blob' });
}
