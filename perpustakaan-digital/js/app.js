/* =============================================================
   app.js — Pojok Baca Tlogosari
   ============================================================= */
'use strict';

let allBooks      = [];
let filteredBooks = [];
let filterState   = { genre: '', rating: '', sort: 'rating' };
let customSelects = {};

// ── DOM refs ──────────────────────────────────────────────────
const appWrapper     = document.getElementById('app-wrapper');
const detailPanel    = document.getElementById('detail-panel');
const detailBackdrop = document.getElementById('detail-backdrop');
const popularGrid    = document.getElementById('popular-grid');
const bookGrid       = document.getElementById('book-grid');
const bookCount      = document.getElementById('book-count');
const emptyState     = document.getElementById('empty-state');
const searchInput    = document.getElementById('search-input');
const resetBtn       = document.getElementById('reset-btn');
const toastEl        = document.getElementById('toast');

// Detail DOM
const detailCoverWrap     = document.getElementById('detail-cover-wrap');
const detailCoverEmoji    = document.getElementById('detail-cover-emoji');
const detailCoverTitle    = document.getElementById('detail-cover-title');
const detailCat           = document.getElementById('detail-cat');
const detailTitle         = document.getElementById('detail-title');
const detailScore         = document.getElementById('detail-score');
const detailCount         = document.getElementById('detail-count');
const diPenulis           = document.getElementById('di-penulis');
const diTahun             = document.getElementById('di-tahun');
const diBahasa            = document.getElementById('di-bahasa');
const diHalaman           = document.getElementById('di-halaman');
const detailSynopsis      = document.getElementById('detail-synopsis');
const detailReadLinks     = document.getElementById('detail-read-links');
const detailBuyLinks      = document.getElementById('detail-buy-links');
const detailStock         = document.getElementById('detail-stock');
const btnBorrow           = document.getElementById('btn-borrow');

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
const catEmoji = cat => CAT_EMOJI[cat] || '📚';
const getPalette = i => PALETTE[i % PALETTE.length];

// ── Toast ─────────────────────────────────────────────────────
let _toast;
function showToast(msg, ms = 2600) {
  clearTimeout(_toast);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  _toast = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ── Custom Select ─────────────────────────────────────────────
function buildCustomSelect(containerId, label, options, onChange) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = '';

  let current = options[0];

  // Chevron SVG
  const chevronSVG = `<svg class="cs-chevron" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  // Trigger
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cs-trigger';

  const lblEl  = document.createElement('span');
  lblEl.className = 'cs-lbl';
  lblEl.textContent = label;

  const divEl  = document.createElement('span');
  divEl.className = 'cs-divider';

  const valEl  = document.createElement('span');
  valEl.className = 'cs-val';
  valEl.textContent = current.label;

  trigger.appendChild(lblEl);
  trigger.appendChild(divEl);
  trigger.appendChild(valEl);
  trigger.insertAdjacentHTML('beforeend', chevronSVG);

  // Dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'cs-dropdown';

  function selectOpt(opt, silent = false) {
    current = opt;
    valEl.textContent = opt.label;
    dropdown.querySelectorAll('.cs-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.value === String(opt.value));
    });
    wrap.classList.remove('open');
    if (!silent) onChange(opt.value);
  }

  options.forEach(opt => {
    const item = document.createElement('div');
    item.className = 'cs-item' + (opt.value === current.value ? ' selected' : '');
    item.dataset.value = opt.value;

    const dot = document.createElement('span');
    dot.className = 'cs-item-dot';
    item.appendChild(dot);
    item.appendChild(document.createTextNode(opt.label));

    item.addEventListener('click', () => selectOpt(opt));
    dropdown.appendChild(item);
  });

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = wrap.classList.contains('open');
    // Close all other selects
    document.querySelectorAll('.cs-wrap.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) wrap.classList.add('open');
  });

  wrap.appendChild(trigger);
  wrap.appendChild(dropdown);

  return {
    reset() { selectOpt(options[0], false); },
    getValue() { return current.value; },
  };
}

// Close any open dropdown on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('.cs-wrap.open').forEach(el => el.classList.remove('open'));
});

// ── Cover builder ─────────────────────────────────────────────
function buildCover(book, idx, extraClass = '') {
  const [c1, c2] = book.cover_colors || getPalette(idx);
  const cat = book.kategori || 'Umum';

  const wrap = document.createElement('div');
  wrap.className = 'book-cover' + (extraClass ? ' ' + extraClass : '');
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
function buildCard(book, idx) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Lihat detail: ${book.judul}`);
  card.style.animationDelay = `${idx * 0.055}s`;

  card.appendChild(buildCover(book, allBooks.indexOf(book)));

  const info = document.createElement('div');
  info.innerHTML = `
    <p class="card-title">${book.judul}</p>
    <div class="card-rating">
      <span class="card-star">★</span>
      ${(book.rating || 0).toFixed(1)}
    </div>`;
  card.appendChild(info);

  card.addEventListener('click', () => openDetail(book));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openDetail(book);
  });
  return card;
}

// ── Render ────────────────────────────────────────────────────
function renderPopular(books) {
  popularGrid.innerHTML = '';
  const popular = books.filter(b => b.populer);
  if (!popular.length) {
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
    return (b.rating || 0) - (a.rating || 0);
  });

  renderGrid(filteredBooks);
}

// ── Init custom selects ───────────────────────────────────────
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
  ];

  customSelects.genre  = buildCustomSelect('cs-genre',  'Genre',  genreOpts,  v => { filterState.genre  = v; applyFilters(); });
  customSelects.rating = buildCustomSelect('cs-rating', 'Rating', ratingOpts, v => { filterState.rating = v; applyFilters(); });
  customSelects.sort   = buildCustomSelect('cs-sort',   'Urutan', sortOpts,   v => { filterState.sort   = v; applyFilters(); });
}

// ── Open detail ───────────────────────────────────────────────
function openDetail(book) {
  const idx = allBooks.indexOf(book);
  const [c1, c2] = book.cover_colors || getPalette(idx);
  const cat = book.kategori || 'Umum';

  detailCoverWrap.style.background = `linear-gradient(155deg,${c1} 0%,${c2} 100%)`;
  detailCoverEmoji.textContent = catEmoji(cat);
  detailCoverTitle.textContent = book.judul;
  detailCat.textContent = `${catEmoji(cat)} ${cat}`;
  detailTitle.textContent = book.judul;
  detailScore.textContent = (book.rating || 0).toFixed(1);
  detailCount.textContent = book.rating_count ? `(${book.rating_count} rating)` : '';
  diPenulis.textContent  = book.penulis  || '—';
  diTahun.textContent    = book.tahun    || '—';
  diBahasa.textContent   = book.bahasa   || '—';
  diHalaman.textContent  = book.halaman  ? `${book.halaman} halaman` : '—';
  detailSynopsis.textContent = book.sinopsis || 'Sinopsis belum tersedia.';

  function buildLinks(container, links) {
    container.innerHTML = '';
    if (!links?.length) {
      container.innerHTML = '<p style="font-size:.75rem;color:#9CA3AF;padding:4px 0">Tidak tersedia</p>';
      return;
    }
    links.forEach(l => {
      const a = document.createElement('a');
      a.href = l.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.className = 'legal-link';
      a.innerHTML = `<span>${l.nama}</span><span class="legal-link-arrow">↗</span>`;
      container.appendChild(a);
    });
  }
  buildLinks(detailReadLinks, book.link_baca);
  buildLinks(detailBuyLinks,  book.link_beli);

  appWrapper.classList.add('detail-open');
  detailPanel.setAttribute('aria-hidden', 'false');
  detailPanel.scrollTop = 0;

  if (window.innerWidth <= 768) {
    detailBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // ── Stock & borrow ───────────────────────────────────────
  const totalStok = book.stok || 0;
  const activeLoans = LoanDB.getActiveLoansForBook(book.id);
  const available = Math.max(0, totalStok - activeLoans);
  detailStock.textContent = `${available} / ${totalStok}`;
  detailStock.className = 'borrow-stock-badge ' + (available > 0 ? 'stock-ok' : 'stock-empty');

  if (available > 0) {
    btnBorrow.disabled = false;
    btnBorrow.textContent = '';
    btnBorrow.innerHTML = '<span>📖</span> Pinjam Buku Ini';
  } else {
    btnBorrow.disabled = true;
    btnBorrow.textContent = '';
    btnBorrow.innerHTML = '<span>❌</span> Stok Habis';
  }

  // Store current book for modal
  window._currentBorrowBook = book;
}

// ── Close detail ──────────────────────────────────────────────
window.closeDetail = function () {
  appWrapper.classList.remove('detail-open');
  detailPanel.setAttribute('aria-hidden', 'true');
  detailBackdrop.classList.add('hidden');
  document.body.style.overflow = '';
};

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

// ── Borrow Modal ──────────────────────────────────────────────
const borrowModalOverlay = document.getElementById('borrow-modal-overlay');
const borrowForm         = document.getElementById('borrow-form');
const modalBookInfo      = document.getElementById('modal-book-info');

window.openBorrowModal = function () {
  const book = window._currentBorrowBook;
  if (!book) return;
  modalBookInfo.innerHTML = `
    <div class="mbi-title">${book.judul}</div>
    <div class="mbi-author">${book.penulis}</div>`;
  borrowModalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.closeBorrowModal = function () {
  borrowModalOverlay.classList.add('hidden');
  if (!appWrapper.classList.contains('detail-open') || window.innerWidth > 768) {
    document.body.style.overflow = '';
  }
  borrowForm.reset();
};

window.submitBorrow = function (e) {
  e.preventDefault();
  const book = window._currentBorrowBook;
  if (!book) return;

  const nama  = document.getElementById('borrow-nama').value.trim();
  const dusun = document.getElementById('borrow-dusun').value.trim();
  const hp    = document.getElementById('borrow-hp').value.trim();

  if (!nama || !dusun || !hp) {
    showToast('⚠️ Lengkapi semua field', 3000);
    return;
  }

  // Check if user already has active loan for this book
  if (LoanDB.hasActiveLoan(book.id, hp)) {
    showToast('⚠️ Anda sudah meminjam buku ini', 3000);
    return;
  }

  // Check stock availability
  const totalStok = book.stok || 0;
  const activeLoans = LoanDB.getActiveLoansForBook(book.id);
  if (activeLoans >= totalStok) {
    showToast('❌ Stok buku habis', 3000);
    return;
  }

  LoanDB.createLoan({
    bookId: book.id,
    bookTitle: book.judul,
    nama,
    dusun,
    hp,
  });

  closeBorrowModal();
  showToast('✅ Peminjaman berhasil diajukan!', 3500);

  // Refresh stock display
  openDetail(book);
};

// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (borrowModalOverlay && !borrowModalOverlay.classList.contains('hidden')) {
      closeBorrowModal();
    } else if (appWrapper.classList.contains('detail-open')) {
      closeDetail();
    }
  }
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('./data/books.json');
    if (!res.ok) throw new Error('books.json tidak ditemukan');
    allBooks = await res.json();
    filteredBooks = [...allBooks];
    initSelects(allBooks);
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
