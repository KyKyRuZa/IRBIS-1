import { useState, useEffect, useRef } from 'react';
import { pushService } from '@lib/services/push.service.js';
import { useAuth } from '@hooks/useAuth.js';

function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== 'string') return new Uint8Array();
  const trimmed = base64String.trim();
  if (!trimmed) return new Uint8Array();
  try {
    const padding = '='.repeat((4 - trimmed.length % 4) % 4);
    const base64 = (trimmed + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.error('Failed to convert VAPID key to Uint8Array:', e);
    return new Uint8Array();
  }
}

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

  const createBrowserSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const vapidKey = await getVapidKey();
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey ? urlBase64ToUint8Array(vapidKey) : '',
    });
    await pushService.subscribe(subscription.endpoint, {
      p256dh: subscription.toJSON().keys.p256dh,
      auth: subscription.toJSON().keys.auth,
    });
    return subscription;
  };

  const removeBrowserSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await pushService.unsubscribe(subscription.endpoint);
      await subscription.unsubscribe();
    }
  };

  // Load the saved preference from the server so the toggle survives F5 / re-login / cache reset,
  // and reconcile the actual browser subscription with that preference.
  const initialized = useRef(false);
  useEffect(() => {
    if (!token || !supported || initialized.current) return;
    initialized.current = true;
    (async () => {
      let prefEnabled = false;
      try {
        const data = await pushService.getPreferences();
        prefEnabled = Boolean(data.enabled);
      } catch {
        /* preference defaults to disabled if it cannot be read */
      }
      setSubscribed(prefEnabled);
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (prefEnabled && !existing) {
          await createBrowserSubscription();
        } else if (!prefEnabled && existing) {
          await removeBrowserSubscription();
        }
      } catch (e) {
        console.error('Failed to sync push subscription state', e);
      }
    })();
  }, [token, supported]);

  const subscribe = async () => {
    if (!token) {
      setError('Требуется авторизация');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createBrowserSubscription();
      await pushService.updatePreferences(true).catch(() => {});
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
      await removeBrowserSubscription();
      await pushService.updatePreferences(false).catch(() => {});
      setSubscribed(false);
    } catch (e) {
      setError(e.message || 'Ошибка отписки');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return { supported, subscribed, loading, error, subscribe, unsubscribe };
}
