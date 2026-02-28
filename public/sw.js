/**
 * Minimal service worker for Cora.
 *
 * Goals:
 * - Provide enough functionality for browsers to treat
 *   the app as a PWA and allow installation.
 * - Handle Web Push messages and notification clicks for report updates.
 */
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
  const options = {
    body: data.body || '',
    // These 3 are fallbacks in case one isn't assigned
    icon: data.icon || (base + '/assets/icons/statusBarIcon-96x96.png'),
    image: data.image || (base + '/assets/icons/Noti-HeroImage.png'),
    badge: data.badge || (base + '/assets/icons/statusBarIcon-96x96.png'),
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

