/* Custom Service Worker (Workbox CDN) */
/* global workbox */

const CORE_CACHE = 'core-v1';
const API_CACHE = 'api-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CORE_CACHE);
    await cache.addAll([
      '/',
      '/index.html',
      OFFLINE_URL,
      '/manifest.json'
    ]);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![CORE_CACHE, API_CACHE].includes(k)).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// Fetch handler: offline fallback and runtime caching for GET /api
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin
  if (url.origin === self.location.origin) {
    // API runtime caching (stale-while-revalidate)
    if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
      event.respondWith((async () => {
        const cache = await caches.open(API_CACHE);
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then(resp => {
          if (resp.ok) cache.put(request, resp.clone());
          return resp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })());
      return;
    }

    // Navigation requests: offline fallback
    if (request.mode === 'navigate') {
      event.respondWith((async () => {
        try {
          const preload = await event.preloadResponse;
          if (preload) return preload;
          const networkResp = await fetch(request);
          return networkResp;
        } catch (e) {
          const cache = await caches.open(CORE_CACHE);
          const offlinePage = await cache.match(OFFLINE_URL);
          return offlinePage || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
        }
      })());
      return;
    }
  }
});

// Optional: message handler to trigger skipWaiting from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
