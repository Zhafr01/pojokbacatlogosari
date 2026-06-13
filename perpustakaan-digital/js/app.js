/* =============================================================
   app.js — Pojok Baca Tlogosari
   Two-panel catalog: list + detail on click
   ============================================================= */
'use strict';

let allBooks     = [];
let filteredBooks = [];

// ── DOM refs ──────────────────────────────────────────────────
const appWrapper    = document.getElementById('app-wrapper');
const detailPanel   = document.getElementById('detail-panel');
const detailBackdrop= document.getElementById('detail-backdrop');
const popularGrid   = document.getElementById('popular-grid');
const bookGrid      = document.getElementById('book-grid');
const bookCount     = document.getElementById('book-count');
const emptyState    = document.getElementById('empty-state');
const searchInput   = document.getElementById('search-input');
const filterGenre   = document.getElementById('filter-genre');
const filterRating  = document.getElementById('filter-rating');
const filterSort    = document.getElementById('filter-sort');
const resetBtn      = document.getElementById('reset-btn');
const toastEl       = document.getElementById('toast');

// Detail DOM
const detailCoverFallback = document.getElementById('detail-cover-fallback');
const detailCoverEmoji    = document.getElementById('detail-cover-emoji');
const detailCoverTitle    = document.getElementById('detail-cover-title');
const detailCoverWrap     = document.getElementById('detail-cover-wrap');
const detailCat    = document.getElementById('detail-cat');
const detailTitle  = document.getElementById('detail-title');
const detailScore  = document.getElementById('detail-score');
const detailCount  = document.getElementById('detail-count');
const diPenulis    = document.getElementById('di-penulis');
const diTahun      = document.getElementById('di-tahun');
const diBahasa     = document.getElementById('di-bahasa');
const diHalaman    = document.getElementById('di-halaman');
const detailSynopsis   = document.getElementById('detail-synopsis');
const detailReadLinks  = document.getElementById('detail-read-links');
const detailBuyLinks   = document.getElementById('detail-buy-links');

// ── Cover palette ─────────────────────────────────────────────
const PALETTE = [
  ['#FF6B35','#F7C59F'], ['#2D6A4F','#1B4332'],
  ['#F4D03F','#E67E22'], ['#7C3AED','#4C1D95'],
  ['#0E9F7E','#065F46'], ['#1A73E8','#0D47A1'],
  ['#E91E63','#880E4F'], ['#FF5722','#BF360C'],
];
const CAT_EMOJI = {
  'Novel':'📖','Sastra':'🪶','Pendidikan':'🎓',
  'Pengembangan Diri':'🌱','Sains':'🔬','Sejarah':'🏛️',
  'Teknologi':'💻','Umum':'📚',
};
function catEmoji(cat) { return CAT_EMOJI[cat] || '📚'; }
function getPalette(i) { return PALETTE[i % PALETTE.length]; }

// ── Toast ─────────────────────────────────────────────────────
let _toast;
function showToast(msg, ms = 2600) {
  clearTimeout(_toast);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  _toast = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ── Build book cover element ──────────────────────────────────
function buildCover(book, idx, extraClass = '') {
  const [c1, c2] = book.cover_colors || getPalette(idx);
  const cat = book.kategori || 'Umum';

  const wrap = document.createElement('div');
  wrap.className = 'book-cover' + (extraClass ? ' ' + extraClass : '');
  wrap.style.background = `linear-gradient(155deg,${c1} 0%,${c2} 100%)`;

  // Spine
  const spine = document.createElement('div');
  spine.className = 'book-spine';
  spine.style.background = c2;
  wrap.appendChild(spine);

  // Image (if provided)
  if (book.cover) {
    const img = document.createElement('img');
    img.src = book.cover;
    img.alt = book.judul;
    img.loading = 'lazy';
    img.onerror = () => { img.remove(); };
    wrap.appendChild(img);
  }

  // Fallback text
  const fallback = document.createElement('div');
  fallback.className = 'cover-fallback';
  fallback.innerHTML = `
    <span class="cf-emoji">${catEmoji(cat)}</span>
    <span class="cf-title">${book.judul}</span>
  `;
  wrap.appendChild(fallback);

  return wrap;
}

// ── Render a book card ────────────────────────────────────────
function buildCard(book, idx) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Lihat detail: ${book.judul}`);
  card.style.animationDelay = `${idx * 0.055}s`;

  const cover = buildCover(book, allBooks.indexOf(book));
  card.appendChild(cover);

  const info = document.createElement('div');
  info.innerHTML = `
    <p class="card-title">${book.judul}</p>
    <div class="card-rating">
      <span class="card-star">★</span>
      ${(book.rating || 0).toFixed(1)}
    </div>
  `;
  card.appendChild(info);

  card.addEventListener('click', () => openDetail(book));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openDetail(book); });

  return card;
}

// ── Render catalogs ───────────────────────────────────────────
function renderPopular(books) {
  popularGrid.innerHTML = '';
  const popular = books.filter(b => b.populer);
  if (popular.length === 0) {
    document.getElementById('popular-section').style.display = 'none';
    return;
  }
  document.getElementById('popular-section').style.display = '';
  popular.forEach((book, i) => popularGrid.appendChild(buildCard(book, i)));
}

function renderGrid(books) {
  bookGrid.innerHTML = '';
  if (!books.length) {
    emptyState.classList.remove('hidden');
    bookCount.textContent = '';
    return;
  }
  emptyState.classList.add('hidden');
  const total = allBooks.length;
  bookCount.textContent = books.length === total
    ? `${total} buku`
    : `${books.length} / ${total} buku`;

  books.forEach((book, i) => bookGrid.appendChild(buildCard(book, i)));
}

// ── Filter & sort ─────────────────────────────────────────────
function applyFilters() {
  const q      = searchInput.value.trim().toLowerCase();
  const genre  = filterGenre.value;
  const rating = parseFloat(filterRating.value) || 0;
  const sort   = filterSort.value;

  filteredBooks = allBooks.filter(b => {
    const mQ = !q ||
      b.judul.toLowerCase().includes(q) ||
      b.penulis.toLowerCase().includes(q) ||
      (b.sinopsis || '').toLowerCase().includes(q);
    const mG = !genre || (b.kategori || 'Umum') === genre;
    const mR = !rating || (b.rating || 0) >= rating;
    return mQ && mG && mR;
  });

  filteredBooks.sort((a, b) => {
    if (sort === 'tahun')  return (b.tahun || 0) - (a.tahun || 0);
    if (sort === 'judul')  return a.judul.localeCompare(b.judul);
    return (b.rating || 0) - (a.rating || 0); // default: rating
  });

  renderGrid(filteredBooks);
}

// ── Build genre filter options ────────────────────────────────
function buildGenreOptions(books) {
  const genres = [...new Set(books.map(b => b.kategori || 'Umum'))];
  filterGenre.innerHTML = '<option value="">Semua</option>';
  genres.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = catEmoji(g) + ' ' + g;
    filterGenre.appendChild(opt);
  });
}

// ── Open detail panel ────────────────────────────────────────
function openDetail(book) {
  const idx = allBooks.indexOf(book);
  const [c1, c2] = book.cover_colors || getPalette(idx);
  const cat = book.kategori || 'Umum';

  // Cover
  detailCoverWrap.style.background = `linear-gradient(155deg,${c1} 0%,${c2} 100%)`;
  detailCoverEmoji.textContent = catEmoji(cat);
  detailCoverTitle.textContent = book.judul;

  // Meta
  detailCat.textContent = catEmoji(cat) + ' ' + cat;
  detailTitle.textContent = book.judul;
  detailScore.textContent = (book.rating || 0).toFixed(1);
  detailCount.textContent = book.rating_count ? `(${book.rating_count} rating)` : '';
  diPenulis.textContent  = book.penulis || '—';
  diTahun.textContent    = book.tahun   || '—';
  diBahasa.textContent   = book.bahasa  || '—';
  diHalaman.textContent  = book.halaman ? book.halaman + ' halaman' : '—';
  detailSynopsis.textContent = book.sinopsis || 'Sinopsis belum tersedia.';

  // Links
  function buildLinks(container, links) {
    container.innerHTML = '';
    if (!links || !links.length) {
      container.innerHTML = '<p style="font-size:0.75rem;color:#9CA3AF;padding:4px 0">Tidak tersedia</p>';
      return;
    }
    links.forEach(l => {
      const a = document.createElement('a');
      a.href = l.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'legal-link';
      a.innerHTML = `<span>${l.nama}</span><span class="legal-link-arrow">↗</span>`;
      container.appendChild(a);
    });
  }
  buildLinks(detailReadLinks, book.link_baca);
  buildLinks(detailBuyLinks,  book.link_beli);

  // Show panel
  appWrapper.classList.add('detail-open');
  detailPanel.setAttribute('aria-hidden', 'false');
  detailPanel.scrollTop = 0;

  // Mobile backdrop
  if (window.innerWidth <= 768) {
    detailBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

// ── Close detail panel ────────────────────────────────────────
window.closeDetail = function () {
  appWrapper.classList.remove('detail-open');
  detailPanel.setAttribute('aria-hidden', 'true');
  detailBackdrop.classList.add('hidden');
  document.body.style.overflow = '';
};

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && appWrapper.classList.contains('detail-open')) closeDetail();
});

// ── Event listeners ───────────────────────────────────────────
searchInput.addEventListener('input', applyFilters);
filterGenre.addEventListener('change', applyFilters);
filterRating.addEventListener('change', applyFilters);
filterSort.addEventListener('change', applyFilters);
resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterGenre.value = '';
  filterRating.value = '';
  filterSort.value = 'rating';
  applyFilters();
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('./data/books.json');
    if (!res.ok) throw new Error('books.json tidak ditemukan');
    allBooks = await res.json();
    filteredBooks = [...allBooks];
    buildGenreOptions(allBooks);
    renderPopular(allBooks);
    renderGrid(allBooks);
  } catch (err) {
    console.error(err);
    bookGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    showToast('⚠️ Gagal memuat data buku', 4000);
  }
}

init();
