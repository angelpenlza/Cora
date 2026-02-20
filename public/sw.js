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
