self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('skynet-store-v1').then((cache) => cache.addAll([
      // '/pwa-examples/a2hs/',
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
