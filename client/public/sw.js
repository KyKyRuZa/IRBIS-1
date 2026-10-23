self.addEventListener('push', event => {
  let title = 'IRBIS уведомление';
  let body = 'Новое уведомление';
  let data = null;
  if (event.data) {
    try {
      data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch (e) {
      body = event.data.text() || body;
    }
  }
  const options = {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: data || {},
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  const origin = self.location.origin;
  const targetUrl = new URL(target, origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        try {
          if (new URL(client.url).href === targetUrl && 'focus' in client) {
            return client.focus();
          }
        } catch {
          if (client.url === target || client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
