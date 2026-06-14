/* =============================================================
   admin.js — Pojok Baca Tlogosari — Admin Dashboard
   ============================================================= */
'use strict';

// ── Constants & Auth ──────────────────────────────────────────
const ADMIN_PASSWORD = 'tlogosarijaya2026';
const SESSION_KEY    = 'pojokbaca_admin_session';

// ── DOM refs ──────────────────────────────────────────────────
const loginScreen     = document.getElementById('login-screen');
const adminDashboard  = document.getElementById('admin-dashboard');
const loginError      = document.getElementById('login-error');
const adminLoans      = document.getElementById('admin-loans');
const emptyAdmin      = document.getElementById('empty-admin');
const toastEl         = document.getElementById('toast');
const confirmModal    = document.getElementById('confirm-modal');
const confirmTitle    = document.getElementById('confirm-title');
const confirmMessage  = document.getElementById('confirm-message');
const btnConfirm      = document.getElementById('btn-confirm');

let currentFilter = '';
let _toast;

// ── Status Config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  menunggu:     { label: 'Menunggu', cls: 'status-pending' },
  dipinjam:     { label: 'Dipinjam', cls: 'status-active' },
  dikembalikan: { label: 'Dikembalikan', cls: 'status-returned' },
  ditolak:      { label: 'Ditolak', cls: 'status-rejected' },
};

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, ms = 2600) {
  clearTimeout(_toast);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  _toast = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ── Utility ───────────────────────────────────────────────────
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

// ── Auth ──────────────────────────────────────────────────────
function checkSession() {
  const session = sessionStorage.getItem(SESSION_KEY);
  if (session === 'true') {
    showDashboard();
  }
}

window.attemptLogin = function (e) {
  e.preventDefault();
  const pw = document.getElementById('admin-password').value;
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    loginError.classList.add('hidden');
    showDashboard();
  } else {
    loginError.classList.remove('hidden');
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-password').focus();
  }
};

window.togglePassword = function () {
  const input = document.getElementById('admin-password');
  input.type = input.type === 'password' ? 'text' : 'password';
};

window.logout = function () {
  sessionStorage.removeItem(SESSION_KEY);
  loginScreen.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
};

function showDashboard() {
  loginScreen.classList.add('hidden');
  adminDashboard.classList.remove('hidden');
  refreshDashboard();
}

// ── Dashboard ─────────────────────────────────────────────────
function refreshDashboard() {
  const stats = LoanDB.getStats();
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-menunggu').textContent = stats.menunggu;
  document.getElementById('stat-dipinjam').textContent = stats.dipinjam;
  document.getElementById('stat-dikembalikan').textContent = stats.dikembalikan;

  renderLoans();
}

function renderLoans() {
  const loans = LoanDB.getByStatus(currentFilter);
  adminLoans.innerHTML = '';

  if (!loans.length) {
    emptyAdmin.classList.remove('hidden');
    return;
  }
  emptyAdmin.classList.add('hidden');

  loans.forEach(loan => {
    const sc = STATUS_CONFIG[loan.status] || STATUS_CONFIG.menunggu;
    const overdue = isOverdue(loan);

    const card = document.createElement('div');
    card.className = 'admin-loan-card' + (overdue ? ' loan-overdue' : '');

    let actionsHTML = '';

    if (loan.status === 'menunggu') {
      actionsHTML = `
        <button class="action-btn action-approve" onclick="confirmAction('${loan.id}','dipinjam','Setujui peminjaman ini?')">
          Setujui
        </button>
        <button class="action-btn action-reject" onclick="confirmAction('${loan.id}','ditolak','Tolak peminjaman ini?')">
          Tolak
        </button>`;
    } else if (loan.status === 'dipinjam') {
      actionsHTML = `
        <button class="action-btn action-return" onclick="confirmAction('${loan.id}','dikembalikan','Tandai buku sudah dikembalikan?')">
          Dikembalikan
        </button>`;
    }

    actionsHTML += `
      <button class="action-btn action-delete" onclick="confirmAction('${loan.id}','DELETE','Hapus data peminjaman ini? Aksi ini tidak bisa dibatalkan.')">
        Hapus
      </button>`;

    card.innerHTML = `
      <div class="admin-card-top">
        <div>
          <div class="admin-book-title">${loan.bookTitle || loan.bookId}</div>
          <div class="admin-borrower">${loan.nama} — ${loan.dusun}</div>
          <div class="admin-phone">${loan.hp}</div>
        </div>
        <span class="loan-status ${sc.cls}">${sc.label}</span>
      </div>
      <div class="admin-card-dates">
        <span>Pinjam: ${formatDate(loan.tanggalPinjam)}</span>
        <span>Kembali: <span class="${overdue ? 'overdue-text' : ''}">${formatDate(loan.tanggalKembali)}${overdue ? ' ⚠️ Terlambat!' : ''}</span></span>
      </div>
      ${loan.catatan ? `<div class="admin-card-note">${loan.catatan}</div>` : ''}
      <div class="admin-card-actions">${actionsHTML}</div>
    `;
    adminLoans.appendChild(card);
  });
}

// ── Filter ────────────────────────────────────────────────────
window.filterAdmin = function (status) {
  currentFilter = status;
  document.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });
  renderLoans();
};

// ── Confirm Modal ─────────────────────────────────────────────
let _pendingAction = null;

window.confirmAction = function (loanId, action, message) {
  _pendingAction = { loanId, action };
  confirmTitle.textContent = action === 'DELETE' ? 'Hapus Data' : 'Konfirmasi';
  confirmMessage.textContent = message;
  btnConfirm.textContent = action === 'DELETE' ? 'Ya, Hapus' : 'Ya, Lanjutkan';
  btnConfirm.className = 'btn-confirm' + (action === 'DELETE' ? ' btn-danger' : '');
  confirmModal.classList.remove('hidden');
};

window.closeConfirmModal = function () {
  confirmModal.classList.add('hidden');
  _pendingAction = null;
};

btnConfirm.addEventListener('click', () => {
  if (!_pendingAction) return;

  const { loanId, action } = _pendingAction;

  if (action === 'DELETE') {
    LoanDB.deleteLoan(loanId);
    showToast('Data peminjaman dihapus');
  } else {
    LoanDB.updateStatus(loanId, action);
    const statusLabel = STATUS_CONFIG[action]?.label || action;
    showToast(`Status diubah menjadi "${statusLabel}"`);
  }

  closeConfirmModal();
  refreshDashboard();
});

// Close modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !confirmModal.classList.contains('hidden')) {
    closeConfirmModal();
  }
});

// ── Tab switching ─────────────────────────────────────────────
let allBooksData = [];

window.switchAdminTab = function (tab) {
  const panels = ['peminjaman', 'buku'];
  panels.forEach(p => {
    document.getElementById(`panel-${p}`)?.classList.toggle('hidden', p !== tab);
    document.getElementById(`tab-${p}`)?.classList.toggle('active', p === tab);
  });
  if (tab === 'buku' && allBooksData.length === 0) {
    loadBooks();
  }
};

// ── Load books untuk Kelola Buku ──────────────────────────────
async function loadBooks() {
  try {
    const res = await fetch('./data/books.json');
    if (!res.ok) throw new Error('gagal');
    const raw = await res.json();
    allBooksData = BookDB.mergeWithOverrides(raw);
    renderKelolaBuku(allBooksData, raw);
  } catch (err) {
    document.getElementById('empty-kelola')?.classList.remove('hidden');
  }
}

// ── Render Kelola Buku ────────────────────────────────────────
function renderKelolaBuku(books, rawBooks) {
  const grid = document.getElementById('kelola-grid');
  if (!grid) return;
  grid.innerHTML = '';

  books.forEach((book) => {
    const card = document.createElement('div');
    card.className = 'kelola-card';
    card.id = `kelola-card-${book.id}`;

    const rawBook = rawBooks.find(b => b.id === book.id) || book;
    const isOverridden = JSON.stringify({
      stok: book.stok, online: book.online, offline: book.offline
    }) !== JSON.stringify({
      stok: rawBook.stok, online: rawBook.online, offline: rawBook.offline
    });

    card.innerHTML = `
      <div class="kelola-card-top">
        <div class="kelola-cover-mini" style="background:linear-gradient(135deg,${(book.cover_colors||['#6366F1','#4F46E5'])[0]},${(book.cover_colors||['#6366F1','#4F46E5'])[1]})">
          <span>${book.kategori === 'Novel' ? '📖' : book.kategori === 'Sastra' ? '🪶' : book.kategori === 'Pendidikan' ? '🎓' : '📚'}</span>
        </div>
        <div class="kelola-book-info">
          <div class="kelola-book-title">${book.judul}</div>
          <div class="kelola-book-author">${book.penulis}</div>
          <div class="kelola-book-cat">${book.kategori || 'Umum'} · ${book.tahun || '—'}</div>
          ${isOverridden ? '<span class="kelola-overridden-badge">✏️ Diubah</span>' : ''}
        </div>
      </div>

      <div class="kelola-controls">
        <div class="kelola-control-row">
          <span class="kelola-label">📦 Stok Fisik</span>
          <div class="kelola-stok-wrap">
            <button class="stok-btn stok-minus" onclick="changeStok('${book.id}', -1)" aria-label="Kurangi stok">−</button>
            <input type="number" class="stok-input" id="stok-${book.id}"
              value="${book.stok}" min="0" max="99"
              onchange="saveBookField('${book.id}', 'stok', parseInt(this.value) || 0)">
            <button class="stok-btn stok-plus" onclick="changeStok('${book.id}', 1)" aria-label="Tambah stok">+</button>
          </div>
        </div>

        <div class="kelola-toggles">
          <label class="kelola-toggle-wrap" for="toggle-offline-${book.id}">
            <span class="toggle-label-text">📚 Buku Fisik</span>
            <div class="toggle-switch-wrap">
              <input type="checkbox" id="toggle-offline-${book.id}" class="toggle-input"
                ${book.offline ? 'checked' : ''}
                onchange="saveBookField('${book.id}', 'offline', this.checked)">
              <span class="toggle-slider"></span>
            </div>
          </label>
          <label class="kelola-toggle-wrap" for="toggle-online-${book.id}">
            <span class="toggle-label-text">💻 E-Book</span>
            <div class="toggle-switch-wrap">
              <input type="checkbox" id="toggle-online-${book.id}" class="toggle-input"
                ${book.online ? 'checked' : ''}
                onchange="saveBookField('${book.id}', 'online', this.checked)">
              <span class="toggle-slider"></span>
            </div>
          </label>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ── Admin book controls ───────────────────────────────────────
window.changeStok = function (bookId, delta) {
  const input = document.getElementById(`stok-${bookId}`);
  if (!input) return;
  const newVal = Math.max(0, (parseInt(input.value) || 0) + delta);
  input.value = newVal;
  saveBookField(bookId, 'stok', newVal);
};

window.saveBookField = function (bookId, field, value) {
  const book = allBooksData.find(b => b.id === bookId);
  if (!book) return;

  const updates = { [field]: value };

  // Automasi sinkronisasi Stok & Toggle "Buku Fisik" (offline)
  if (field === 'stok') {
    if (value === 0 && book.offline) {
      updates.offline = false;
      const toggle = document.getElementById(`toggle-offline-${bookId}`);
      if (toggle) toggle.checked = false;
    } else if (value > 0 && !book.offline) {
      updates.offline = true;
      const toggle = document.getElementById(`toggle-offline-${bookId}`);
      if (toggle) toggle.checked = true;
    }
  } else if (field === 'offline') {
    if (value === true && book.stok === 0) {
      updates.stok = 1;
      const input = document.getElementById(`stok-${bookId}`);
      if (input) input.value = 1;
    } else if (value === false && book.stok > 0) {
      updates.stok = 0;
      const input = document.getElementById(`stok-${bookId}`);
      if (input) input.value = 0;
    }
  }

  // Simpan perubahan
  Object.assign(book, updates);
  BookDB.updateBook(bookId, updates);

  // Tampilkan badge "Diubah" jika belum ada
  const cardInfo = document.querySelector(`#kelola-card-${bookId} .kelola-book-info`);
  if (cardInfo && !cardInfo.querySelector('.kelola-overridden-badge')) {
    cardInfo.insertAdjacentHTML('beforeend', '<span class="kelola-overridden-badge">✏️ Diubah</span>');
  }

  showToast(`${field === 'stok' ? 'Stok' : field === 'online' ? 'E-Book' : 'Buku Fisik'} diperbarui`, 1800);
};

window.resetAllOverrides = function () {
  if (!confirm('Reset semua perubahan ke data awal buku.json?')) return;
  BookDB.resetAll();
  allBooksData = [];
  loadBooks();
  showToast('Semua perubahan direset', 2600);
};

// ── Init ──────────────────────────────────────────────────────
checkSession();
