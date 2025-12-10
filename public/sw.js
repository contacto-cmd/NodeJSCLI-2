// Service Worker para PWA - LGoritmo AHT
const CACHE_NAME = 'aht-cerebro-v1';
const urlsToCache = [
  '/cerebro-3d.html',
  '/dashboard-aht.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
