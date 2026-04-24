/**
 * Service Worker for Cora PWA.
 *
 * Caching strategies:
 *   - Static assets (images, fonts, icons, CSS/JS): cache-first with long TTL
 *   - Google Maps tiles/API: cache-first (immutable CDN assets)
 *   - HTML page navigations: network-first with offline fallback
 *   - API routes / Server Actions: network-only (never cache mutations)
 */

var CACHE_VERSION = 'cora-v2';
var STATIC_CACHE = 'cora-static-v2';
var PAGES_CACHE  = 'cora-pages-v2';

var PRECACHE_URLS = [
  '/',
  '/assets/cora-logo.png',
  '/assets/favicon-96x96.png',
  '/favicon.ico',
];

// ── Install: precache shell assets ──────────────────────────────────
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────────
self.addEventListener('activate', function (event) {
  var KEEP = [STATIC_CACHE, PAGES_CACHE];
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (n) { return KEEP.indexOf(n) === -1; })
          .map(function (n) { return caches.delete(n); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ── Helpers ─────────────────────────────────────────────────────────
function isStaticAsset(url) {
  var path = url.pathname;
  return /\.(png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|eot|css|js)(\?|$)/i.test(path)
    || path.startsWith('/icons/')
    || path.startsWith('/assets/')
    || path.startsWith('/_next/static/');
}

function isGoogleMapsAsset(url) {
  var host = url.hostname;
  return host.endsWith('.googleapis.com')
    || host.endsWith('.gstatic.com')
    || host.endsWith('.google.com');
}

function isApiOrAction(url) {
  var path = url.pathname;
  return path.startsWith('/api/')
    || path.startsWith('/_next/data/')
    || path.startsWith('/auth/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate'
    || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').indexOf('text/html') !== -1);
}

// ── Fetch handler ───────────────────────────────────────────────────
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // Never intercept non-GET or cross-origin API/analytics requests
  if (event.request.method !== 'GET') return;

  // API routes and server actions: network-only
  if (url.origin === self.location.origin && isApiOrAction(url)) return;

  // Static assets from our origin: cache-first
  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          if (cached) return cached;
          return fetch(event.request).then(function (response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // Google Maps tiles/API: cache-first (large immutable payloads)
  if (isGoogleMapsAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          if (cached) return cached;
          return fetch(event.request).then(function (response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // HTML navigation: network-first, fall back to cache
  if (url.origin === self.location.origin && isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(PAGES_CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(event.request).then(function (cached) {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Everything else from our origin: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          var networkFetch = fetch(event.request).then(function (response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(function () {
            return cached || new Response('', { status: 503, statusText: 'Offline' });
          });
          return cached || networkFetch;
        });
      })
    );
    return;
  }
});

// ── Push notifications ──────────────────────────────────────────────
self.addEventListener('push', function (event) {
  if (!event.data) return;

  var data = event.data.json();
  var title = data.title || 'Cora';
  var base = self.location.origin;
  var options = {
    body: data.body || '',
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

  var notificationData = event.notification.data || {};
  var rawTarget = notificationData.url || '/';
  var targetHref = new URL(rawTarget, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Prefer focusing an existing window (any) and navigating it to target.
      // This avoids strict URL matching issues (absolute vs relative, hash, query).
      var client = clientList && clientList.length ? clientList[0] : null;
      if (client) {
        return client.focus().then(function () {
          if ('navigate' in client) {
            return client.navigate(targetHref);
          }
          return undefined;
        });
      }
      if (clients.openWindow) return clients.openWindow(targetHref);
      return undefined;
    })
  );
});
