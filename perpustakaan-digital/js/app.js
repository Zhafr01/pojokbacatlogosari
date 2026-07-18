/* =============================================================
   app.js — Pojok Baca Tlogosari
   ============================================================= */
'use strict';

let allBooks = [];

// ── DOM refs ──────────────────────────────────────────────────
const appWrapper     = document.getElementById('app-wrapper');
const detailPanel    = document.getElementById('detail-panel');
const detailBackdrop = document.getElementById('detail-backdrop');
const popularGrid    = document.getElementById('popular-grid');
const bookGrid       = document.getElementById('book-grid');
const bookCount      = document.getElementById('book-count');
const searchInput    = document.getElementById('search-input');
const toastEl        = document.getElementById('toast');

let homeFilter   = 'all'; // 'all' | 'offline' | 'online'
let homeFilterState = { genre: '', rating: '', sort: 'default' };

// Detail DOM
const detailCoverWrap     = document.getElementById('detail-cover-wrap');
const detailCoverEmoji    = document.getElementById('detail-cover-emoji');
const detailCoverTitle    = document.getElementById('detail-cover-title');
const detailCat           = document.getElementById('detail-cat');
const detailTitle         = document.getElementById('detail-title');
const detailScore         = document.getElementById('detail-score');
const detailCount         = document.getElementById('detail-count');
const diPenulis           = document.getElementById('di-penulis');
const diTempatTerbit      = document.getElementById('di-tempat-terbit');
const diPenerbit          = document.getElementById('di-penerbit');
const diTahun             = document.getElementById('di-tahun');
const diBahasa            = document.getElementById('di-bahasa');
const diHalaman           = document.getElementById('di-halaman');
const detailSynopsis      = document.getElementById('detail-synopsis');
const detailReadLinks     = document.getElementById('detail-read-links');
const detailBuyLinks      = document.getElementById('detail-buy-links');
const detailStock         = document.getElementById('detail-stock');
const btnBorrow           = document.getElementById('btn-borrow');

// ── Palettes & helpers ────────────────────────────────────────
const VINTAGE_COLORS = [
  'var(--card-red)', 'var(--card-green)', 'var(--card-yellow)',
  'var(--card-purple)', 'var(--card-blue)', 'var(--card-orange)'
];
const CAT_EMOJI = {
  'Novel':'📖','Sastra':'🪶','Pendidikan':'🎓',
  'Pengembangan Diri':'🌱','Sains':'🔬','Sejarah':'🏛️',
  'Teknologi':'💻','Umum':'📚',
};
const catEmoji = cat => CAT_EMOJI[cat] || '📚';
const getVintageColor = i => VINTAGE_COLORS[i % VINTAGE_COLORS.length];

// ── Toast ─────────────────────────────────────────────────────
let _toast;
function showToast(msg, ms = 2600) {
  clearTimeout(_toast);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  _toast = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ── Book card ─────────────────────────────────────────────────
function buildCard(book, idx) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.setAttribute('role', 'listitem');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Lihat detail: ${book.judul}`);
  card.style.animationDelay = `${idx * 0.055}s`;
  card.style.setProperty('--card-color', getVintageColor(idx));

  const cat = book.kategori || 'Umum';

  const hasCover = !!book.cover;

  card.innerHTML = `
    <div class="masking-tape"></div>
    ${hasCover ? `<div class="card-cover-img" style="background-image: url(${book.cover})"></div>` : ''}
    <div class="card-icon" style="${hasCover ? 'display:none;' : ''}">${catEmoji(cat)}</div>
    <h3 class="card-title" style="${hasCover ? 'text-shadow: 1px 1px 4px rgba(0,0,0,0.8), -1px -1px 4px rgba(0,0,0,0.8); z-index:3;' : ''}">${book.judul}</h3>
    <div class="card-rating" style="${hasCover ? 'z-index:4;' : ''}">
      <span class="card-star">★</span>
      ${(book.rating || 0).toFixed(1)}
    </div>
  `;

  card.addEventListener('click', () => openDetail(book));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openDetail(book);
  });
  return card;
}

// ── Render sections ───────────────────────────────────────────
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

function renderAllBooks(books) {
  bookGrid.innerHTML = '';
  const emptyEl = document.getElementById('empty-state');

  // 1. Filter berdasarkan tipe (tab)
  let filtered = books;
  if (homeFilter === 'offline') filtered = books.filter(b => b.offline);
  if (homeFilter === 'online')  filtered = books.filter(b => b.online);

  // 2. Filter genre
  if (homeFilterState.genre) {
    filtered = filtered.filter(b => (b.kategori || 'Umum') === homeFilterState.genre);
  }

  // 3. Filter rating minimum
  if (homeFilterState.rating) {
    filtered = filtered.filter(b => (b.rating || 0) >= parseFloat(homeFilterState.rating));
  }

  // 4. Urutkan
  const sort = homeFilterState.sort;
  if (sort === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sort === 'tahun') filtered = [...filtered].sort((a, b) => (b.tahun || 0) - (a.tahun || 0));
  else if (sort === 'judul') filtered = [...filtered].sort((a, b) => a.judul.localeCompare(b.judul, 'id'));

  if (!filtered.length) {
    emptyEl?.classList.remove('hidden');
    if (bookCount) bookCount.textContent = '';
    return;
  }
  emptyEl?.classList.add('hidden');
  if (bookCount) bookCount.textContent = `${filtered.length} buku`;

  filtered.forEach((book, i) => {
    const card = buildCard(book, i);
    if (book.offline || book.online) {
      const badge = document.createElement('div');
      if (book.offline && book.online) {
        badge.className = 'card-type-badge badge-both';
        badge.textContent = '📚💻';
      } else if (book.offline) {
        badge.className = 'card-type-badge badge-fisik';
        badge.textContent = '📚 Fisik';
      } else {
        badge.className = 'card-type-badge badge-online';
        badge.textContent = '💻 E-Book';
      }
      card.appendChild(badge);
    }
    bookGrid.appendChild(card);
  });
}

window.setHomeFilter = function (filter) {
  homeFilter = filter;
  document.querySelectorAll('.home-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  handleSearch();
};

function initHomeFilters(books) {
  const genres = [...new Set(books.map(b => b.kategori || 'Umum'))].sort();
  const genreContainer = document.getElementById('hf-genres');
  
  if (genreContainer) {
    let genreHtml = `<button class="hf-genre-pill active" data-genre="">Semua</button>`;
    genres.forEach(g => {
      genreHtml += `<button class="hf-genre-pill" data-genre="${g}">${g}</button>`;
    });
    genreContainer.innerHTML = genreHtml;

    genreContainer.querySelectorAll('.hf-genre-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        genreContainer.querySelectorAll('.hf-genre-pill').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        homeFilterState.genre = e.currentTarget.dataset.genre;
        handleSearch();
      });
    });
  }

  function setupDropdown(id, stateKey, onChange) {
    const dd = document.getElementById(id);
    if (!dd) return;
    const trigger = dd.querySelector('.cd-trigger');
    const valText = dd.querySelector('.cd-value');
    const items = dd.querySelectorAll('.cd-item');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-dropdown.open').forEach(el => {
        if (el !== dd) el.classList.remove('open');
      });
      dd.classList.toggle('open');
    });

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        valText.textContent = item.textContent;
        homeFilterState[stateKey] = item.dataset.value;
        dd.classList.remove('open');
        onChange();
      });
    });
  }

  setupDropdown('dd-rating', 'rating', handleSearch);
  setupDropdown('dd-sort', 'sort', handleSearch);

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-dropdown.open').forEach(el => el.classList.remove('open'));
  });

  const resetBtn = document.getElementById('home-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      homeFilterState = { genre: '', rating: '', sort: 'default' };
      
      const ddRating = document.getElementById('dd-rating');
      if (ddRating) {
        ddRating.querySelector('.cd-value').textContent = 'Semua';
        ddRating.querySelectorAll('.cd-item').forEach(i => i.classList.remove('active'));
        ddRating.querySelector('[data-value=""]').classList.add('active');
      }

      const ddSort = document.getElementById('dd-sort');
      if (ddSort) {
        ddSort.querySelector('.cd-value').textContent = 'Default';
        ddSort.querySelectorAll('.cd-item').forEach(i => i.classList.remove('active'));
        ddSort.querySelector('[data-value="default"]').classList.add('active');
      }

      if (genreContainer) {
        genreContainer.querySelectorAll('.hf-genre-pill').forEach(b => b.classList.remove('active'));
        const allBtn = genreContainer.querySelector('[data-genre=""]');
        if (allBtn) allBtn.classList.add('active');
      }
      searchInput.value = '';
      handleSearch();
    });
  }
}

// ── Search (live filter pada homepage) ─────────────────────────
function handleSearch() {
  const q = searchInput.value.trim().toLowerCase();
  const src = q
    ? allBooks.filter(b =>
        b.judul.toLowerCase().includes(q) ||
        b.penulis.toLowerCase().includes(q) ||
        (b.sinopsis || '').toLowerCase().includes(q)
      )
    : allBooks;
  renderPopular(src);
  renderAllBooks(src);
}

searchInput && searchInput.addEventListener('input', handleSearch);

// ── Open detail ───────────────────────────────────────────────
function openDetail(book) {
  const idx = allBooks.indexOf(book);
  const bgColor = getVintageColor(idx);
  const cat = book.kategori || 'Umum';

  if (book.cover) {
    detailCoverWrap.style.background = `url(${book.cover}) center/cover no-repeat`;
    detailCoverEmoji.style.display = 'none';
    detailCoverTitle.style.display = 'none';
  } else {
    detailCoverWrap.style.background = bgColor;
    detailCoverEmoji.style.display = '';
    detailCoverTitle.style.display = '';
    detailCoverEmoji.textContent = catEmoji(cat);
    detailCoverTitle.textContent = book.judul;
  }
  detailCoverWrap.style.border = '1.5px solid rgba(0,0,0,0.15)';
  detailCat.textContent = `${catEmoji(cat)} ${cat}`;
  detailTitle.textContent = book.judul;
  detailScore.textContent = (book.rating || 0).toFixed(1);
  detailCount.textContent = book.rating_count ? `(${book.rating_count} rating)` : '';
  diPenulis.textContent  = book.penulis  || '—';
  diTempatTerbit.textContent = book.tempat_terbit || '—';
  diPenerbit.textContent = book.penerbit || '—';
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

  // ── Stock & borrow ─────────────────────────────────────────
  const totalStok = book.stok || 0;
  const activeLoans = LoanDB.getActiveLoansForBook(book.id);
  const available = Math.max(0, totalStok - activeLoans);
  detailStock.textContent = `${available} / ${totalStok}`;
  detailStock.className = 'borrow-stock-badge ' + (available > 0 ? 'stock-ok' : 'stock-empty');

  // Sembunyikan borrow section jika buku tidak offline
  const borrowSection = document.querySelector('.borrow-section');
  if (borrowSection) {
    borrowSection.style.display = book.offline ? '' : 'none';
  }

  if (available > 0) {
    btnBorrow.disabled = false;
    btnBorrow.style.pointerEvents = 'auto';
    btnBorrow.innerHTML = 'Ajukan Peminjaman';
    btnBorrow.onclick = () => openRequestLoanModal();
  } else {
    btnBorrow.disabled = true;
    btnBorrow.style.pointerEvents = 'none';
    btnBorrow.innerHTML = '<span>❌</span> Stok Habis';
    btnBorrow.onclick = null;
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


// ── Keyboard shortcuts ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (appWrapper.classList.contains('detail-open')) {
      closeDetail();
    }
  }
});

// ── URL param: ?book=ID (redirect dari halaman katalog) ────────
function checkUrlBook() {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get('book');
  if (bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (book) {
      setTimeout(() => openDetail(book), 200);
    }
  }
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('./data/books.json?v=' + new Date().getTime());
    if (!res.ok) throw new Error('books.json tidak ditemukan');
    const raw = await res.json();
    allBooks = BookDB.mergeWithOverrides(raw);

    initHomeFilters(allBooks);
    renderPopular(allBooks);
    renderAllBooks(allBooks);

    checkUrlBook();
  } catch (err) {
    console.error(err);
    showToast('Gagal memuat data buku', 4000);
  }
}

init();

// ── QR Code Loan Request Modal ────────────────────────────────
const requestLoanModal = document.getElementById('request-loan-modal');
const requestLoanFormContainer = document.getElementById('request-loan-form-container');
const requestLoanQrContainer = document.getElementById('request-loan-qr-container');
const qrcodeBox = document.getElementById('qrcode-box');

window.openRequestLoanModal = function() {
  const book = window._currentBorrowBook;
  if (!book) return;
  document.getElementById('request-loan-form').reset();
  
  // Populate Kode Fisik if available
  const kodeGroup = document.getElementById('req-loan-kode-group');
  const kodeSelect = document.getElementById('req-loan-kode');
  const allCodes = book.kode_buku || [];
  const usedCodes = LoanDB.getUsedCodes(book.id);
  const availableCodes = allCodes.filter(k => !usedCodes.has(k));
  
  if (availableCodes.length > 0) {
    kodeGroup.style.display = 'block';
    kodeSelect.innerHTML = '<option value="">Pilih kode buku yang Anda pegang</option>';
    availableCodes.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      kodeSelect.appendChild(opt);
    });
    kodeSelect.required = true;
  } else {
    kodeGroup.style.display = 'none';
    kodeSelect.required = false;
  }

  requestLoanFormContainer.classList.remove('hidden');
  requestLoanQrContainer.classList.add('hidden');
  qrcodeBox.innerHTML = ''; // Clear previous QR
  requestLoanModal.classList.remove('hidden');
};

window.closeRequestLoanModal = function() {
  requestLoanModal.classList.add('hidden');
};

window.submitRequestLoan = function(e) {
  e.preventDefault();
  
  const nama = document.getElementById('req-loan-nama').value.trim();
  const dusun = document.getElementById('req-loan-dusun').value.trim();
  const hp = document.getElementById('req-loan-hp').value.trim();
  const kodeSelect = document.getElementById('req-loan-kode');
  const kodeFisik = (kodeSelect && !kodeSelect.disabled && kodeSelect.offsetParent !== null) ? kodeSelect.value : '';
  
  if (!nama || !dusun || !hp || !window._currentBorrowBook) {
    showToast('Harap isi semua data dengan benar.');
    return;
  }

  // Create JSON payload
  const payload = {
    bId: window._currentBorrowBook.id,
    bTitle: window._currentBorrowBook.judul,
    n: nama,
    d: dusun,
    hp: hp
  };

  if (kodeFisik) {
    payload.k = kodeFisik;
  }

  const qrDataString = JSON.stringify(payload);

  // Generate QR Code
  qrcodeBox.innerHTML = '';
  new QRCode(qrcodeBox, {
    text: qrDataString,
    width: 200,
    height: 200,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.M
  });

  // Switch view
  requestLoanFormContainer.classList.add('hidden');
  requestLoanQrContainer.classList.remove('hidden');
};

