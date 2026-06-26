const CACHE_NAME = 'cravemap-shell-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Let live routing requests go directly to OSRM. Intercepting these requests
  // adds no offline value and makes aborted route requests harder to recover.
  if (url.origin === 'https://router.project-osrm.org') {
    return;
  }

  // Ignore API requests or SignalR websocket connections
  if (url.pathname.startsWith('/api') || url.pathname.includes('/hubs/')) {
    return;
  }

  // Ignore non-GET requests
  if (req.method !== 'GET') {
    return;
  }

  // Navigations should prefer the latest app so QR visitors do not remain on
  // an old cached bundle. The cached shell is only used when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', responseClone));
        }
        return networkResponse;
      }).catch(() => caches.match('/') || caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh in background to update cache (Stale-While-Revalidate)
        fetch(req).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => undefined);
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        // Cache static assets dynamically (JS, CSS, Images, Fonts)
        const isStaticAsset = 
          url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|eot|ttf|otf)$/) ||
          url.origin === 'https://fonts.googleapis.com' ||
          url.origin === 'https://fonts.gstatic.com';

        if (networkResponse.status === 200 && isStaticAsset) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });
        }

        return networkResponse;
      });
    })
  );
});
