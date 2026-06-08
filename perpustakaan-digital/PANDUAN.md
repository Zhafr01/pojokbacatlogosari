# 📚 Perpustakaan Digital — Panduan Penggunaan

Aplikasi web perpustakaan digital berbasis PWA yang bisa digunakan **offline** setelah pertama kali dibuka.

---

## 📂 Cara Menambah Buku

### 1. Siapkan file
- Copy file PDF ke folder `books/`
- Copy gambar cover ke folder `covers/` (opsional, kalau tidak ada akan pakai warna otomatis)

### 2. Daftarkan di `data/books.json`
Tambahkan entri baru di dalam array:

```json
{
  "id": "nama-unik-buku",
  "judul": "Judul Buku",
  "penulis": "Nama Penulis",
  "kategori": "Pertanian",
  "deskripsi": "Deskripsi singkat buku...",
  "cover": "covers/nama-cover.jpg",
  "pdf": "books/nama-file.pdf"
}
```

**Kategori yang bisa digunakan:** Pertanian, Kesehatan, Ekonomi, Pendidikan, Lingkungan, Sosial, Umum

### 3. Deploy ulang ke GitHub Pages

---

## 🚀 Cara Deploy ke GitHub Pages (Gratis Selamanya)

### Langkah 1: Buat akun GitHub
Daftar di [github.com](https://github.com) jika belum punya.

### Langkah 2: Buat repository baru
- Klik tombol **"New repository"**
- Nama: `perpustakaan-digital` (atau nama lain)
- Pilih **Public**
- Klik **"Create repository"**

### Langkah 3: Upload semua file
```bash
cd perpustakaan-digital
git init
git add .
git commit -m "Perpustakaan Digital pertama"
git remote add origin https://github.com/USERNAME/perpustakaan-digital.git
git push -u origin main
```

### Langkah 4: Aktifkan GitHub Pages
- Buka repository di GitHub
- Klik **Settings** → **Pages**
- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- Klik **Save**

### Langkah 5: Akses web
Web akan tersedia di:
```
https://USERNAME.github.io/perpustakaan-digital/
```
(Tunggu ~2 menit setelah deploy)

---

## 📱 Cara Install di HP Warga

### Android (Chrome):
1. Buka link web di Chrome
2. Ketuk menu titik tiga (⋮) di pojok kanan atas
3. Pilih **"Tambahkan ke layar utama"**
4. Ketuk **"Tambah"**
5. Aplikasi muncul di layar home seperti aplikasi biasa ✅

### iPhone (Safari):
1. Buka link web di Safari
2. Ketuk ikon **Share** (kotak dengan panah ke atas)
3. Pilih **"Add to Home Screen"**
4. Ketuk **"Add"** ✅

---

## 📥 Cara Simpan Buku untuk Offline

Setelah pertama kali membuka web (butuh internet):

**Cara 1 — Unduh semua sekaligus:**
- Ketuk tombol **"⬇ Unduh Semua"** di bagian atas
- Tunggu proses selesai
- Semua buku siap dibaca offline

**Cara 2 — Unduh per buku:**
- Buka setiap buku yang ingin dibaca offline
- Setelah pernah dibuka, buku otomatis tersimpan
- Muncul badge **"✓ Offline"** pada kartu buku

---

## 🔖 Fitur Penanda Halaman

- Ketuk **🔖** di pojok kanan atas saat membaca untuk menandai halaman
- Tahan lama tombol **🔖** untuk membuka daftar semua penanda
- Ketuk penanda untuk langsung lompat ke halaman tersebut
- Penanda tersimpan permanen di HP (tidak hilang walau browser ditutup)

---

## ⚙️ Struktur Folder

```
perpustakaan-digital/
├── index.html          ← Halaman beranda
├── reader.html         ← Halaman baca buku
├── manifest.json       ← Konfigurasi PWA
├── sw.js               ← Service Worker (offline)
├── css/style.css       ← Tampilan
├── js/
│   ├── app.js          ← Logic beranda
│   └── reader.js       ← Logic baca buku
├── data/
│   └── books.json      ← Daftar buku ← EDIT INI untuk tambah buku
├── books/              ← Taruh file PDF di sini
├── covers/             ← Taruh gambar cover di sini (opsional)
└── icons/              ← Ikon aplikasi
```

---

## ❓ Pertanyaan Umum

**Q: Ukuran maksimal PDF?**
A: GitHub Pages mendukung file hingga 100MB per file. Total repository hingga 1GB gratis.

**Q: Apakah warga perlu akun GitHub?**
A: Tidak. Warga hanya perlu membuka link di browser HP.

**Q: Kalau internet mati sebelum semua buku terunduh?**
A: Buku yang sudah pernah dibuka tetap bisa diakses. Buku yang belum pernah dibuka perlu internet sekali.

**Q: Bagaimana cara update/ganti buku?**
A: Edit `books.json`, tambah/hapus file PDF, lalu push ke GitHub. Versi baru otomatis tampil.
