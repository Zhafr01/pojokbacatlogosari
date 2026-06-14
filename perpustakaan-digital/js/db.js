/* =============================================================
   db.js — Pojok Baca Tlogosari — Loan Database (localStorage)
   ============================================================= */
'use strict';

const LoanDB = (() => {
  const STORAGE_KEY = 'pojokbaca_loans';

  // ── Helpers ──────────────────────────────────────────────────
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveAll(loans) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
  }

  // ── CRUD ─────────────────────────────────────────────────────

  /**
   * Create a new loan request
   * @param {Object} data - { bookId, bookTitle, nama, dusun, hp }
   * @returns {Object} the created loan record
   */
  function createLoan(data) {
    const loans = getAll();
    const now = new Date();
    const returnDate = new Date(now);
    returnDate.setDate(returnDate.getDate() + 10);

    const loan = {
      id: generateId(),
      bookId: data.bookId,
      bookTitle: data.bookTitle,
      nama: data.nama.trim(),
      dusun: data.dusun.trim(),
      hp: data.hp.trim(),
      tanggalPinjam: now.toISOString().split('T')[0],
      tanggalKembali: returnDate.toISOString().split('T')[0],
      status: 'menunggu', // menunggu | dipinjam | dikembalikan | ditolak
      catatan: '',
      createdAt: now.toISOString(),
    };

    loans.unshift(loan);
    saveAll(loans);
    return loan;
  }

  /**
   * Update loan status
   * @param {string} id - loan ID
   * @param {string} status - new status
   * @param {string} catatan - optional note
   * @returns {Object|null} updated loan or null if not found
   */
  function updateStatus(id, status, catatan = '') {
    const loans = getAll();
    const loan = loans.find(l => l.id === id);
    if (!loan) return null;
    loan.status = status;
    if (catatan) loan.catatan = catatan;
    loan.updatedAt = new Date().toISOString();
    saveAll(loans);
    return loan;
  }

  /**
   * Delete a loan record
   * @param {string} id
   * @returns {boolean}
   */
  function deleteLoan(id) {
    const loans = getAll();
    const filtered = loans.filter(l => l.id !== id);
    if (filtered.length === loans.length) return false;
    saveAll(filtered);
    return true;
  }

  /**
   * Search loans by nama or HP
   * @param {string} query
   * @returns {Array}
   */
  function searchLoans(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return getAll().filter(l =>
      l.nama.toLowerCase().includes(q) ||
      l.hp.includes(q) ||
      l.dusun.toLowerCase().includes(q)
    );
  }

  /**
   * Get active loans count for a specific book (status = menunggu or dipinjam)
   * @param {string} bookId
   * @returns {number}
   */
  function getActiveLoansForBook(bookId) {
    return getAll().filter(l =>
      l.bookId === bookId &&
      (l.status === 'menunggu' || l.status === 'dipinjam')
    ).length;
  }

  /**
   * Check if a user already has an active loan for a book
   * @param {string} bookId
   * @param {string} hp
   * @returns {boolean}
   */
  function hasActiveLoan(bookId, hp) {
    return getAll().some(l =>
      l.bookId === bookId &&
      l.hp === hp &&
      (l.status === 'menunggu' || l.status === 'dipinjam')
    );
  }

  /**
   * Get loan statistics
   * @returns {Object}
   */
  function getStats() {
    const loans = getAll();
    return {
      total: loans.length,
      menunggu: loans.filter(l => l.status === 'menunggu').length,
      dipinjam: loans.filter(l => l.status === 'dipinjam').length,
      dikembalikan: loans.filter(l => l.status === 'dikembalikan').length,
      ditolak: loans.filter(l => l.status === 'ditolak').length,
    };
  }

  /**
   * Get loans filtered by status
   * @param {string} status - empty string for all
   * @returns {Array}
   */
  function getByStatus(status) {
    const loans = getAll();
    if (!status) return loans;
    return loans.filter(l => l.status === status);
  }

  // ── Public API ───────────────────────────────────────────────
  return {
    createLoan,
    updateStatus,
    deleteLoan,
    searchLoans,
    getAll,
    getActiveLoansForBook,
    hasActiveLoan,
    getStats,
    getByStatus,
  };
})();
