/* =============================================================
   app.js — Perpustakaan Digital
   Homepage logic: load books, cache management, PWA install
   ============================================================= */

'use strict';

// ── Service Worker Registration ──────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[SW] Terdaftar:', reg.scope);

        // Listen for messages from SW (e.g., cache progress)
        navigator.serviceWorker.addEventListener('message', handleSWMessage);
      })
      .catch(err => console.error('[SW] Gagal daftar:', err));
  });
}

// ── State ────────────────────────────────────────────────────
let allBooks = [];
let deferredInstallPrompt = null;

// ── DOM ──────────────────────────────────────────────────────
const bookGrid        = document.getElementById('book-grid');
const bookCount       = document.getElementById('book-count');
const emptyState      = document.getElementById('empty-state');
const connectionBadge = document.getElementById('connection-status');
const offlineBanner   = document.getElementById('offline-banner');
const installBanner   = document.getElementById('install-banner');
const installBtn      = document.getElementById('install-btn');
const installDismiss  = document.getElementById('install-dismiss');
const downloadBar     = document.getElementById('download-bar');
const downloadAllBtn  = document.getElementById('download-all-btn');
const progressWrap    = document.getElementById('progress-wrap');
const progressText    = document.getElementById('progress-text');
const progressCount   = document.getElementById('progress-count');
const progressFill    = document.getElementById('progress-fill');
const toastEl         = document.getElementById('toast');

// ── Online / Offline Detection ───────────────────────────────
function updateConnectionUI() {
  const online = navigator.onLine;
  if (online) {
    offlineBanner.classList.add('hidden');
    connectionBadge.textContent = '🟢 Online';
    connectionBadge.className = 'status-badge online';
  } else {
    offlineBanner.classList.remove('hidden');
    connectionBadge.textContent = '🔴 Offline';
    connectionBadge.className = 'status-badge offline';
  }
}
window.addEventListener('online',  updateConnectionUI);
window.addEventListener('offline', updateConnectionUI);
updateConnectionUI();

// ── PWA Install Prompt ───────────────────────────────────────
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBanner.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    installBanner.classList.add('hidden');
    showToast('✅ Aplikasi berhasil dipasang!');
  }
  deferredInstallPrompt = null;
});

installDismiss.addEventListener('click', () => {
  installBanner.classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
  installBanner.classList.add('hidden');
  deferredInstallPrompt = null;
});

// ── Toast Helper ─────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2800) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ── Check if a URL is cached ─────────────────────────────────
async function isCached(url) {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open('perpustakaan-v1');
    const response = await cache.match(url);
    return !!response;
  } catch { return false; }
}

// ── Color palette for fallback covers ───────────────────────
const COVER_COLORS = [
  ['#6B3A2A','#E8A045'],['#1B4332','#52B788'],
  ['#1D3557','#A8DADC'],['#6A0572','#E040FB'],
  ['#2D3561','#F5A623'],['#3D405B','#81B29A'],
];

function getCoverColors(index) {
  return COVER_COLORS[index % COVER_COLORS.length];
}

// ── Set per-book save button state ──────────────────────────
function setSaveBtnState(btn, state) {
  // state: 'idle' | 'loading' | 'saved'
  btn.disabled = state !== 'idle';
  if (state === 'idle') {
    btn.innerHTML = '⬇';
    btn.className = 'save-btn';
    btn.title = 'Simpan untuk offline';
  } else if (state === 'loading') {
    btn.innerHTML = '<span class="save-spinner"></span>';
    btn.className = 'save-btn saving';
    btn.title = 'Sedang mengunduh...';
  } else if (state === 'saved') {
    btn.innerHTML = '✓';
    btn.className = 'save-btn saved';
    btn.title = 'Sudah tersimpan offline';
  }
}

// ── Download a single book ────────────────────────────────────
window.downloadBook = async (bookId) => {
  if (!navigator.onLine) {
    showToast('❌ Tidak ada koneksi internet');
    return;
  }
  if (!('caches' in window)) {
    showToast('❌ Browser tidak mendukung penyimpanan offline');
    return;
  }

  const book = allBooks.find(b => b.id === bookId);
  if (!book) return;

  const btn = document.getElementById(`save-btn-${bookId}`);
  const offlineBadgeWrap = document.getElementById(`cover-wrap-${bookId}`);
  if (!btn) return;

  setSaveBtnState(btn, 'loading');

  try {
    const cache = await caches.open('perpustakaan-v1');

    // Download PDF
    const pdfRes = await fetch(book.pdf);
    if (!pdfRes.ok) throw new Error('PDF gagal diunduh');
    await cache.put(book.pdf, pdfRes);

    // Download cover if exists
    if (book.cover) {
      try {
        const coverRes = await fetch(book.cover);
        if (coverRes.ok) await cache.put(book.cover, coverRes);
      } catch { /* cover optional */ }
    }

    setSaveBtnState(btn, 'saved');

    // Show offline badge on cover
    if (offlineBadgeWrap) {
      const existing = offlineBadgeWrap.querySelector('.offline-badge');
      if (!existing) {
        const badge = document.createElement('span');
        badge.className = 'offline-badge';
        badge.textContent = '✓ Offline';
        offlineBadgeWrap.appendChild(badge);
      }
    }

    showToast(`✅ "${book.judul}" siap dibaca offline!`);
  } catch (err) {
    console.error('Gagal simpan buku:', err);
    setSaveBtnState(btn, 'idle');
    showToast('⚠️ Gagal mengunduh, coba lagi');
  }
};

// ── Render Book Cards ─────────────────────────────────────────
async function renderBooks(books) {
  bookGrid.innerHTML = '';

  if (!books || books.length === 0) {
    emptyState.classList.remove('hidden');
    bookCount.textContent = '0 Buku';
    downloadBar.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  bookCount.textContent = `${books.length} Buku tersedia`;
  downloadBar.classList.remove('hidden');

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const cached = await isCached(book.pdf);
    const [bgColor, textColor] = getCoverColors(i);

    const card = document.createElement('article');
    card.className = 'book-card';
    card.setAttribute('role', 'listitem');
    card.id = `card-${book.id}`;

    card.innerHTML = `
      <div class="book-cover-wrap" id="cover-wrap-${book.id}" style="background:${bgColor};">
        <img
          src="${book.cover}"
          alt="Cover buku ${book.judul}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        >
        <div class="cover-fallback" style="display:none; background:${bgColor};">
          <div class="cover-fallback-icon">📗</div>
          <div class="cover-fallback-title" style="color:${textColor};">${book.judul}</div>
        </div>
        ${cached ? '<span class="offline-badge">✓ Offline</span>' : ''}
        <span class="category-badge">${book.kategori || 'Umum'}</span>
      </div>
      <div class="book-info">
        <h2 class="book-title">${book.judul}</h2>
        <p class="book-author">${book.penulis}</p>
        <div class="book-actions">
          <button
            class="read-btn"
            onclick="openBook('${book.id}', '${encodeURIComponent(book.pdf)}', '${encodeURIComponent(book.judul)}')"
            aria-label="Baca buku ${book.judul}"
          >📖 Baca</button>
          <button
            id="save-btn-${book.id}"
            class="save-btn${cached ? ' saved' : ''}"
            onclick="downloadBook('${book.id}')"
            ${cached ? 'disabled' : ''}
            title="${cached ? 'Sudah tersimpan offline' : 'Simpan untuk offline'}"
            aria-label="${cached ? 'Sudah tersimpan' : 'Simpan untuk offline'}"
          >${cached ? '✓' : '⬇'}</button>
        </div>
      </div>
    `;

    bookGrid.appendChild(card);
  }
}

// ── Open Book → Navigate to Reader ──────────────────────────
function openBook(id, pdfEncoded, titleEncoded) {
  const url = `reader.html?id=${id}&pdf=${pdfEncoded}&title=${titleEncoded}`;
  window.location.href = url;
}

// ── Download All Books (Service Worker message) ──────────────
downloadAllBtn.addEventListener('click', async () => {
  if (!navigator.onLine) {
    showToast('❌ Tidak ada koneksi internet');
    return;
  }

  const sw = navigator.serviceWorker?.controller;
  if (!sw) {
    // Fallback: cache books manually
    await cacheAllBooksManually();
    return;
  }

  downloadAllBtn.disabled = true;
  downloadAllBtn.innerHTML = '<span>⏳</span> Mengunduh...';
  downloadBar.classList.add('hidden');
  progressWrap.classList.remove('hidden');

  sw.postMessage({ type: 'CACHE_ALL_BOOKS', books: allBooks });
});

async function cacheAllBooksManually() {
  if (!('caches' in window)) {
    showToast('❌ Browser tidak mendukung penyimpanan offline');
    return;
  }

  downloadAllBtn.disabled = true;
  downloadAllBtn.innerHTML = '<span>⏳</span> Mengunduh...';
  downloadBar.classList.add('hidden');
  progressWrap.classList.remove('hidden');

  const cache = await caches.open('perpustakaan-v1');
  const total = allBooks.length;
  let done = 0;

  for (const book of allBooks) {
    progressText.textContent = `Mengunduh: ${book.judul}`;
    progressCount.textContent = `${done} / ${total}`;
    progressFill.style.width = `${(done / total) * 100}%`;

    try {
      await cache.add(book.pdf);
      if (book.cover) await cache.add(book.cover);
    } catch (e) {
      console.warn('Gagal cache:', book.judul, e);
    }
    done++;
  }

  progressFill.style.width = '100%';
  progressText.textContent = 'Semua buku berhasil disimpan!';
  progressCount.textContent = `${done} / ${total}`;

  showToast(`✅ ${total} buku siap dibaca offline!`);
  setTimeout(() => {
    progressWrap.classList.add('hidden');
    downloadBar.classList.remove('hidden');
    downloadAllBtn.disabled = false;
    downloadAllBtn.innerHTML = '<span>✓</span> Sudah Tersimpan';
    // Refresh cards to show offline badges
    renderBooks(allBooks);
  }, 2000);
}

// ── Handle SW Messages (progress updates) ───────────────────
function handleSWMessage(event) {
  const { type, current, total, done } = event.data;

  if (type === 'CACHE_PROGRESS') {
    const pct = total > 0 ? (current / total) * 100 : 0;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `Mengunduh buku ${current} dari ${total}...`;
    progressCount.textContent = `${current} / ${total}`;
  }

  if (type === 'CACHE_DONE') {
    progressFill.style.width = '100%';
    progressText.textContent = 'Semua buku berhasil disimpan!';
    showToast(`✅ ${total} buku siap dibaca offline!`);
    setTimeout(() => {
      progressWrap.classList.add('hidden');
      downloadBar.classList.remove('hidden');
      downloadAllBtn.disabled = false;
      downloadAllBtn.innerHTML = '<span>✓</span> Sudah Tersimpan';
      renderBooks(allBooks);
    }, 2000);
  }

  if (type === 'CACHE_ERROR') {
    showToast('⚠️ Beberapa buku gagal diunduh, coba lagi');
    progressWrap.classList.add('hidden');
    downloadBar.classList.remove('hidden');
    downloadAllBtn.disabled = false;
    downloadAllBtn.innerHTML = '<span>⬇</span> Unduh Semua';
  }
}

// ── Main: Load Books ─────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('./data/books.json');
    if (!res.ok) throw new Error('books.json tidak ditemukan');
    allBooks = await res.json();
    await renderBooks(allBooks);
  } catch (err) {
    console.error('Gagal memuat daftar buku:', err);
    bookGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    bookCount.textContent = '0 Buku';
    if (!navigator.onLine) {
      showToast('📵 Offline — buka dulu saat ada internet', 4000);
    }
  }
}

init();
