/* =============================================================
   app.js — Pojok Baca Tlogosari
   Katalog buku: judul · sinopsis · rating · link baca & beli
   ============================================================= */

'use strict';

// ── State ────────────────────────────────────────────────────
let allBooks      = [];
let filteredBooks = [];
let activeFilter  = 'Semua';

// ── DOM ──────────────────────────────────────────────────────
const bookGrid       = document.getElementById('book-grid');
const bookCount      = document.getElementById('book-count');
const emptyState     = document.getElementById('empty-state');
const installBanner  = document.getElementById('install-banner');
const installBtn     = document.getElementById('install-btn');
const installDismiss = document.getElementById('install-dismiss');
const toastEl        = document.getElementById('toast');
const searchInput    = document.getElementById('search-input');
const filterBar      = document.getElementById('filter-bar');
let deferredInstallPrompt = null;

// ── PWA Install ───────────────────────────────────────────────
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
installDismiss.addEventListener('click', () => installBanner.classList.add('hidden'));
window.addEventListener('appinstalled', () => {
  installBanner.classList.add('hidden');
  deferredInstallPrompt = null;
});

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2800) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ── Cover Color Palettes (vivid & bright) ─────────────────────
const COVER_PALETTES = [
  { bg: ['#FF6B6B', '#FF8E53'], text: '#FFFFFF', spine: '#FF4500' },
  { bg: ['#0E9F7E', '#00B4A0'], text: '#FFFFFF', spine: '#007A61' },
  { bg: ['#6C63FF', '#48CAE4'], text: '#FFFFFF', spine: '#4A42D0' },
  { bg: ['#F59E0B', '#F97316'], text: '#FFFFFF', spine: '#D97706' },
  { bg: ['#EC4899', '#A855F7'], text: '#FFFFFF', spine: '#BE185D' },
  { bg: ['#3B82F6', '#06B6D4'], text: '#FFFFFF', spine: '#1D4ED8' },
];
function getPalette(i) { return COVER_PALETTES[i % COVER_PALETTES.length]; }

// ── Category emoji map ────────────────────────────────────────
const CAT_EMOJI = {
  'Novel': '📖', 'Sastra': '🪶', 'Pendidikan': '🎓',
  'Pengembangan Diri': '🌱', 'Sains': '🔬', 'Sejarah': '🏛️',
  'Teknologi': '💻', 'Umum': '📚',
};
function catEmoji(cat) { return CAT_EMOJI[cat] || '📚'; }

// ── SVG Star Rating ───────────────────────────────────────────
function renderStarsSVG(rating) {
  const STAR_PATH = "points='6,1 7.5,4.5 11,4.8 8.5,7 9.3,10.5 6,8.7 2.7,10.5 3.5,7 1,4.8 4.5,4.5'";
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      // full star
      stars.push(`<svg class="star-icon" viewBox="0 0 12 12"><polygon ${STAR_PATH} fill="#F59E0B"/></svg>`);
    } else if (rating >= i - 0.5) {
      // half star
      const id = `s${i}_${Math.random().toString(36).slice(2,6)}`;
      stars.push(`<svg class="star-icon" viewBox="0 0 12 12">
        <defs><linearGradient id="${id}"><stop offset="50%" stop-color="#F59E0B"/><stop offset="50%" stop-color="#E2F5EE"/></linearGradient></defs>
        <polygon ${STAR_PATH} fill="url(#${id})"/>
      </svg>`);
    } else {
      // empty star
      stars.push(`<svg class="star-icon" viewBox="0 0 12 12"><polygon ${STAR_PATH} fill="#D1FAE5"/></svg>`);
    }
  }
  return `<div class="stars-wrap" aria-hidden="true">${stars.join('')}</div>`;
}

// ── Build Filter Buttons ──────────────────────────────────────
function buildFilters(books) {
  const cats = ['Semua', ...new Set(books.map(b => b.kategori || 'Umum'))];
  filterBar.innerHTML = '';
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === activeFilter ? ' active' : '');
    btn.setAttribute('aria-pressed', String(cat === activeFilter));
    btn.innerHTML = `<span>${cat === 'Semua' ? '✨ Semua' : catEmoji(cat) + ' ' + cat}</span>`;
    btn.addEventListener('click', () => {
      activeFilter = cat;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      applyFilters();
    });
    filterBar.appendChild(btn);
  });
}

// ── Search + Filter ───────────────────────────────────────────
function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  filteredBooks = allBooks.filter(book => {
    const matchCat = activeFilter === 'Semua' || (book.kategori || 'Umum') === activeFilter;
    const matchQ   = !q ||
      book.judul.toLowerCase().includes(q) ||
      book.penulis.toLowerCase().includes(q) ||
      (book.sinopsis || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  renderBooks(filteredBooks);
}

// ── Render Cards ──────────────────────────────────────────────
function renderBooks(books) {
  bookGrid.innerHTML = '';

  if (!books || books.length === 0) {
    emptyState.classList.remove('hidden');
    bookCount.textContent = '0 buku ditemukan';
    return;
  }

  emptyState.classList.add('hidden');
  bookCount.textContent = books.length === allBooks.length
    ? `${allBooks.length} buku tersedia`
    : `${books.length} dari ${allBooks.length} buku`;

  books.forEach((book, idx) => {
    const palette  = getPalette(allBooks.indexOf(book));
    const rating   = book.rating || 0;
    const sinopsis = book.sinopsis || 'Sinopsis belum tersedia.';
    const linkBaca = book.link_baca || '#';
    const linkBeli = book.link_beli || '#';
    const cat      = book.kategori || 'Umum';
    const bgGrad   = `linear-gradient(155deg, ${palette.bg[0]} 0%, ${palette.bg[1]} 100%)`;

    const card = document.createElement('article');
    card.className = 'book-card';
    card.setAttribute('role', 'listitem');
    card.id = `card-${book.id}`;
    card.style.animationDelay = `${idx * 0.06}s`;

    card.innerHTML = `
      <div class="book-cover-wrap" style="background:${bgGrad};">
        <img
          src="${book.cover || ''}"
          alt="Cover ${book.judul}"
          loading="lazy"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
        >
        <div class="cover-fallback" style="${book.cover ? 'display:none;' : ''}">
          <div class="cover-fallback-icon">${catEmoji(cat)}</div>
          <div class="cover-fallback-title" style="color:${palette.text};">${book.judul}</div>
        </div>
        <span class="category-badge">${catEmoji(cat)} ${cat}</span>
        <div class="spine" style="background:${palette.spine};"></div>
      </div>

      <div class="book-info">
        <h2 class="book-title">${book.judul}</h2>
        <p class="book-author">${book.penulis}</p>

        <div class="book-rating" aria-label="Rating ${rating} dari 5">
          ${renderStarsSVG(rating)}
          <span class="rating-score">${rating.toFixed(1)}</span>
        </div>

        <p class="book-synopsis">${sinopsis}</p>

        <div class="book-actions">
          <a href="${linkBaca}" target="_blank" rel="noopener noreferrer"
             class="action-btn read-btn" aria-label="Baca online: ${book.judul}">
            📖 Baca Online
          </a>
          <a href="${linkBeli}" target="_blank" rel="noopener noreferrer"
             class="action-btn buy-btn" aria-label="Beli buku: ${book.judul}">
            🛒 Beli
          </a>
        </div>
      </div>
    `;

    bookGrid.appendChild(card);
  });
}

// ── Search listener ───────────────────────────────────────────
searchInput.addEventListener('input', applyFilters);

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('./data/books.json');
    if (!res.ok) throw new Error('books.json tidak ditemukan');
    allBooks = await res.json();
    filteredBooks = [...allBooks];
    buildFilters(allBooks);
    renderBooks(allBooks);
  } catch (err) {
    console.error('Gagal memuat data buku:', err);
    bookGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    bookCount.textContent = '0 buku';
    showToast('⚠️ Gagal memuat data buku', 4000);
  }
}

init();
