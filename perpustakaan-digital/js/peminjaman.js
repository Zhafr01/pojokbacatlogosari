/* =============================================================
   peminjaman.js — Pojok Baca Tlogosari — User Loan Status
   ============================================================= */
'use strict';

const loanSearchInput  = document.getElementById('loan-search');
const resultsSection   = document.getElementById('results-section');
const resultsTitle     = document.getElementById('results-title');
const resultsCount     = document.getElementById('results-count');
const loanList         = document.getElementById('loan-list');
const emptySearch      = document.getElementById('empty-search');

const STATUS_CONFIG = {
  menunggu:     { label: 'Menunggu Konfirmasi', cls: 'status-pending' },
  dipinjam:     { label: 'Sedang Dipinjam',     cls: 'status-active' },
  dikembalikan: { label: 'Sudah Dikembalikan',  cls: 'status-returned' },
  ditolak:      { label: 'Ditolak',             cls: 'status-rejected' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(loan) {
  if (loan.status !== 'dipinjam') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const returnDate = new Date(loan.tanggalKembali + 'T00:00:00');
  return today > returnDate;
}

function buildLoanCard(loan) {
  const sc = STATUS_CONFIG[loan.status] || STATUS_CONFIG.menunggu;
  const overdue = isOverdue(loan);

  const card = document.createElement('div');
  card.className = 'loan-card' + (overdue ? ' loan-overdue' : '');

  card.innerHTML = `
    <div class="loan-card-top">
      <div class="loan-book-title">${loan.bookTitle || loan.bookId}</div>
      <span class="loan-status ${sc.cls}">${sc.label}</span>
    </div>
    <div class="loan-card-details">
      <div class="loan-detail-item">
        <span class="ldi-label">Peminjam</span>
        <span class="ldi-value">${loan.nama}</span>
      </div>
      <div class="loan-detail-item">
        <span class="ldi-label">Dusun</span>
        <span class="ldi-value">${loan.dusun}</span>
      </div>
      <div class="loan-detail-item">
        <span class="ldi-label">No. HP</span>
        <span class="ldi-value">${loan.hp}</span>
      </div>
      <div class="loan-detail-item">
        <span class="ldi-label">Tanggal Pinjam</span>
        <span class="ldi-value">${formatDate(loan.tanggalPinjam)}</span>
      </div>
      <div class="loan-detail-item">
        <span class="ldi-label">Batas Kembali</span>
        <span class="ldi-value ${overdue ? 'overdue-text' : ''}">${formatDate(loan.tanggalKembali)}${overdue ? ' Terlambat!' : ''}</span>
      </div>
      ${loan.catatan ? `<div class="loan-detail-item loan-note"><span class="ldi-label">Catatan</span><span class="ldi-value">${loan.catatan}</span></div>` : ''}
    </div>
  `;
  return card;
}

window.searchLoans = function () {
  const query = loanSearchInput.value.trim();
  if (!query) {
    resultsSection.classList.add('hidden');
    emptySearch.classList.add('hidden');
    return;
  }

  const loans = LoanDB.searchLoans(query);

  if (!loans.length) {
    resultsSection.classList.add('hidden');
    emptySearch.classList.remove('hidden');
    return;
  }

  emptySearch.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  resultsTitle.textContent = `Hasil untuk "${query}"`;
  resultsCount.textContent = `${loans.length} peminjaman`;

  loanList.innerHTML = '';
  loans.forEach(loan => loanList.appendChild(buildLoanCard(loan)));
};

// Search on Enter
loanSearchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') searchLoans();
});

// Auto-search if query from URL
const urlParams = new URLSearchParams(window.location.search);
const queryParam = urlParams.get('q');
if (queryParam) {
  loanSearchInput.value = queryParam;
  searchLoans();
}
