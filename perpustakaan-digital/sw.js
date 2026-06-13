/* sw.js — Pojok Baca Tlogosari
   Service worker minimal: tidak melakukan cache apapun.
   File ini ada hanya agar browser tidak error 404. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  // Hapus semua cache lama dari versi sebelumnya
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Passthrough: semua request langsung ke network, tidak ada caching
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});
