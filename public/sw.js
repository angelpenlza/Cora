// Minimal service worker required for PWA install (e.g. Samsung Internet)
self.addEventListener('install', function () {
  self.skipWaiting();
});
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});
// Fetch handler so Samsung Internet recognizes the SW as controlling the page
self.addEventListener('fetch', function (event) {
  event.respondWith(
    fetch(event.request).catch(function () {
      return new Response('', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});

self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const title = data.title || 'Cora';
  const base = self.location.origin;
  function absolute(url) {
    if (!url) return base + '/assets/web-app-manifest-192x192.png';
    return url.startsWith('http') ? url : base + (url.startsWith('/') ? url : '/' + url);
  }
  const options = {
    body: data.body || '',
    icon: absolute(data.icon),
    badge: absolute(data.badge) || absolute(data.icon),
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client && client.url === targetUrl) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});

