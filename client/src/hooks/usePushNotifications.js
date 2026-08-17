import { useState, useEffect } from 'react';
import axios from 'axios';

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const getToken = () => localStorage.getItem('token');

  const getVapidKey = async () => {
    const res = await axios.get('/api/push/vapid-public-key');
    return res.data;
  };

  const subscribe = async () => {
    const token = getToken();
    if (!token) {
      setError('Требуется авторизация');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = await getVapidKey();
      const convertedVapidKey = vapidKey ? vapidKey : '';
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      await axios.post(
        '/api/push/subscribe',
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys.p256dh,
            auth: subscription.toJSON().keys.auth,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubscribed(true);
    } catch (e) {
      setError(e.message || 'Ошибка подписки');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await axios.post(
          '/api/push/unsubscribe',
          { endpoint: subscription.endpoint },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await subscription.unsubscribe();
        setSubscribed(false);
      }
    } catch (e) {
      setError(e.message || 'Ошибка отписки');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return { supported, subscribed, loading, error, subscribe, unsubscribe };
}
