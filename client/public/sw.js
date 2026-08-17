self.addEventListener('push', event => {
  let title = 'IRBIS уведомление';
  let body = 'Новое уведомление';
  let data = null;
  console.log('SW push event received');
  if (event.data) {
    try {
      data = event.data.json();
      console.log('SW push data JSON', data);
      title = data.title || title;
      body = data.body || body;
    } catch (e) {
      console.log('SW push data text', event.data.text());
      body = event.data.text() || body;
    }
  }
  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    data: data || {},
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
