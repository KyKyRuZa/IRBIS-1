import axios from 'axios';
import { api } from '@/lib/api.js';

export const pushService = {
  getVapidKey: () =>
    axios.get('/api/push/vapid-public-key').then(r => r.data.publicKey),

  subscribe: (endpoint, keys) =>
    api.post('/api/push/subscribe', { endpoint, keys }).then(r => r.data),

  unsubscribe: (endpoint) =>
    api.post('/api/push/unsubscribe', { endpoint }).then(r => r.data),
};
