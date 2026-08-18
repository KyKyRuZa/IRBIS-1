import { useState, useEffect } from 'react';
import { pushService } from '@lib/services/push.service.js';
import { useAuth } from '@hooks/useAuth.js';

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const getVapidKey = async () => {
    return pushService.getVapidKey();
  };

  const subscribe = async () => {
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
      await pushService.subscribe(
        subscription.endpoint,
        {
          p256dh: subscription.toJSON().keys.p256dh,
          auth: subscription.toJSON().keys.auth,
        }
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
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await pushService.unsubscribe(subscription.endpoint);
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
