/* =============================================================
   katalog-fisik.js — Pojok Baca Tlogosari
   Halaman katalog buku fisik (offline: true)
   ============================================================= */
'use strict';

let allBooks      = [];
let filteredBooks = [];
let filterState   = { genre: '', rating: '', sort: 'rating' };
let customSelects = {};

// ── DOM refs ──────────────────────────────────────────────────
const katalogGrid   = document.getElementById('katalog-grid');
const katalogEmpty  = document.getElementById('catalog-empty');
const katalogCount  = document.getElementById('catalog-count');
const searchInput   = document.getElementById('katalog-search');
const resetBtn      = document.getElementById('reset-btn');
const toastEl       = document.getElementById('toast');

// ── Palettes & helpers ────────────────────────────────────────
const PALETTE = [
  ['#FF6B35','#F7A06B'], ['#2D6A4F','#1B4332'],
  ['#F59E0B','#D97706'], ['#7C3AED','#5B21B6'],
  ['#0E9F7E','#065F46'], ['#1A73E8','#0D47A1'],
  ['#E91E63','#880E4F'], ['#DC2626','#991B1B'],
  ['#D97706','#92400E'], ['#1E3A5F','#0F172A'],
];
const CAT_EMOJI = {
  'Novel':'📖','Sastra':'🪶','Pendidikan':'🎓',
  'Pengembangan Diri':'🌱','Sains':'🔬','Sejarah':'🏛️',
  'Teknologi':'💻','Umum':'📚',
};
const catEmoji  = cat => CAT_EMOJI[cat] || '📚';
const getPalette = i => PALETTE[i % PALETTE.length];

// ── Toast ─────────────────────────────────────────────────────
let _toast;
function showToast(msg, ms = 2600) {
  clearTimeout(_toast);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  _toast = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ── Cover builder ─────────────────────────────────────────────
function buildCover(book, idx) {
  const [c1, c2] = book.cover_colors || getPalette(idx);
  const cat = book.kategori || 'Umum';

  const wrap = document.createElement('div');
  wrap.className = 'book-cover';
  wrap.style.background = `linear-gradient(155deg,${c1} 0%,${c2} 100%)`;

  const spine = document.createElement('div');
  spine.className = 'book-spine';
  spine.style.background = c2;
  wrap.appendChild(spine);

  if (book.cover) {
    const img = document.createElement('img');
    img.src = book.cover;
    img.alt = book.judul;
    img.loading = 'lazy';
    img.onerror = () => img.remove();
    wrap.appendChild(img);
  }

  const fallback = document.createElement('div');
  fallback.className = 'cover-fallback';
  fallback.innerHTML = `
    <span class="cf-emoji">${catEmoji(cat)}</span>
    <span class="cf-title">${book.judul}</span>`;
  wrap.appendChild(fallback);
  return wrap;
}

// ── Book card ─────────────────────────────────────────────────
function buildCard(book, globalIdx) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Lihat detail: ${book.judul}`);

  // Badge stok
  const available = Math.max(0, (book.stok || 0) - LoanDB.getActiveLoansForBook(book.id));
  const stockBadge = document.createElement('div');
  stockBadge.className = 'card-stock-badge ' + (available > 0 ? 'badge-ok' : 'badge-empty');
  stockBadge.textContent = available > 0 ? `Stok: ${available}` : 'Habis';
  card.appendChild(stockBadge);

  card.appendChild(buildCover(book, globalIdx));

  const info = document.createElement('div');
  info.innerHTML = `
    <p class="card-title">${book.judul}</p>
    <div class="card-rating">
      <span class="card-star">★</span>
      ${(book.rating || 0).toFixed(1)}
    </div>`;
  card.appendChild(info);

  // Klik → redirect ke index.html?book=ID
  card.addEventListener('click', () => {
    window.location.href = `index.html?book=${book.id}`;
  });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      window.location.href = `index.html?book=${book.id}`;
    }
  });
  return card;
}

// ── Render ────────────────────────────────────────────────────
function renderGrid(books) {
  katalogGrid.innerHTML = '';
  if (!books.length) {
    katalogEmpty.classList.remove('hidden');
    katalogCount.textContent = '';
    return;
  }
  katalogEmpty.classList.add('hidden');
  const total = allBooks.length;
  katalogCount.textContent = books.length === total
    ? `${total} buku fisik`
    : `${books.length} / ${total} buku fisik`;
  books.forEach((book, i) => {
    const globalIdx = allBooks.indexOf(book);
    katalogGrid.appendChild(buildCard(book, globalIdx));
  });
}

// ── Filter ────────────────────────────────────────────────────
function applyFilters() {
  const q   = searchInput.value.trim().toLowerCase();
  const { genre, rating, sort } = filterState;

  filteredBooks = allBooks.filter(b => {
    const mQ = !q ||
      b.judul.toLowerCase().includes(q) ||
      b.penulis.toLowerCase().includes(q) ||
      (b.sinopsis || '').toLowerCase().includes(q);
    const mG = !genre || (b.kategori || 'Umum') === genre;
    const mR = !rating || (b.rating || 0) >= parseFloat(rating);
    return mQ && mG && mR;
  });

  filteredBooks.sort((a, b) => {
    if (sort === 'tahun') return (b.tahun || 0) - (a.tahun || 0);
    if (sort === 'judul') return a.judul.localeCompare(b.judul);
    if (sort === 'stok')  return (b.stok || 0) - (a.stok || 0);
    return (b.rating || 0) - (a.rating || 0);
  });

  renderGrid(filteredBooks);
}

// ── Custom Select ─────────────────────────────────────────────
function buildCustomSelect(containerId, label, options, onChange) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';

  let current = options[0];
  const chevronSVG = `<svg class="cs-chevron" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cs-trigger';

  const lblEl = document.createElement('span'); lblEl.className = 'cs-lbl'; lblEl.textContent = label;
  const divEl = document.createElement('span'); divEl.className = 'cs-divider';
  const valEl = document.createElement('span'); valEl.className = 'cs-val'; valEl.textContent = current.label;

  trigger.appendChild(lblEl); trigger.appendChild(divEl); trigger.appendChild(valEl);
  trigger.insertAdjacentHTML('beforeend', chevronSVG);

  const dropdown = document.createElement('div');
  dropdown.className = 'cs-dropdown';

  function selectOpt(opt, silent = false) {
    current = opt;
    valEl.textContent = opt.label;
    dropdown.querySelectorAll('.cs-item').forEach(el =>
      el.classList.toggle('selected', el.dataset.value === String(opt.value)));
    wrap.classList.remove('open');
    if (!silent) onChange(opt.value);
  }

  options.forEach(opt => {
    const item = document.createElement('div');
    item.className = 'cs-item' + (opt.value === current.value ? ' selected' : '');
    item.dataset.value = opt.value;
    const dot = document.createElement('span'); dot.className = 'cs-item-dot';
    item.appendChild(dot);
    item.appendChild(document.createTextNode(opt.label));
    item.addEventListener('click', () => selectOpt(opt));
    dropdown.appendChild(item);
  });

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = wrap.classList.contains('open');
    document.querySelectorAll('.cs-wrap.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) wrap.classList.add('open');
  });

  wrap.appendChild(trigger); wrap.appendChild(dropdown);
  return {
    reset() { selectOpt(options[0], false); },
    getValue() { return current.value; },
  };
}

document.addEventListener('click', () => {
  document.querySelectorAll('.cs-wrap.open').forEach(el => el.classList.remove('open'));
});

// ── Init selects ──────────────────────────────────────────────
function initSelects(books) {
  const genres = [...new Set(books.map(b => b.kategori || 'Umum'))];
  const genreOpts = [
    { value: '', label: 'Semua Genre' },
    ...genres.map(g => ({ value: g, label: `${catEmoji(g)} ${g}` })),
  ];
  const ratingOpts = [
    { value: '',    label: 'Semua Rating' },
    { value: '4.5', label: '★ 4.5 ke atas' },
    { value: '4',   label: '★ 4.0 ke atas' },
  ];
  const sortOpts = [
    { value: 'rating', label: 'Rating Tertinggi' },
    { value: 'tahun',  label: 'Terbaru' },
    { value: 'judul',  label: 'A – Z' },
    { value: 'stok',   label: 'Stok Terbanyak' },
  ];

  customSelects.genre  = buildCustomSelect('cs-genre',  'Genre',  genreOpts,  v => { filterState.genre  = v; applyFilters(); });
  customSelects.rating = buildCustomSelect('cs-rating', 'Rating', ratingOpts, v => { filterState.rating = v; applyFilters(); });
  customSelects.sort   = buildCustomSelect('cs-sort',   'Urutan', sortOpts,   v => { filterState.sort   = v; applyFilters(); });
}

// ── Event listeners ───────────────────────────────────────────
searchInput.addEventListener('input', applyFilters);

resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  filterState = { genre: '', rating: '', sort: 'rating' };
  customSelects.genre?.reset();
  customSelects.rating?.reset();
  customSelects.sort?.reset();
  applyFilters();
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('./data/books.json?v=' + new Date().getTime());
    if (!res.ok) throw new Error('books.json tidak ditemukan');
    const raw = await res.json();
    // Filter hanya buku fisik, merge dengan overrides admin
    const merged = BookDB.mergeWithOverrides(raw);
    allBooks = merged.filter(b => b.offline);
    filteredBooks = [...allBooks];
    initSelects(allBooks);
    renderGrid(allBooks);
  } catch (err) {
    console.error(err);
    katalogGrid.innerHTML = '';
    katalogEmpty.classList.remove('hidden');
    showToast('Gagal memuat data buku', 4000);
  }
}

init();
