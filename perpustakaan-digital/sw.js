/* =============================================================
   sw.js — Service Worker
   Perpustakaan Digital — Offline-first caching strategy
   ============================================================= */

const CACHE_NAME = 'perpustakaan-v1';

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './reader.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/reader.js',
  './data/books.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // PDF.js from CDN
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
];

// ── INSTALL: Cache static assets & book covers ────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache static assets (individual so one failure doesn't block all)
      for (const url of STATIC_ASSETS) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('[SW] Gagal cache static asset:', url, e.message);
        }
      }

      // Cache all book covers from books.json
      try {
        const res   = await fetch('./data/books.json');
        const books = await res.json();
        for (const book of books) {
          if (book.cover) {
            try { await cache.add(book.cover); } catch (e) { /* cover optional */ }
          }
        }
      } catch (e) {
        console.warn('[SW] Gagal pre-cache covers:', e.message);
      }

      console.log('[SW] Install selesai.');
      await self.skipWaiting();
    })()
  );
});

// ── ACTIVATE: Delete old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
      await self.clients.claim();
      console.log('[SW] Aktif, cache lama dibersihkan.');
    })()
  );
});

// ── FETCH: Serve from cache, fallback to network ──────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Strategy: Cache First (serve from cache, update in background)
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Return cached version immediately
    // Refresh in background for non-PDF assets
    if (!request.url.includes('.pdf')) {
      refreshCache(cache, request);
    }
    return cached;
  }

  // Not in cache → try network
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Network failed and not in cache
    if (request.destination === 'document') {
      // Fallback to index.html for navigation requests
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('Tidak ada koneksi dan konten belum tersimpan offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function refreshCache(cache, request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      await cache.put(request, response);
    }
  } catch { /* silent fail */ }
}

// ── MESSAGE: Handle CACHE_ALL_BOOKS command from app ──────────
self.addEventListener('message', async event => {
  if (event.data?.type !== 'CACHE_ALL_BOOKS') return;

  const books  = event.data.books || [];
  const client = event.source;
  const cache  = await caches.open(CACHE_NAME);
  const total  = books.length;
  let current  = 0;

  for (const book of books) {
    current++;

    // Notify progress
    client.postMessage({ type: 'CACHE_PROGRESS', current, total });

    try {
      if (book.pdf) {
        const res = await fetch(book.pdf);
        if (res.ok) await cache.put(book.pdf, res);
      }
      if (book.cover) {
        const res = await fetch(book.cover);
        if (res.ok) await cache.put(book.cover, res);
      }
    } catch (e) {
      console.warn('[SW] Gagal cache buku:', book.judul, e.message);
    }
  }

  client.postMessage({ type: 'CACHE_DONE', total });
});
