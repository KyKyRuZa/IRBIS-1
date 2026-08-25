import axios from 'axios';

export const api = axios.create();
api.defaults.withCredentials = true;

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthError = error.response?.status === 401;
    const isRefreshCall = original?.url?.includes('/api/auth/refresh');
    if (!isAuthError || isRefreshCall || original?._retry) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      if (!refreshing) {
        refreshing = api
          .post('/api/auth/refresh')
          .catch((e) => {
            refreshing = null;
            throw e;
          })
          .then((r) => {
            refreshing = null;
            return r;
          });
      }
      await refreshing;
      return api(original);
    } catch {
      return Promise.reject(error);
    }
  }
);

export function downloadBlob(url, params = {}) {
  return api.get(url, { params, responseType: 'blob' });
}
