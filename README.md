
# 💍 BR Wedding Organizer — Wedding Management & Booking System

Aplikasi web pemesanan dan manajemen layanan *Wedding Organizer* (WO) yang elegan, modern, dan *mobile-responsive*. Dibangun menggunakan **PHP Native (PDO REST API)**, **MySQL**, **Tailwind CSS**, dan **Vanilla JavaScript (Fetch API)** dengan tema *Luxury Dark & Gold*.

---

## 🚀 Features

### User (Client) Features
- **Register & Login** dilengkapi kompresi foto profil otomatis (WebP/Base64)
- **Katalog Layanan & Paket WO** dengan pencarian *real-time*, filter kategori, dan urutkan (Terbaru/Terpopuler)
- **Detail Paket Multi-Varian** untuk memilih kapasitas/porsi secara dinamis sesuai kuota
- **Rancang Konsep Custom** — pengajuan konsep acara mandiri lengkap dengan *upload moodboard* (Gambar/PDF)
- **Direktori Vendor Rekanan** — eksplorasi referensi vendor (MUA, Dekorasi, Venue, Catering, dll.) beserta galeri foto
- **Wishlist Impian** — simpan paket favorit di penyimpanan lokal pengguna
- **Fleksibilitas Pembayaran** — mendukung metode Transfer/QRIS maupun Janji Temu (Cash di Kantor), dengan opsi **Pelunasan Penuh** atau **Down Payment (DP)** dinamis (persentase/nominal)
- **Manajemen Pesanan & Tagihan** — pantau status acara, unggah bukti bayar DP & pelunasan, serta cetak *Invoice* resmi
- **Pemberkasan Logistik Acara** — pengisian form detail pengantin (CPP/CPW), jadwal akad/resepsi, konsep, daftar vendor, serta *download/upload* dokumen panduan
- **Interactive A5 Guidebook Editor** — fitur penyuntingan Buku Panduan Acara secara langsung di web dengan *rich-text formatting*, *drag-and-drop* teks/gambar bebas, dan manajemen halaman A5
- **Floating WhatsApp Consultation** — terhubung langsung ke WhatsApp Admin untuk konsultasi kilat dan konfirmasi

### Admin Features
- **Executive Dashboard** — ringkasan statistik katalog aktif, total *event/pax* terjual, estimasi omzet, rincian aliran dana, dan *Log Aktivitas Admin*
- **Auto-Sync Mode** — sinkronisasi data latar belakang secara otomatis setiap 15 detik
- **Kelola Paket & Layanan** — CRUD paket pernikahan, manajemen multi-varian & stok kuota, serta *multi-image upload*
- **Kelola Referensi Vendor** — CRUD direktori vendor rekanan berdasarkan kategori
- **Manajemen Data Booking (Tabel & Kalender)** — pantau pesanan masuk dalam mode tabel atau kalender interaktif, *update* status pembayaran & acara, serta beri penawaran harga (*quotation*) pada pesanan *custom*
- **Manajemen Pemberkasan & Upgrade** — tinjau berkas persiapan klien, tambahkan *item upgrade*/tambahan layanan, dan cetak dokumen logistik
- **Jadwal BR (Agenda & TM)** — kalender khusus admin untuk memantau jadwal Hari-H, *Technical Meeting* (TM), dan menambah memo/catatan harian
- **Manajemen Jadwal Event & Penugasan Kru** — atur Penanggung Jawab (PJ), informasi TM, serta penugasan kru inti (MC, Vocal, Keyboard, Saxophone) dan kru WO tambahan yang terintegrasi dengan tombol *chat* WhatsApp
- **Master Data Kru** — kelola database personel/kru beserta nomor WhatsApp
- **Laporan Penyelenggaraan (Transkrip)** — rekapitulasi acara yang sukses terselenggara beserta valuasi per paket
- **Database Klien** — daftar pengguna terdaftar beserta riwayat pemesanannya
- **Pengaturan Web & Cropper.js** — kustomisasi logo (terang/gelap), *wallpaper* login, *banner highlight*, kode QRIS (Lunas & DP), nomor WA CS, dan tautan buku panduan lengkap dengan fitur *image cropping* langsung di browser

---

## 🗂️ Project Structure

```
wedding_wo/
├── api.php                   # Backend REST API (PDO MySQL connection & endpoints)
├── index.html                # Halaman utama aplikasi untuk Klien (SPA architecture)
├── index.css                 # Stylesheet khusus halaman Klien & A5 Paper styling
├── index.js                  # Logika frontend Klien, Fetch API, & A5 Guidebook Editor
├── admin.html                # Halaman panel manajemen untuk Admin
├── admin.css                 # Stylesheet khusus panel Admin & animasi modal
├── admin.js                  # Logika frontend Admin, kalender, & integrasi Cropper.js
└── README.md                 # Dokumentasi proyek
```

---

## ⚙️ Installation

### Requirements
- XAMPP / Laragon / WAMP / LAMP (PHP 7.4+ atau 8.0+, MySQL 5.7+)
- Browser modern (Chrome, Edge, Firefox, Safari)
- Koneksi internet (untuk memuat CDN Tailwind CSS, FontAwesome, dan Cropper.js)

### Steps

1. **Salin folder proyek** ke dalam direktori root web server Anda:
   ```
   C:\xampp\htdocs\wedding_wo\
   ```

2. **Buat dan Konfigurasi Database**:
   - Buka `http://localhost/phpmyadmin`
   - Buat database baru dengan nama **`wedding_db`**
   - Buat tabel-tabel yang dibutuhkan (`klien`, `layanan`, `booking`, `pengaturan`, `vendor`, `berkas`, `jadwal`, `master_kru`, `catatan_hnp`, `aktivitas`) atau *import* file SQL Anda.

3. **Sesuaikan Koneksi Database** (jika menggunakan kredensial berbeda):
   - Buka file `api.php`
   - Sesuaikan konfigurasi berikut:
     ```php
     $host = "localhost";
     $user = "root";
     $pass = "";
     $db   = "wedding_db";
     ```

4. **Sesuaikan Endpoint URL di Frontend** (jika nama folder berbeda):
   - Pada `index.js` dan `admin.js`, pastikan variabel `SCRIPT_URL` mengarah ke lokasi `api.php` Anda:
     ```javascript
     const SCRIPT_URL = 'http://localhost/wedding_wo/api.php';
     ```

5. **Jalankan Aplikasi**:
   - **Halaman Klien:** `http://localhost/wedding_wo/index.html`
   - **Panel Admin:** `http://localhost/wedding_wo/admin.html`

---

## 🗄️ Database Schema

### ERD Overview

```
klien ──────────────────────────────────────────┐
  username (PK)                                 │
  nama_lengkap, no_hp, password, foto_profil    │
                                                │ (1:N)
layanan ────────────────────┐                booking
  id (PK)                   │                 id_booking (PK)
  nama_paket, kategori      │   (1:N)         tanggal
  harga_base, kuota_tersedia├───────────────► username_klien (FK → klien)
  url_gambar, deskripsi     │                 id_paket (FK → layanan)
  varian (JSON)             │                 nama_paket, jumlah_pax, total_harga
                                              tipe_pembayaran, metode_bayar, detail_dp
                                              bukti_pembayaran, bukti_pelunasan
                                              status_acara, status_pembayaran
                                              detail_pilihan (JSON), file_konsep
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │ (1:1)                                           │ (1:1)
                       ▼                                                 ▼
                    berkas                                            jadwal
                      id_booking (PK, FK)                               id_booking (PK, FK)
                      username, nama_cpp, nama_cpw                      pj, tgl_tm, waktu_tm
                      tgl_akad, waktu_akad                              lokasi_tm, status_tm
                      tgl_resepsi, waktu_resepsi                        mc, vocal, keyboard, saxo
                      undangan, konsep, makeup, busana                  wo (JSON), keterangan
                      pesanan, prewed, tm
                      v_dekorasi, v_mua, v_keluarga, v_mc...
                      catatan, file_panduan
                      data_upgrade (JSON), html_panduan
```

### Tables

| Table | Key Fields |
| :--- | :--- |
| `klien` | `username` (PK), `nama_lengkap`, `no_hp`, `password`, `foto_profil` |
| `layanan` | `id` (PK), `nama_paket`, `kategori`, `harga_base`, `kuota_tersedia`, `url_gambar`, `deskripsi`, `varian` |
| `booking` | `id_booking` (PK), `tanggal`, `username_klien`↗, `id_paket`↗, `nama_paket`, `jumlah_pax`, `total_harga`, `tipe_pembayaran`, `metode_bayar`, `detail_dp`, `bukti_pembayaran`, `bukti_pelunasan`, `status_acara`, `detail_pilihan`, `status_pembayaran`, `file_konsep`, `catatan_klien` |
| `berkas` | `id_booking` (PK)↗, `username`, `nama_cpp`, `nama_cpw`, `tgl_akad`, `waktu_akad`, `tgl_resepsi`, `waktu_resepsi`, `undangan`, `konsep`, `makeup`, `busana`, `pesanan`, `prewed`, `tm`, `v_dekorasi` .. `v_venue`, `catatan`, `file_panduan`, `data_upgrade`, `html_panduan` |
| `jadwal` | `id_booking` (PK)↗, `pj`, `tgl_tm`, `waktu_tm`, `lokasi_tm`, `status_tm`, `mc`, `vocal`, `keyboard`, `saxo`, `wo`, `keterangan` |
| `vendor` | `id_vendor` (PK), `nama_vendor`, `kategori`, `deskripsi`, `url_gambar` |
| `pengaturan` | `setting_key` (PK), `setting_value` |
| `master_kru` | `id` (PK), `kategori`, `nama`, `no_wa` |
| `catatan_hnp`| `tanggal` (PK), `catatan` |
| `aktivitas` | `id` (PK), `waktu`, `teks` |

---

## 🎨 UI / Color Scheme

Aplikasi ini mengusung tema **Luxury Dark & Gold** untuk memberikan kesan eksklusif dan elegan.

| Token | Hex | Usage |
| :--- | :--- | :--- |
| Obsidian Black | `#0a0a0a` | Latar belakang utama halaman (*main background*) |
| Charcoal Dark | `#111111` | Kartu permukaan (*cards*), *modal sheet*, dan *sidebar* |
| Metallic Gold | `#D4AF37` | Warna aksen utama, tombol primer, *border* aktif, dan teks sorotan |
| Bright Gold | `#F3C623` | Efek *hover* dan gradasi tombol utama |
| Emerald Green | `#10b981` | Indikator status *Lunas*, *Selesai*, dan tombol aksi simpan |
| Crimson Red | `#ef4444` | Indikator status *Dibatalkan*, hapus data, dan *badge* notifikasi |

---

## 🛡️ Security & Optimization

| Measure | Implementation |
| :--- | :--- |
| **SQL Injection Prevention** | Menggunakan **PDO Prepared Statements** dengan *parameter binding* (`?`) pada seluruh query di `api.php` |
| **CORS Handling** | Konfigurasi header `Access-Control-Allow-Origin` dan penanganan *preflight* `OPTIONS` untuk komunikasi API |
| **Client-Side Image Compression** | Kompresi dan konversi resolusi gambar otomatis menggunakan HTML5 `<canvas>` sebelum diunggah ke database |
| **Session & Caching** | Penyimpanan sesi pengguna di `localStorage` dan *caching* katalog/pengaturan di `sessionStorage` untuk pemuatan instan |

---

## 📱 Pages & Views

Karena menggunakan pendekatan *Single-Page Application* (SPA), navigasi antar tampilan dilakukan secara dinamis tanpa memuat ulang halaman:

| Role | View / Section | File / Trigger |
| :--- | :--- | :--- |
| **Client** | Katalog Utama & Banner | `/index.html` (`#sec-home`) |
| **Client** | Autentikasi (Login & Register) | `/index.html` (`#auth-section`) |
| **Client** | Detail Paket & Pilih Varian | `/index.html` (`#sec-detail-produk`) |
| **Client** | Eksplorasi Vendor Rekanan | `/index.html` (`#sec-vendor`) |
| **Client** | Wishlist Impian | `/index.html` (`#sec-favorite`) |
| **Client** | Status Pesanan & Pembayaran | `/index.html` (`#sec-pesanan`) |
| **Client** | Form Pemberkasan & Editor Panduan A5 | `/index.html` (`#modal-berkas` & `#modal-panduan-klien`) |
| **Admin** | Executive Dashboard & Log | `/admin.html` (`#sec-dashboard`) |
| **Admin** | Kelola Paket Layanan | `/admin.html` (`#sec-produk`) |
| **Admin** | Kelola Referensi Vendor | `/admin.html` (`#sec-vendor`) |
| **Admin** | Data Booking (Tabel & Kalender) | `/admin.html` (`#sec-penjualan`) |
| **Admin** | Jadwal BR (Kalender Agenda & TM) | `/admin.html` (`#sec-hnp`) |
| **Admin** | Jadwal Event & Penugasan Kru | `/admin.html` (`#sec-jadwal`) |
| **Admin** | Laporan Acara (Transkrip) | `/admin.html` (`#sec-transkrip`) |
| **Admin** | Database Klien | `/admin.html` (`#sec-pelanggan`) |
| **Admin** | Pengaturan Sistem Web | `/admin.html` (`#sec-pengaturan`) |

---

## 📄 License

Proyek ini dibuat untuk keperluan tugas akhir / proyek akademik dan pengembangan portofolio **BR Wedding Organizer**. Bebas digunakan dan dimodifikasi sesuai kebutuhan pembelajaran.
