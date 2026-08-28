import axios from 'axios';
import { childLogger } from '@/lib/logger.js';

const log = childLogger('api');

export const api = axios.create();
api.defaults.withCredentials = true;

api.interceptors.request.use((config) => {
  config.metadata = { start: Date.now() };
  log.debug({ method: config.method?.toUpperCase(), url: config.url }, 'Request start');
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (response) => {
    const durationMs = Date.now() - (response.config.metadata?.start || Date.now());
    log.debug(
      { method: response.config.method?.toUpperCase(), url: response.config.url, status: response.status, durationMs },
      'Request success'
    );
    return response;
  },
  async (error) => {
    const original = error.config;
    const isAuthError = error.response?.status === 401;
    const isRefreshCall = original?.url?.includes('/api/auth/refresh');
    if (!isAuthError || isRefreshCall || original?._retry) {
      const status = error.response?.status;
      const level = status >= 500 ? 'error' : 'warn';
      log[level](
        {
          method: original?.method?.toUpperCase(),
          url: original?.url,
          status,
          data: error.response?.data,
        },
        'Request failed'
      );
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
