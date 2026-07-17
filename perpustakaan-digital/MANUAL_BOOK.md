# 📚 Manual Book — Pojok Baca Tlogosari

## Perpustakaan Digital Desa Tlogosari

**Versi:** 1.0  
**Terakhir Diperbarui:** Juli 2026  
**Platform:** Progressive Web App (PWA)

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Persyaratan Sistem](#2-persyaratan-sistem)
3. [Instalasi & Menjalankan Aplikasi](#3-instalasi--menjalankan-aplikasi)
4. [Panduan Pengguna (Pengunjung)](#4-panduan-pengguna-pengunjung)
5. [Panduan Administrator](#5-panduan-administrator)
6. [Struktur Data Buku](#6-struktur-data-buku)
7. [Arsitektur Aplikasi](#7-arsitektur-aplikasi)
8. [FAQ & Troubleshooting](#8-faq--troubleshooting)

---

## 1. Pendahuluan

### 1.1 Tentang Aplikasi

**Pojok Baca Tlogosari** adalah aplikasi perpustakaan digital berbasis web (PWA) yang dirancang untuk mengelola katalog buku dan peminjaman buku fisik di lingkungan Desa Tlogosari. Aplikasi ini dapat diakses melalui browser di perangkat apapun — komputer, tablet, maupun smartphone — dan dapat diinstal layaknya aplikasi native.

### 1.2 Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Katalog Buku Digital** | Menjelajahi koleksi buku dengan filter genre, rating, dan urutan |
| **Halaman Buku Fisik** | Katalog khusus buku yang tersedia untuk dipinjam secara fisik |
| **Halaman E-Book** | Katalog khusus buku digital yang dapat dibaca online secara legal |
| **Detail Buku** | Informasi lengkap: sinopsis, penulis, link baca/beli legal |
| **Sistem Peminjaman** | Pencatatan peminjaman buku fisik dengan kode eksemplar unik |
| **Cek Status Peminjaman** | Pengunjung dapat mengecek status pinjaman mereka |
| **Dashboard Admin** | Panel admin untuk mengelola peminjaman dan data buku |
| **PWA / Offline Support** | Dapat diinstal di perangkat dan diakses tanpa internet |

### 1.3 Peran Pengguna

- **Pengunjung** — Melihat katalog, membaca detail buku, mengakses link baca/beli legal, dan mengecek status peminjaman.
- **Admin** — Mengelola data peminjaman (tambah, setujui, tolak, kembalikan, hapus), serta mengelola data buku (stok, kategori, cover, dll).

---

## 2. Persyaratan Sistem

### 2.1 Untuk Pengunjung

- Browser modern: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari
- Koneksi internet (untuk akses pertama kali; setelahnya bisa offline)

### 2.2 Untuk Menjalankan Server Lokal (Development / Admin)

- **Python 3** atau **Node.js** terinstal di komputer
- Atau gunakan ekstensi **Live Server** di VS Code

> ⚠️ **Penting:** Aplikasi ini adalah PWA yang menggunakan Service Worker. Aplikasi **tidak bisa** dibuka langsung dengan `file://` — harus dijalankan melalui server lokal (`localhost`) atau di-deploy ke hosting.

---

## 3. Mengakses Aplikasi

### 3.1 Akses Online (GitHub Pages)

Aplikasi ini di-hosting secara gratis melalui **GitHub Pages** dan dapat diakses langsung melalui browser di alamat:

> 🌐 **https://[username].github.io/[nama-repo]/**

Tidak perlu instalasi apapun — cukup buka link di browser.

### 3.2 Menjalankan Server Lokal (Opsional / Development)

Jika ingin menjalankan aplikasi secara lokal untuk pengembangan, buka terminal di folder `perpustakaan-digital/`, lalu jalankan salah satu perintah berikut:

**Opsi A — Python 3:**
```bash
python3 -m http.server 8080
```

**Opsi B — Node.js (npx serve):**
```bash
npx serve .
```

**Opsi C — VS Code Live Server:**
Klik kanan pada `index.html` → **Open with Live Server**

Setelah server berjalan, buka browser dan akses:
- **Katalog:** `http://localhost:8080`
- **Admin:** `http://localhost:8080/admin.html`

### 3.3 Menginstal sebagai PWA

1. Buka aplikasi di browser Chrome/Edge (baik dari GitHub Pages maupun localhost)
2. Klik ikon **Install** (⊕) di address bar, atau buka menu ⋮ → **Install App**
3. Aplikasi akan muncul di home screen / desktop seperti aplikasi native

---

## 4. Panduan Pengguna (Pengunjung)

### 4.1 Halaman Utama (Katalog)

Halaman utama (`index.html`) menampilkan seluruh koleksi buku yang tersedia.

#### Komponen Halaman Utama:

- **Header** — Logo, kolom pencarian, dan navigasi ke halaman Admin
- **Hero Section** — Judul dan tombol navigasi cepat ("Jelajahi Koleksi" dan "Buku Populer")
- **Buku Populer** — Daftar horizontal buku-buku yang ditandai populer
- **Semua Koleksi** — Grid seluruh buku dengan sistem filter

#### Cara Mencari Buku:
1. Ketik judul, nama penulis, atau kata kunci di kolom **🔍 Pencarian** di bagian header
2. Hasil pencarian akan langsung muncul secara real-time (live search)

#### Cara Memfilter Buku:

| Filter | Cara Penggunaan |
|--------|----------------|
| **Tab Tipe** | Klik tab `📚 Semua`, `📚 Buku Fisik`, atau `💻 E-Book` |
| **Genre** | Klik pill genre yang tersedia (Novel, Sastra, Pendidikan, dll) |
| **Rating** | Klik dropdown `⭐ Rating` → pilih minimum rating (4.5+, 4.0+, 3.5+) |
| **Urutan** | Klik dropdown `↕ Urutan` → pilih: Rating ↓, Terbaru, atau A–Z |
| **Reset** | Klik tombol `↺ Reset` untuk menghapus semua filter |

### 4.2 Detail Buku

Klik kartu buku manapun untuk membuka panel detail di sisi kanan (desktop) atau layar penuh (mobile).

#### Informasi yang Ditampilkan:
- **Cover buku** (warna kategori atau gambar cover jika tersedia)
- **Kategori & rating** buku
- **Info bibliografi:** Penulis, Tempat Terbit, Penerbit, Tahun, Bahasa, Jumlah Halaman
- **Sinopsis** lengkap
- **Link Legal:**
  - 📖 **Baca Online** — Link ke Google Books, Scribd, Kemdikbud, dll
  - 🛒 **Beli Buku** — Link ke Gramedia, Tokopedia, dll
- **Pinjam Buku Fisik** — Menampilkan stok tersedia (hanya untuk buku dengan tipe fisik)

#### Cara Menutup Detail:
- Klik tombol **← Kembali** di panel detail
- Tekan tombol **Escape** pada keyboard
- Klik area di luar panel detail (di mobile)

### 4.3 Halaman Buku Fisik

Akses melalui `buku-fisik.html` — menampilkan katalog khusus buku fisik yang bisa dipinjam.

- Durasi peminjaman: **10 hari** per peminjaman
- Memiliki pencarian dan filter sendiri (genre, rating, urutan)
- Klik buku untuk melihat detail dan stok tersedia

### 4.4 Halaman E-Book

Akses melalui `buku-digital.html` — menampilkan katalog khusus buku digital.

- Buku dapat dibaca melalui platform legal & resmi
- Memiliki pencarian dan filter sendiri
- Klik buku untuk melihat link baca online

### 4.5 Cek Status Peminjaman

Akses melalui `peminjaman.html`:

1. Masukkan **nama**, **nomor HP**, atau **nama dusun** di kolom pencarian
2. Klik tombol **Cari**
3. Hasil akan menampilkan semua data peminjaman yang cocok, termasuk:
   - Judul buku yang dipinjam
   - Status peminjaman (Menunggu / Dipinjam / Dikembalikan / Ditolak)
   - Tanggal pinjam & tanggal pengembalian

---

## 5. Panduan Administrator

### 5.1 Login Admin

1. Buka halaman `admin.html`
2. Masukkan **password admin**: `tlogosarijaya2026`
3. Klik tombol **Masuk**

> Sesi login disimpan selama tab browser masih terbuka (session storage). Jika tab ditutup, admin perlu login ulang.

### 5.2 Dashboard Peminjaman

Setelah login, dashboard menampilkan:

#### Kartu Statistik:
| Kartu | Deskripsi |
|-------|-----------|
| **Total Peminjaman** | Jumlah seluruh record peminjaman |
| **Menunggu** | Peminjaman yang belum diproses |
| **Dipinjam** | Buku yang sedang aktif dipinjam |
| **Dikembalikan** | Peminjaman yang sudah selesai |

#### Filter Status:
Klik tombol filter untuk menyaring data: `Semua` | `⏳ Menunggu` | `📖 Dipinjam` | `✅ Kembali` | `❌ Ditolak`

#### Kartu Peminjaman:
Setiap kartu menampilkan:
- Judul buku, nama peminjam, dusun, nomor HP
- Status peminjaman (dengan warna berbeda)
- Tanggal pinjam & tanggal kembali
- Kode fisik buku (jika sudah ditetapkan)
- Indikator **⚠️ Terlambat** jika melewati tanggal pengembalian

### 5.3 Menambah Peminjaman Baru

1. Klik tombol **+ Tambah Peminjaman**
2. Isi formulir:
   - **Pilih Buku** — Hanya menampilkan buku fisik yang stoknya tersedia (bisa dicari)
   - **Kode Fisik Buku** — Pilih dari chip kode yang tersedia atau ketik manual (wajib diisi)
   - **Nama Lengkap Peminjam**
   - **Dusun / Alamat**
   - **Nomor HP / WhatsApp**
3. Klik **Simpan Peminjaman**

> ℹ️ Peminjaman yang dibuat oleh admin otomatis berstatus **Dipinjam** (tanpa perlu persetujuan).

### 5.4 Mengelola Status Peminjaman

| Aksi | Tersedia Saat Status | Deskripsi |
|------|---------------------|-----------|
| **Setujui** | Menunggu | Mengubah status menjadi "Dipinjam" |
| **Tolak** | Menunggu | Mengubah status menjadi "Ditolak" |
| **Dikembalikan** | Dipinjam | Menandai buku sudah dikembalikan |
| **Hapus** | Semua status | Menghapus record peminjaman secara permanen |

Setiap aksi memerlukan **konfirmasi** melalui dialog modal sebelum dieksekusi.

### 5.5 Kelola Buku

Klik tab **📚 Kelola Buku** untuk masuk ke panel manajemen data buku.

#### Fitur per Buku:

| Fitur | Deskripsi |
|-------|-----------|
| **📦 Stok Fisik** | Atur jumlah eksemplar dengan tombol +/− atau input angka |
| **📚 Toggle Buku Fisik** | Aktif/nonaktifkan ketersediaan buku fisik |
| **💻 Toggle E-Book** | Aktif/nonaktifkan ketersediaan buku digital |
| **📷 Upload Cover** | Klik ikon kamera pada cover untuk mengunggah gambar cover |
| **✏️ Edit Identitas** | Klik tombol ✏️ untuk mengedit data lengkap buku |

#### Sinkronisasi Otomatis:
- Jika stok diubah ke **0**, toggle Buku Fisik otomatis **nonaktif**
- Jika stok ditambah dari **0**, toggle Buku Fisik otomatis **aktif**
- Jika toggle Buku Fisik **diaktifkan** saat stok 0, stok otomatis menjadi **1**
- Jika toggle Buku Fisik **dinonaktifkan**, stok otomatis menjadi **0**

### 5.6 Menambah Buku Baru

1. Di tab Kelola Buku, klik tombol **➕ Tambah Buku**
2. Isi formulir:
   - **Judul Buku** (wajib)
   - **Penulis** (wajib)
   - **Kategori** — Pilih dari: Novel, Sastra, Pendidikan, Pengembangan Diri, Sains, Sejarah, Teknologi, Umum
   - **Tahun Terbit** & **Jumlah Halaman**
   - **Tempat Terbit** & **Penerbit**
   - **Bahasa**
   - **Sinopsis**
   - **URL Baca Online** & **URL Beli Buku**
   - **Kode Fisik** — Kode unik per eksemplar, pisahkan dengan koma (misal: `NOV-001-A, NOV-001-B`)
3. Klik **Simpan Buku**

> Buku baru disimpan di `localStorage` sebagai override. Stok dan ketersediaan default-nya nonaktif — atur melalui panel Kelola Buku.

### 5.7 Edit Identitas Buku

1. Klik tombol **✏️** pada kartu buku di tab Kelola Buku
2. Ubah field yang diinginkan
3. Klik **Simpan Buku**

### 5.8 Reset Semua Perubahan

Klik tombol **🔄 Reset Semua** untuk mengembalikan semua data buku ke kondisi awal (dari `books.json`). Perubahan yang disimpan di localStorage akan dihapus.

### 5.9 Logout

Klik tombol **🚪 Logout** di header untuk keluar dari dashboard admin.

---

## 6. Struktur Data Buku

Setiap buku dalam `data/books.json` memiliki field berikut:

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | String | ID unik buku (slug) |
| `judul` | String | Judul buku |
| `penulis` | String | Nama penulis |
| `kategori` | String | Kategori/genre buku |
| `tahun` | Number | Tahun terbit |
| `bahasa` | String | Bahasa buku |
| `halaman` | Number | Jumlah halaman |
| `rating` | Number | Rating buku (0–5) |
| `rating_count` | String | Jumlah rating (misal: "32.1k") |
| `populer` | Boolean | Ditampilkan di seksi Buku Populer |
| `stok` | Number | Jumlah eksemplar fisik |
| `kode_buku` | Array | Daftar kode unik per eksemplar fisik |
| `online` | Boolean | Tersedia sebagai e-book |
| `offline` | Boolean | Tersedia sebagai buku fisik |
| `cover` | String | URL/path gambar cover (kosong = fallback warna) |
| `cover_colors` | Array | 2 warna gradient untuk cover fallback |
| `sinopsis` | String | Sinopsis/deskripsi buku |
| `link_baca` | Array | Daftar link baca legal `[{nama, url}]` |
| `link_beli` | Array | Daftar link beli legal `[{nama, url}]` |

### Contoh Format Kode Buku:
```
NOV-001-A    → Novel, buku ke-1, eksemplar A
SAS-002-B    → Sastra, buku ke-2, eksemplar B
PD-003-A     → Pengembangan Diri, buku ke-3, eksemplar A
PDK-010-C    → Pendidikan, buku ke-10, eksemplar C
```

---

## 7. Arsitektur Aplikasi

### 7.1 Struktur File

```
perpustakaan-digital/
├── index.html              ← Halaman utama (Katalog)
├── admin.html              ← Dashboard Admin
├── buku-fisik.html         ← Katalog Buku Fisik
├── buku-digital.html       ← Katalog E-Book
├── peminjaman.html         ← Cek Status Peminjaman
├── manifest.json           ← Konfigurasi PWA
├── sw.js                   ← Service Worker (offline)
├── css/
│   ├── style.css           ← Stylesheet utama
│   └── pages.css           ← Stylesheet halaman tambahan
├── js/
│   ├── app.js              ← Logika halaman utama
│   ├── admin.js            ← Logika dashboard admin
│   ├── db.js               ← Database lokal (localStorage)
│   ├── katalog-fisik.js    ← Logika halaman buku fisik
│   ├── katalog-digital.js  ← Logika halaman e-book
│   └── peminjaman.js       ← Logika cek peminjaman
├── data/
│   └── books.json          ← Database katalog buku
└── icons/
    ├── logo.png            ← Logo aplikasi
    ├── icon-192.png        ← Ikon PWA 192×192
    └── icon-512.png        ← Ikon PWA 512×512
```

### 7.2 Penyimpanan Data

| Data | Lokasi | Tipe |
|------|--------|------|
| Katalog buku (master) | `data/books.json` | File statis (read-only) |
| Override data buku | `localStorage` key: `pojokbaca_book_overrides` | JSON di browser |
| Data peminjaman | `localStorage` key: `pojokbaca_loans` | JSON di browser |
| Sesi admin | `sessionStorage` key: `pojokbaca_admin_session` | Per-tab browser |

### 7.3 Alur Peminjaman

```
Pengunjung melihat buku → Lapor ke Admin
        ↓
Admin buka Dashboard → Klik "+ Tambah Peminjaman"
        ↓
Pilih buku → Isi kode fisik & data peminjam → Simpan
        ↓
Status otomatis: "Dipinjam" → Durasi 10 hari
        ↓
Buku dikembalikan → Admin klik "Dikembalikan"
        ↓
Status berubah: "Dikembalikan" ✅
```

### 7.4 Status Peminjaman

| Status | Kode | Deskripsi |
|--------|------|-----------|
| ⏳ Menunggu | `menunggu` | Peminjaman baru, belum diproses admin |
| 📖 Dipinjam | `dipinjam` | Buku sedang dipinjam (aktif) |
| ✅ Dikembalikan | `dikembalikan` | Buku sudah dikembalikan |
| ❌ Ditolak | `ditolak` | Peminjaman ditolak oleh admin |

---

## 8. FAQ & Troubleshooting

### Q: Aplikasi tidak bisa dibuka / blank putih
**A:** Pastikan Anda menjalankan aplikasi melalui server lokal (`localhost`), bukan membuka file HTML secara langsung. Lihat [Bagian 3.1](#31-menjalankan-server-lokal).

### Q: Data peminjaman hilang setelah pindah browser
**A:** Data peminjaman disimpan di `localStorage` browser. Data bersifat lokal per browser dan per perangkat. Jika ingin memindahkan data, perlu melakukan export/import secara manual.

### Q: Admin lupa password
**A:** Password default admin adalah `tlogosarijaya2026`. Password ini tersimpan di kode sumber (`js/admin.js`).

### Q: Bagaimana cara mengubah password admin?
**A:** Edit file `js/admin.js`, cari baris `const ADMIN_PASSWORD = 'tlogosarijaya2026';` lalu ganti dengan password baru.

### Q: Stok buku tidak berkurang saat ada peminjaman
**A:** Stok yang ditampilkan sudah memperhitungkan peminjaman aktif. Rumusnya: **Stok Tersedia = Total Stok − Peminjaman Aktif** (status Menunggu + Dipinjam).

### Q: Buku baru yang ditambahkan admin hilang setelah reset
**A:** Tombol "🔄 Reset Semua" menghapus seluruh override dari localStorage, termasuk buku baru yang ditambahkan admin. Data kembali ke isi asli `books.json`.

### Q: Bagaimana cara deploy / update website?
**A:** Website ini di-hosting melalui **GitHub Pages**. Untuk mengupdate:
1. Lakukan perubahan pada file di repository lokal
2. Commit dan push perubahan ke branch utama (`main` atau `gh-pages`)
3. GitHub Pages akan otomatis memperbarui website dalam beberapa menit

> Pastikan **GitHub Pages** sudah diaktifkan di **Settings → Pages** pada repository, dengan source branch yang sesuai.

### Q: Apakah data aman?
**A:** Data peminjaman dan override buku disimpan di `localStorage` browser **pengunjung/admin**. Data ini bersifat lokal per perangkat dan per browser. Untuk keamanan data yang lebih baik, disarankan:
- Backup rutin data localStorage
- Pertimbangkan migrasi ke database server (seperti Firebase/Supabase) untuk penggunaan multi-perangkat

---

> **Pojok Baca Tlogosari** — *Temukan buku terbaik untukmu* 📚
