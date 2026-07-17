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
      ${loan.kodeFisik ? `<div class="admin-card-kode"><span class="kode-label">📦 Kode Fisik:</span> <span class="kode-value">${loan.kodeFisik}</span></div>` : ''}
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
  if (e.key === 'Escape') {
    if (!confirmModal.classList.contains('hidden')) {
      closeConfirmModal();
    }
    const addLoanModal = document.getElementById('add-loan-modal');
    if (addLoanModal && !addLoanModal.classList.contains('hidden')) {
      closeAddLoanModal();
    }
  }
});

// ── Add Loan Modal ────────────────────────────────────────────
window.openAddLoanModal = async function () {
  const modal = document.getElementById('add-loan-modal');
  if (!modal) return;
  
  if (allBooksData.length === 0) {
    await loadBooks(); // Ensure books are loaded
  }
  
  const selectWrap = document.getElementById('add-loan-book-wrap');
  const selectVal = document.getElementById('add-loan-book-val');
  const dropdown = document.getElementById('add-loan-book-dropdown');
  const hiddenInput = document.getElementById('add-loan-book');
  
  if (dropdown && selectWrap && selectVal && hiddenInput) {
    dropdown.innerHTML = '';
    hiddenInput.value = '';
    selectVal.textContent = '-- Pilih Buku --';
    
    // Add Search Input
    const searchWrap = document.createElement('div');
    searchWrap.className = 'cfs-search';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'cfs-search-input';
    searchInput.placeholder = 'Cari judul buku...';
    searchWrap.appendChild(searchInput);
    dropdown.appendChild(searchWrap);
    
    // Add List Container
    const listContainer = document.createElement('div');
    listContainer.className = 'cfs-list';
    dropdown.appendChild(listContainer);
    
    // Only show books that are physical (offline) and have stock > 0
    const availableBooks = [];
    allBooksData.filter(b => b.offline && b.stok > 0).forEach(book => {
      const activeLoans = LoanDB.getActiveLoansForBook(book.id);
      const available = Math.max(0, book.stok - activeLoans);
      if (available > 0) {
        availableBooks.push({ book, available });
      }
    });

    if (availableBooks.length === 0) {
      const item = document.createElement('div');
      item.className = 'cfs-item';
      item.textContent = 'Tidak ada buku fisik tersedia';
      listContainer.appendChild(item);
      searchWrap.style.display = 'none'; // Hide search if no books
    } else {
      const renderItems = (query = '') => {
        listContainer.innerHTML = '';
        const lowerQuery = query.toLowerCase();
        let matchCount = 0;
        
        availableBooks.forEach(({ book, available }) => {
          if (!book.judul.toLowerCase().includes(lowerQuery)) return;
          matchCount++;
          
          const item = document.createElement('div');
          item.className = 'cfs-item';
          if (hiddenInput.value === book.id) item.classList.add('selected');
          
          item.textContent = `${book.judul} (Tersedia: ${available})`;
          item.onclick = (e) => {
            e.stopPropagation();
            hiddenInput.value = book.id;
            selectVal.textContent = item.textContent;
            selectWrap.classList.remove('open');
            listContainer.querySelectorAll('.cfs-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            searchInput.value = ''; // Reset search on select
            renderItems(); // Reset list
            // Show kode buku options for selected book
            renderKodeBukuOptions(book);
          };
          listContainer.appendChild(item);
        });
        
        if (matchCount === 0) {
          const item = document.createElement('div');
          item.className = 'cfs-item';
          item.textContent = 'Buku tidak ditemukan';
          item.style.pointerEvents = 'none';
          item.style.opacity = '0.6';
          listContainer.appendChild(item);
        }
      };
      
      renderItems();
      
      searchInput.addEventListener('input', (e) => {
        renderItems(e.target.value);
      });
      searchInput.addEventListener('click', (e) => e.stopPropagation());
    }

    // Toggle dropdown
    selectWrap.onclick = (e) => {
      e.stopPropagation();
      const isOpen = selectWrap.classList.contains('open');
      selectWrap.classList.toggle('open');
      if (!isOpen && availableBooks.length > 0) {
        setTimeout(() => searchInput.focus(), 50);
      }
    };
  }
  
  // ── Helper: render kode buku options after book is chosen ───
  window.renderKodeBukuOptions = function(book) {
    const wrap = document.getElementById('add-loan-kode-wrap');
    const select = document.getElementById('add-loan-kode');
    const kodeGroup = document.getElementById('add-loan-kode-group');
    if (!wrap || !select || !kodeGroup) return;

    const usedCodes = LoanDB.getUsedCodes(book.id);
    const allCodes = book.kode_buku || [];
    const availableCodes = allCodes.filter(k => !usedCodes.has(k));

    // Show the kode group
    kodeGroup.classList.remove('hidden');
    select.innerHTML = '';

    if (availableCodes.length === 0) {
      // Fallback: allow manual input
      wrap.innerHTML = `<input type="text" id="add-loan-kode" placeholder="Masukkan kode fisik buku" autocomplete="off" style="width:100%;">`;
    } else {
      // Build datalist for autocomplete + dropdown
      wrap.innerHTML = `
        <input type="text" id="add-loan-kode" list="kode-buku-list"
          placeholder="Pilih atau ketik kode..."
          autocomplete="off" style="width:100%;">
        <datalist id="kode-buku-list">
          ${availableCodes.map(k => `<option value="${k}">${k}</option>`).join('')}
        </datalist>
        <div class="kode-chips">
          ${availableCodes.map(k =>
            `<button type="button" class="kode-chip" onclick="selectKodeChip('${k}')">${k}</button>`
          ).join('')}
        </div>
      `;
    }
  }

  window.selectKodeChip = function(kode) {
    const input = document.getElementById('add-loan-kode');
    if (input) {
      input.value = kode;
      // Highlight active chip
      document.querySelectorAll('.kode-chip').forEach(c => {
        c.classList.toggle('active', c.textContent === kode);
      });
    }
  };

  modal.classList.remove('hidden');
};

// Close dropdown on outside click
document.addEventListener('click', e => {
  const selectWrap = document.getElementById('add-loan-book-wrap');
  if (selectWrap && selectWrap.classList.contains('open') && !selectWrap.contains(e.target)) {
    selectWrap.classList.remove('open');
  }
});

window.closeAddLoanModal = function () {
  const modal = document.getElementById('add-loan-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('add-loan-form').reset();
  }
};

window.submitAddLoan = function (e) {
  e.preventDefault();
  
  const bookId   = document.getElementById('add-loan-book').value;
  const nama     = document.getElementById('add-loan-nama').value.trim();
  const dusun    = document.getElementById('add-loan-dusun').value.trim();
  const hp       = document.getElementById('add-loan-hp').value.trim();
  const kodeInput = document.getElementById('add-loan-kode');
  const kodeFisik = kodeInput ? kodeInput.value.trim() : '';
  
  if (!bookId || !nama || !dusun || !hp) {
    showToast('Lengkapi semua field', 3000);
    return;
  }
  
  if (!kodeFisik) {
    showToast('Kode buku wajib diisi', 3000);
    return;
  }
  
  const book = allBooksData.find(b => b.id === bookId);
  if (!book) return;
  
  // Validate kode is not already borrowed
  const usedCodes = LoanDB.getUsedCodes(book.id);
  if (usedCodes.has(kodeFisik)) {
    showToast(`Kode "${kodeFisik}" sedang dipinjam orang lain`, 3000);
    return;
  }
  
  if (LoanDB.hasActiveLoan(book.id, hp)) {
    showToast('Peminjam sudah meminjam buku ini', 3000);
    return;
  }
  
  const activeLoans = LoanDB.getActiveLoansForBook(book.id);
  if (activeLoans >= book.stok) {
    showToast('Stok buku habis', 3000);
    return;
  }
  
  // Create loan with kodeFisik, then immediately approve (admin-created)
  const newLoan = LoanDB.createLoan({ bookId: book.id, bookTitle: book.judul, nama, dusun, hp, kodeFisik });
  LoanDB.updateStatus(newLoan.id, 'dipinjam', '', kodeFisik);
  
  closeAddLoanModal();
  refreshDashboard();
  showToast(`Peminjaman “${kodeFisik}” berhasil ditambahkan!`, 3500);
};

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
  if (allBooksData.length > 0) return; // Already loaded
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
        <div class="kelola-cover-mini" style="background:linear-gradient(135deg,${(book.cover_colors||['#6366F1','#4F46E5'])[0]},${(book.cover_colors||['#6366F1','#4F46E5'])[1]});${book.cover ? `background-image:url(${book.cover});background-size:cover;background-position:center;` : ''}">
          ${!book.cover ? `<span>${book.kategori === 'Novel' ? '📖' : book.kategori === 'Sastra' ? '🪶' : book.kategori === 'Pendidikan' ? '🎓' : '📚'}</span>` : ''}
          <label class="kelola-cover-upload" title="Ubah Cover" for="cover-upload-${book.id}">
            📷
            <input type="file" id="cover-upload-${book.id}" accept="image/*" style="display:none;" onchange="uploadCover('${book.id}', this)">
          </label>
        </div>
        <div class="kelola-book-info">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 8px;">
            <div class="kelola-book-title">${book.judul}</div>
            <button onclick="openBookFormModal('${book.id}')" style="background:transparent; border:1px solid var(--border-hi); border-radius:4px; cursor:pointer; font-size:0.9rem; padding: 2px 6px;" title="Edit Identitas">✏️</button>
          </div>
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

window.uploadCover = function(bookId, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // Resize with canvas to prevent massive base64 strings in localStorage
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 300;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      saveBookField(bookId, 'cover', dataUrl);
      showToast('Cover buku berhasil diperbarui');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
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

// ── Edit / Add Book Modal ──────────────────────────────────────
window.openBookFormModal = function(bookId = null) {
  const modal = document.getElementById('book-form-modal');
  if (!modal) return;
  const form = document.getElementById('book-form');
  const title = document.getElementById('book-form-title');
  form.reset();

  if (bookId) {
    title.textContent = 'Edit Identitas Buku';
    const book = allBooksData.find(b => b.id === bookId);
    if (book) {
      document.getElementById('book-form-id').value = book.id;
      document.getElementById('book-form-judul').value = book.judul || '';
      document.getElementById('book-form-penulis').value = book.penulis || '';
      document.getElementById('book-form-kategori').value = book.kategori || 'Umum';
      document.getElementById('book-form-kategori-val').textContent = book.kategori || 'Umum';
      document.querySelectorAll('#book-form-kategori-dropdown .cfs-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.val === (book.kategori || 'Umum'));
      });
      document.getElementById('book-form-tahun').value = book.tahun || '';
      document.getElementById('book-form-tempat').value = book.tempat_terbit || '';
      document.getElementById('book-form-penerbit').value = book.penerbit || '';
      document.getElementById('book-form-bahasa').value = book.bahasa || '';
      document.getElementById('book-form-halaman').value = book.halaman || '';
      document.getElementById('book-form-sinopsis').value = book.sinopsis || '';
      document.getElementById('book-form-link-baca').value = (book.link_baca && book.link_baca.length > 0) ? book.link_baca[0].url : '';
      document.getElementById('book-form-link-beli').value = (book.link_beli && book.link_beli.length > 0) ? book.link_beli[0].url : '';
      document.getElementById('book-form-kode-buku').value = (book.kode_buku || []).join(', ');
    }
  } else {
    title.textContent = 'Tambah Buku Baru';
    document.getElementById('book-form-id').value = '';
    document.getElementById('book-form-kategori').value = 'Umum';
    document.getElementById('book-form-kategori-val').textContent = 'Umum';
    document.querySelectorAll('#book-form-kategori-dropdown .cfs-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.val === 'Umum');
    });
  }

  modal.classList.remove('hidden');
};

window.closeBookFormModal = function() {
  document.getElementById('book-form-modal')?.classList.add('hidden');
};

window.submitBookForm = function(e) {
  e.preventDefault();
  const id = document.getElementById('book-form-id').value;
  
  const linkBacaUrl = document.getElementById('book-form-link-baca').value.trim();
  const linkBeliUrl = document.getElementById('book-form-link-beli').value.trim();
  const kodeStr = document.getElementById('book-form-kode-buku').value.trim();

  const data = {
    judul: document.getElementById('book-form-judul').value.trim(),
    penulis: document.getElementById('book-form-penulis').value.trim(),
    kategori: document.getElementById('book-form-kategori').value,
    tahun: parseInt(document.getElementById('book-form-tahun').value) || null,
    tempat_terbit: document.getElementById('book-form-tempat').value.trim(),
    penerbit: document.getElementById('book-form-penerbit').value.trim(),
    bahasa: document.getElementById('book-form-bahasa').value.trim(),
    halaman: parseInt(document.getElementById('book-form-halaman').value) || null,
    sinopsis: document.getElementById('book-form-sinopsis').value.trim(),
    kode_buku: kodeStr ? kodeStr.split(',').map(s => s.trim()).filter(Boolean) : []
  };

  if (linkBacaUrl) data.link_baca = [{ nama: 'Baca Online', url: linkBacaUrl }];
  else data.link_baca = [];
  
  if (linkBeliUrl) data.link_beli = [{ nama: 'Beli Buku', url: linkBeliUrl }];
  else data.link_beli = [];

  if (id) {
    BookDB.updateBook(id, data);
    showToast('Identitas buku diperbarui');
  } else {
    data.stok = 0;
    data.offline = false;
    data.online = false;
    BookDB.addBook(data);
    showToast('Buku baru berhasil ditambahkan');
  }

  closeBookFormModal();
  allBooksData = [];
  document.getElementById('kelola-grid').innerHTML = '';
  loadBooks();
};

// Close modal on Escape update
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!confirmModal.classList.contains('hidden')) {
      closeConfirmModal();
    }
    const addLoanModal = document.getElementById('add-loan-modal');
    if (addLoanModal && !addLoanModal.classList.contains('hidden')) {
      closeAddLoanModal();
    }
    const bookFormModal = document.getElementById('book-form-modal');
    if (bookFormModal && !bookFormModal.classList.contains('hidden')) {
      closeBookFormModal();
    }
    const scannerModal = document.getElementById('scanner-modal');
    if (scannerModal && !scannerModal.classList.contains('hidden')) {
      closeScannerModal();
    }
  }
});

// ── Setup Custom Dropdown Kategori ─────────────────────────────
const catWrap = document.getElementById('book-form-kategori-wrap');
const catVal = document.getElementById('book-form-kategori-val');
const catInput = document.getElementById('book-form-kategori');
if (catWrap) {
  catWrap.onclick = (e) => {
    e.stopPropagation();
    catWrap.classList.toggle('open');
  };
  const items = catWrap.querySelectorAll('.cfs-item');
  items.forEach(item => {
    item.onclick = (e) => {
      e.stopPropagation();
      catInput.value = item.dataset.val;
      catVal.textContent = item.dataset.val;
      items.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      catWrap.classList.remove('open');
    };
  });
}

document.addEventListener('click', e => {
  if (catWrap && catWrap.classList.contains('open') && !catWrap.contains(e.target)) {
    catWrap.classList.remove('open');
  }
});

// ── Init ──────────────────────────────────────────────────────
checkSession();

// ── QR Scanner Logic ──────────────────────────────────────────
let html5QrcodeScanner = null;

window.openScannerModal = function() {
  const modal = document.getElementById('scanner-modal');
  modal.classList.remove('hidden');
  
  if (!html5QrcodeScanner) {
    // using Html5QrcodeScanner from html5-qrcode.min.js
    html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader", { fps: 10, qrbox: {width: 250, height: 250} }, false
    );
  }
  
  html5QrcodeScanner.render(onScanSuccess, onScanError);
};

window.closeScannerModal = function() {
  const modal = document.getElementById('scanner-modal');
  modal.classList.add('hidden');
  
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear().catch(error => {
      console.error("Failed to clear html5QrcodeScanner.", error);
    });
    html5QrcodeScanner = null;
  }
};

async function onScanSuccess(decodedText, decodedResult) {
  try {
    const data = JSON.parse(decodedText);
    if (!data.bId || !data.n || !data.hp) {
      throw new Error("Invalid format");
    }
    
    // Close Scanner
    closeScannerModal();
    
    // Open Add Loan Modal and populate
    await openAddLoanModal(); 
    
    document.getElementById('add-loan-book').value = data.bId;
    document.getElementById('add-loan-nama').value = data.n;
    document.getElementById('add-loan-dusun').value = data.d || '';
    document.getElementById('add-loan-hp').value = data.hp;
    
    // Set Book Title and populate physical codes
    const book = allBooksData.find(b => b.id === data.bId);
    if (book) {
      document.getElementById('add-loan-book-val').textContent = book.judul;
      if (typeof window.renderKodeBukuOptions === 'function') {
        window.renderKodeBukuOptions(book);
      }
    } else {
      document.getElementById('add-loan-book-val').textContent = data.bTitle || data.bId;
    }
    
    showToast("Data QR berhasil dimuat!", 3000);
  } catch (err) {
    console.error("QR Parse Error", err);
    showToast("QR Code tidak valid!", 3000);
  }
}

function onScanError(errorMessage) {
  // Ignored
}
