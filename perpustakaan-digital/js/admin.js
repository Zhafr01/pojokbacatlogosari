/* =============================================================
   admin.js — Pojok Baca Tlogosari — Admin Dashboard
   ============================================================= */
'use strict';

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
  menunggu:     { label: 'Menunggu', emoji: '⏳', cls: 'status-pending' },
  dipinjam:     { label: 'Dipinjam', emoji: '📖', cls: 'status-active' },
  dikembalikan: { label: 'Dikembalikan', emoji: '✅', cls: 'status-returned' },
  ditolak:      { label: 'Ditolak', emoji: '❌', cls: 'status-rejected' },
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
          ✅ Setujui
        </button>
        <button class="action-btn action-reject" onclick="confirmAction('${loan.id}','ditolak','Tolak peminjaman ini?')">
          ❌ Tolak
        </button>`;
    } else if (loan.status === 'dipinjam') {
      actionsHTML = `
        <button class="action-btn action-return" onclick="confirmAction('${loan.id}','dikembalikan','Tandai buku sudah dikembalikan?')">
          📦 Dikembalikan
        </button>`;
    }

    actionsHTML += `
      <button class="action-btn action-delete" onclick="confirmAction('${loan.id}','DELETE','Hapus data peminjaman ini? Aksi ini tidak bisa dibatalkan.')">
        🗑️ Hapus
      </button>`;

    card.innerHTML = `
      <div class="admin-card-top">
        <div>
          <div class="admin-book-title">${loan.bookTitle || loan.bookId}</div>
          <div class="admin-borrower">${loan.nama} — ${loan.dusun}</div>
          <div class="admin-phone">📱 ${loan.hp}</div>
        </div>
        <span class="loan-status ${sc.cls}">${sc.emoji} ${sc.label}</span>
      </div>
      <div class="admin-card-dates">
        <span>📅 Pinjam: ${formatDate(loan.tanggalPinjam)}</span>
        <span>📅 Kembali: <span class="${overdue ? 'overdue-text' : ''}">${formatDate(loan.tanggalKembali)}${overdue ? ' ⚠️' : ''}</span></span>
      </div>
      ${loan.catatan ? `<div class="admin-card-note">💬 ${loan.catatan}</div>` : ''}
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
  confirmTitle.textContent = action === 'DELETE' ? '🗑️ Hapus Data' : '📋 Konfirmasi';
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
    showToast('🗑️ Data peminjaman dihapus');
  } else {
    LoanDB.updateStatus(loanId, action);
    const statusLabel = STATUS_CONFIG[action]?.label || action;
    showToast(`✅ Status diubah menjadi "${statusLabel}"`);
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

// ── Init ──────────────────────────────────────────────────────
checkSession();
