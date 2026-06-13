/* =============================================================
   app.js — Pojok Baca Tlogosari
   Katalog buku: judul · sinopsis · rating · link baca & beli
   ============================================================= */

'use strict';

// ── State ────────────────────────────────────────────────────
let allBooks     = [];
let filteredBooks = [];
let activeFilter  = 'Semua';

// ── DOM ──────────────────────────────────────────────────────
const bookGrid      = document.getElementById('book-grid');
const bookCount     = document.getElementById('book-count');
const emptyState    = document.getElementById('empty-state');
const installBanner = document.getElementById('install-banner');
const installBtn    = document.getElementById('install-btn');
const installDismiss= document.getElementById('install-dismiss');
const toastEl       = document.getElementById('toast');
const searchInput   = document.getElementById('search-input');
const filterBar     = document.getElementById('filter-bar');
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

// ── Cover color palette (rich dark gradients) ─────────────────
const COVER_PALETTES = [
  { bg: ['#3D1A10', '#7B3520'], text: '#F4A91D', accent: '#E8A045', spine: '#E8A045' },
  { bg: ['#0D2B1F', '#1B5E40'], text: '#52C87A', accent: '#4CAF50', spine: '#52C87A' },
  { bg: ['#0E1D3B', '#1A3A6B'], text: '#7EC8E3', accent: '#4FC3F7', spine: '#4FC3F7' },
  { bg: ['#2D0B3D', '#5C1E72'], text: '#CE93D8', accent: '#BA68C8', spine: '#BA68C8' },
  { bg: ['#1A1A3B', '#2D2D7A'], text: '#FFD54F', accent: '#FFB300', spine: '#FFB300' },
  { bg: ['#1B2635', '#2E4057'], text: '#80CBC4', accent: '#4DB6AC', spine: '#4DB6AC' },
];

function getPalette(index) {
  return COVER_PALETTES[index % COVER_PALETTES.length];
}

// ── SVG Star Rating ───────────────────────────────────────────
function renderStarsSVG(rating) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
    const id = `half-${Math.random().toString(36).slice(2,7)}-${i}`;

    if (filled === 1) {
      stars.push(`<svg class="star-icon" viewBox="0 0 12 12">
        <polygon points="6,1 7.5,4.5 11,4.8 8.5,7 9.3,10.5 6,8.7 2.7,10.5 3.5,7 1,4.8 4.5,4.5"
          fill="#F4A91D" stroke="none"/>
      </svg>`);
    } else if (filled === 0.5) {
      stars.push(`<svg class="star-icon" viewBox="0 0 12 12">
        <defs>
          <linearGradient id="${id}">
            <stop offset="50%" stop-color="#F4A91D"/>
            <stop offset="50%" stop-color="#3D2314"/>
          </linearGradient>
        </defs>
        <polygon points="6,1 7.5,4.5 11,4.8 8.5,7 9.3,10.5 6,8.7 2.7,10.5 3.5,7 1,4.8 4.5,4.5"
          fill="url(#${id})" stroke="none"/>
      </svg>`);
    } else {
      stars.push(`<svg class="star-icon" viewBox="0 0 12 12">
        <polygon points="6,1 7.5,4.5 11,4.8 8.5,7 9.3,10.5 6,8.7 2.7,10.5 3.5,7 1,4.8 4.5,4.5"
          fill="#3D2314" stroke="none"/>
      </svg>`);
    }
  }
  return `<div class="stars-wrap" aria-hidden="true">${stars.join('')}</div>`;
}

// ── Category emoji map ────────────────────────────────────────
const CAT_EMOJI = {
  'Novel': '📖', 'Sastra': '🪶', 'Pendidikan': '🎓',
  'Pengembangan Diri': '🌱', 'Sains': '🔬', 'Sejarah': '🏛️',
  'Teknologi': '💻', 'Umum': '📚',
};
function catEmoji(cat) { return CAT_EMOJI[cat] || '📚'; }

// ── Build Filter Buttons ──────────────────────────────────────
function buildFilters(books) {
  const categories = ['Semua', ...new Set(books.map(b => b.kategori || 'Umum'))];
  filterBar.innerHTML = '';
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === activeFilter ? ' active' : '');
    btn.setAttribute('aria-pressed', cat === activeFilter);
    // wrap text in span so ::before gradient still works
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
  const query = searchInput.value.trim().toLowerCase();
  filteredBooks = allBooks.filter(book => {
    const matchCat = activeFilter === 'Semua' ||
      (book.kategori || 'Umum') === activeFilter;
    const matchQ = !query ||
      book.judul.toLowerCase().includes(query) ||
      book.penulis.toLowerCase().includes(query) ||
      (book.sinopsis || '').toLowerCase().includes(query);
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
  const total = allBooks.length;
  const shown = books.length;
  bookCount.textContent = shown === total
    ? `${total} buku tersedia`
    : `${shown} dari ${total} buku`;

  books.forEach((book, i) => {
    const palette  = getPalette(allBooks.indexOf(book));
    const rating   = book.rating || 0;
    const sinopsis = book.sinopsis || 'Sinopsis belum tersedia.';
    const linkBaca = book.link_baca || '#';
    const linkBeli = book.link_beli || '#';
    const bgGrad   = `linear-gradient(160deg, ${palette.bg[0]} 0%, ${palette.bg[1]} 100%)`;
    const cat      = book.kategori || 'Umum';

    const card = document.createElement('article');
    card.className = 'book-card';
    card.setAttribute('role', 'listitem');
    card.id = `card-${book.id}`;
    card.style.animationDelay = `${i * 0.06}s`;

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
        <div class="spine" style="background:${palette.spine};opacity:0.7;"></div>
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
          <a
            href="${linkBaca}"
            target="_blank"
            rel="noopener noreferrer"
            class="action-btn read-btn"
            aria-label="Baca online: ${book.judul}"
          >📖 Baca Online</a>
          <a
            href="${linkBeli}"
            target="_blank"
            rel="noopener noreferrer"
            class="action-btn buy-btn"
            aria-label="Beli buku: ${book.judul}"
          >🛒 Beli</a>
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
