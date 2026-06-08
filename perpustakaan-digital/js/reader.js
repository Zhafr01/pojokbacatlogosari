/* =============================================================
   reader.js — Perpustakaan Digital
   PDF viewer with page navigation and bookmarks
   ============================================================= */

'use strict';

// ── PDF.js Worker ─────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── URL Params ────────────────────────────────────────────────
const params   = new URLSearchParams(window.location.search);
const bookId   = params.get('id') || 'unknown';
const pdfPath  = params.get('pdf') ? decodeURIComponent(params.get('pdf')) : null;
const bookTitle= params.get('title') ? decodeURIComponent(params.get('title')) : 'Buku';

// ── DOM ───────────────────────────────────────────────────────
const canvas          = document.getElementById('pdf-canvas');
const ctx             = canvas.getContext('2d');
const pdfLoading      = document.getElementById('pdf-loading');
const pdfError        = document.getElementById('pdf-error');
const pdfErrorMsg     = document.getElementById('pdf-error-msg');
const readerTitle     = document.getElementById('reader-title');
const prevBtn         = document.getElementById('prev-btn');
const nextBtn         = document.getElementById('next-btn');
const pageInput       = document.getElementById('page-input');
const pageTotal       = document.getElementById('page-total');
const bookmarkBtn     = document.getElementById('bookmark-btn');
const bookmarksPanel  = document.getElementById('bookmarks-panel');
const bookmarksOverlay= document.getElementById('bookmarks-overlay');
const bookmarksList   = document.getElementById('bookmarks-list');
const closeBookmarks  = document.getElementById('close-bookmarks');
const backBtn         = document.getElementById('back-btn');
const toastEl         = document.getElementById('toast');

// ── State ─────────────────────────────────────────────────────
let pdfDoc      = null;
let currentPage = 1;
let totalPages  = 0;
let isRendering = false;
let renderTask  = null;

// ── LocalStorage Keys ─────────────────────────────────────────
const LS_LAST_PAGE  = `plib_page_${bookId}`;
const LS_BOOKMARKS  = `plib_bm_${bookId}`;

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2500) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

// ── Back Button ───────────────────────────────────────────────
backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// ── Set page title ─────────────────────────────────────────────
document.title = `${bookTitle} — Perpustakaan Digital`;
readerTitle.textContent = bookTitle;

// ── Render a PDF Page ─────────────────────────────────────────
async function renderPage(num) {
  if (isRendering && renderTask) {
    renderTask.cancel();
  }
  isRendering = true;

  try {
    const page    = await pdfDoc.getPage(num);
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;

    // Scale to fit container width
    const viewport    = page.getViewport({ scale: 1 });
    const scale       = containerWidth / viewport.width;
    const scaledView  = page.getViewport({ scale });

    canvas.width  = scaledView.width;
    canvas.height = scaledView.height;

    renderTask = page.render({
      canvasContext: ctx,
      viewport: scaledView,
    });

    await renderTask.promise;

    // Scroll to top on page change
    canvas.parentElement.scrollTo({ top: 0, behavior: 'smooth' });

    // Update UI
    currentPage       = num;
    pageInput.value   = num;
    pageTotal.textContent = `/ ${totalPages}`;
    prevBtn.disabled  = num <= 1;
    nextBtn.disabled  = num >= totalPages;

    // Save last page
    localStorage.setItem(LS_LAST_PAGE, num);

    // Update bookmark button
    updateBookmarkBtnState();

    isRendering = false;
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error('Gagal render halaman:', err);
    }
    isRendering = false;
  }
}

// ── Load PDF ──────────────────────────────────────────────────
async function loadPDF() {
  if (!pdfPath) {
    showError('URL buku tidak valid.');
    return;
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      url: pdfPath,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    });

    pdfDoc = await loadingTask.promise;
    totalPages = pdfDoc.numPages;

    pdfLoading.style.display = 'none';
    canvas.style.display = 'block';

    // Resume last page
    const savedPage = parseInt(localStorage.getItem(LS_LAST_PAGE), 10);
    const startPage = (savedPage && savedPage > 0 && savedPage <= totalPages)
      ? savedPage : 1;

    if (savedPage && savedPage > 1) {
      showToast(`📖 Lanjut dari halaman ${savedPage}`);
    }

    await renderPage(startPage);
  } catch (err) {
    console.error('Gagal buka PDF:', err);
    showError(
      navigator.onLine
        ? 'File PDF tidak ditemukan atau rusak.'
        : 'Kamu sedang offline. Buka buku ini dulu saat ada internet.'
    );
  }
}

function showError(msg) {
  pdfLoading.style.display = 'none';
  pdfErrorMsg.textContent  = msg;
  pdfError.classList.remove('hidden');
}

// ── Page Navigation ───────────────────────────────────────────
prevBtn.addEventListener('click', () => {
  if (currentPage > 1) renderPage(currentPage - 1);
});

nextBtn.addEventListener('click', () => {
  if (currentPage < totalPages) renderPage(currentPage + 1);
});

pageInput.addEventListener('change', () => {
  const num = parseInt(pageInput.value, 10);
  if (num >= 1 && num <= totalPages) {
    renderPage(num);
  } else {
    pageInput.value = currentPage;
  }
});

pageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') pageInput.blur();
});

// ── Swipe Gesture (left/right) ───────────────────────────────
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  // Only treat as swipe if horizontal movement is dominant
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    if (dx < 0 && currentPage < totalPages) renderPage(currentPage + 1); // Swipe left → next
    if (dx > 0 && currentPage > 1)          renderPage(currentPage - 1); // Swipe right → prev
  }
}, { passive: true });

// ── Bookmarks ─────────────────────────────────────────────────
function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(LS_BOOKMARKS) || '[]');
  } catch { return []; }
}

function saveBookmarks(bms) {
  localStorage.setItem(LS_BOOKMARKS, JSON.stringify(bms));
}

function isPageBookmarked(page) {
  return getBookmarks().some(b => b.page === page);
}

function updateBookmarkBtnState() {
  const bookmarked = isPageBookmarked(currentPage);
  bookmarkBtn.style.opacity  = bookmarked ? '1' : '0.5';
  bookmarkBtn.title = bookmarked
    ? `Hapus penanda halaman ${currentPage}`
    : `Tandai halaman ${currentPage}`;
}

bookmarkBtn.addEventListener('click', () => {
  const bms  = getBookmarks();
  const idx  = bms.findIndex(b => b.page === currentPage);

  if (idx >= 0) {
    // Remove bookmark
    bms.splice(idx, 1);
    saveBookmarks(bms);
    showToast(`🗑 Penanda halaman ${currentPage} dihapus`);
  } else {
    // Add bookmark
    bms.push({
      page: currentPage,
      date: new Date().toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }),
    });
    bms.sort((a, b) => a.page - b.page);
    saveBookmarks(bms);
    showToast(`🔖 Halaman ${currentPage} ditandai!`);
    bookmarkBtn.classList.add('bookmarked');
    setTimeout(() => bookmarkBtn.classList.remove('bookmarked'), 400);
  }

  updateBookmarkBtnState();
  renderBookmarksList();
});

function renderBookmarksList() {
  const bms = getBookmarks();

  if (bms.length === 0) {
    bookmarksList.innerHTML = '<p class="bookmarks-empty">Belum ada penanda.<br>Ketuk 🔖 untuk menandai halaman ini.</p>';
    return;
  }

  bookmarksList.innerHTML = bms.map(bm => `
    <div class="bookmark-item" role="button" tabindex="0">
      <div class="bookmark-item-info" onclick="goToBookmark(${bm.page})">
        <span class="bookmark-page">Halaman ${bm.page}</span>
        <span class="bookmark-date">${bm.date}</span>
      </div>
      <button class="bookmark-delete" onclick="deleteBookmark(${bm.page})" aria-label="Hapus penanda halaman ${bm.page}">🗑</button>
    </div>
  `).join('');
}

window.goToBookmark = (page) => {
  renderPage(page);
  closeBookmarksPanel();
};

window.deleteBookmark = (page) => {
  const bms = getBookmarks().filter(b => b.page !== page);
  saveBookmarks(bms);
  renderBookmarksList();
  updateBookmarkBtnState();
  showToast(`🗑 Penanda halaman ${page} dihapus`);
};

// Long-press on bookmark button → open bookmarks panel
let longPressTimer;
bookmarkBtn.addEventListener('touchstart', () => {
  longPressTimer = setTimeout(() => openBookmarksPanel(), 500);
}, { passive: true });
bookmarkBtn.addEventListener('touchend', () => clearTimeout(longPressTimer), { passive: true });
bookmarkBtn.addEventListener('contextmenu', e => {
  e.preventDefault();
  openBookmarksPanel();
});

function openBookmarksPanel() {
  renderBookmarksList();
  bookmarksPanel.classList.remove('hidden');
  bookmarksOverlay.classList.remove('hidden');
}

function closeBookmarksPanel() {
  bookmarksPanel.classList.add('hidden');
  bookmarksOverlay.classList.add('hidden');
}

closeBookmarks.addEventListener('click', closeBookmarksPanel);
bookmarksOverlay.addEventListener('click', closeBookmarksPanel);

// ── Keyboard Navigation ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevBtn.click();
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown')  nextBtn.click();
  if (e.key === 'Escape') closeBookmarksPanel();
});

// ── Init ──────────────────────────────────────────────────────
loadPDF();
