# 📘 Panduan Pengguna: Skenario 5 — Manajemen Kas & Laporan Keuangan

**Morrus POS · Panduan Bagian Keuangan (Accounting) & Owner**

> Dokumen ini menjelaskan secara lengkap alur pembukuan akuntansi, pencatatan kas masuk/keluar manual diluar POS, proses audit integrasi jurnal otomatis, hingga pembacaan laporan keuangan (Laba Rugi, Arus Kas, dan Buku Besar) per cabang.

---

## 📋 Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Pencatatan Transaksi Kas Manual (Cash Flow Entry)](#2-pencatatan-transaksi-kas-manual-cash-flow-entry)
   - [2.1 Mencatat Pengeluaran Toko (Manual Outcome)](#21-mencatat-pengeluaran-toko-manual-outcome)
   - [2.2 Mencatat Pemasukan Toko (Manual Income)](#22-mencatat-pemasukan-toko-manual-income)
   - [2.3 Kolom Formulir Kas Flow](#23-kolom-formulir-kas-flow)
   - [2.4 Aturan Validasi Akun Kas/Bank](#24-aturan-validasi-akun-kasbank)
3. [Audit Integrasi Akuntansi (Accounting Integrations)](#3-audit-integrasi-akuntansi-accounting-integrations)
   - [3.1 Melakukan Cek Status Posting Jurnal](#31-melakukan-cek-status-posting-jurnal)
   - [3.2 Struktur Jurnal Otomatis Umum](#32-struktur-jurnal-otomatis-umum)
4. [Membaca Laporan Keuangan & Laporan Buku Besar](#4-membaca-laporan-keuangan--laporan-buku-besar)
   - [4.1 Laporan Laba Rugi (Profit & Loss)](#41-laporan-laba-rugi-profit--loss)
   - [4.2 Laporan Arus Kas (Cash Flow)](#42-laporan-arus-kas-cash-flow)
   - [4.3 Laporan Buku Besar (General Ledger)](#43-laporan-buku-besar-general-ledger)
5. [Verifikasi Skenario Selesai](#5-verifikasi-skenario-selesai)
6. [Pertanyaan Umum (FAQ)](#6-pertanyaan-umum-faq)

---

## 1. Prasyarat

Sebelum melakukan audit jurnal dan pencatatan kas manual, pastikan hal-hal berikut sudah siap:

| Prasyarat | Status yang Diharapkan |
|-----------|------------------------|
| Akun COA Sudah Terkonfigurasi | ✅ Bagan akun keuangan (COA) sudah dibuat lengkap (dari Skenario 1). |
| Hak Akses Pengguna | ✅ Login sebagai **Owner**, **Admin**, atau **Keuangan**. |
| Data Transaksi POS / PO Tersedia | ✅ Transaksi penjualan POS (Skenario 4) atau PO (Skenario 2) sudah diselesaikan. |

---

## 2. Pencatatan Transaksi Kas Manual (Cash Flow Entry)

Pencatatan kas manual digunakan untuk membukukan transaksi kas keluar/masuk di luar operasional langsung POS kasir (misalnya pembayaran tagihan listrik bulanan, pembelian alat tulis kantor, atau penerimaan modal tambahan).

### 2.1 Mencatat Pengeluaran Toko (Manual Outcome)

**Lokasi menu:** `Keuangan` → `Pengeluaran Toko`

**Langkah-langkah:**

1. Masuk ke halaman **Pengeluaran Toko** di sidebar.
2. Di pojok kanan atas, klik tombol **➕ Tambah Pengeluaran** (atau *Catat Pengeluaran*).
3. Isi formulir transaksi (lihat panduan kolom di §2.3).
4. Klik tombol **Simpan pengeluaran**.
5. Transaksi berhasil disimpan, saldo kas terpilih berkurang, dan jurnal didebit otomatis ke akun beban terkait.

---

### 2.2 Mencatat Pemasukan Toko (Manual Income)

**Lokasi menu:** `Keuangan` → `Pendapatan Toko`

Pemasukan ini digunakan untuk mencatat dana masuk dari luar penjualan POS kasir (misal: bunga bank, suntikan modal pemilik, atau hasil penjualan aset lama).

1. Masuk ke halaman **Pendapatan Toko**.
2. Klik tombol **➕ Tambah Pemasukan**.
3. Isi formulir transaksi.
4. Klik tombol **Simpan pemasukan**.

---

### 2.3 Kolom Formulir Kas Flow

Saat mengisi form pemasukan maupun pengeluaran, Anda akan menemui kolom-kolom berikut:

| Kolom | Keterangan | Contoh Nilai | Wajib? |
|-------|------------|--------------|--------|
| **Tanggal Transaksi** | Tanggal terjadinya pembayaran/penerimaan uang. | `2026-08-19` | ✅ Ya |
| **Outlet** | Pilih cabang mana yang melakukan transaksi ini. Pilih `Business level` jika transaksi ini berlaku untuk kantor pusat/global. | `Cabang Demo Utama` | ❌ Opsional |
| **Akun Asal** | Akun sumber dana. | `1002 - Bank Mandiri` | ✅ Ya |
| **Akun Tujuan** | Akun penampung dana / beban. | `6001 - Beban Biaya Listrik & Air` | ✅ Ya |
| **Nominal** | Jumlah uang dalam Rupiah. | `50000` | ✅ Ya |
| **Lampiran** | Foto atau PDF bukti bayar / struk transfer (Maks. 2MB). | `struk_listrik.jpg` | ❌ Opsional |
| **Catatan** | Keterangan/memo tambahan detail transaksi. | `Bayar tagihan listrik cabang Utama periode Agustus` | ❌ Opsional |

---

### 2.4 Aturan Validasi Akun Kas/Bank

Untuk menjaga integritas data keuangan double-entry, sistem menerapkan **satu aturan validasi ketat**:

> [!IMPORTANT]
> **Salah satu** dari *Akun Asal* atau *Akun Tujuan* wajib merupakan akun bertipe **Kas / Bank** (akun yang dicentang `isCashBank = Ya` saat setup COA di Skenario 1).
> - Pada transaksi **Pengeluaran**: Akun Asal wajib bertipe Kas/Bank (dana keluar dari kas).
> - Pada transaksi **Pemasukan**: Akun Tujuan wajib bertipe Kas/Bank (dana masuk ke kas).

Jika aturan ini dilanggar, sistem akan memunculkan pesan error: *"Salah satu akun harus bertipe kas/bank."*

---

## 3. Audit Integrasi Akuntansi (Accounting Integrations)

Setiap transaksi di dalam sistem Morrus POS (Penjualan Kasir, Penerimaan Purchase Order, Retur Supplier, Settlement Konsinyasi, Kas Manual) akan **menghasilkan jurnal akuntansi secara otomatis**. Anda dapat mengaudit integritas jurnal ini untuk memastikan pembukuan berjalan tanpa ada data yang tertinggal.

**Lokasi menu:** `Keuangan` → `Integrasi Akuntansi` (atau langsung ke `/accounting-integrations`)

### 3.1 Melakukan Cek Status Posting Jurnal

**Langkah-langkah:**

1. Buka halaman **Integrasi Akuntansi**.
2. Di bagian form **Cek Status Posting**:
   - **Reference Type**: Pilih jenis dokumen yang ingin diaudit (misalnya `Penjualan POS` atau `Purchase Order`).
   - **Nomor Dokumen / Reference ID**: Masukkan nomor dokumen yang sudah dicatat (misal: `TRX-20260819-0001` atau `PO-20260819-001`).
   - *Tip*: Anda dapat menggunakan panel daftar transaksi terakhir di sisi kanan layar untuk menyalin nomor invoice secara instan.
3. Klik tombol **Cek status**.
4. Hasil audit akan langsung dimuat:
   - Jika berhasil: Status berwarna hijau **"Sudah terjurnal"** dan tabel buku besar (Debit/Kredit) akan tampil lengkap di bawahnya.
   - Jika gagal/belum terjurnal: Status berwarna merah **"Belum terjurnal"** dengan opsi untuk memicu posting manual (Re-post).

---

### 3.2 Struktur Jurnal Otomatis Umum

Berikut adalah contoh entri jurnal yang dibuat otomatis oleh sistem untuk setiap jenis transaksi:

#### 📊 A. Penjualan POS Kasir (Pembayaran Tunai)
| Akun COA | Tipe Akun | Debit (Dr) | Kredit (Cr) |
|----------|-----------|------------|-------------|
| **1001 - Kas Kasir** | Asset | `Rp 150.000` | |
| **4001 - Pendapatan Penjualan POS** | Revenue | | `Rp 150.000` |
| **5001 - Harga Pokok Penjualan (HPP)** | COGS | `Rp 90.000` | |
| **1101 - Persediaan Barang Dagang** | Asset | | `Rp 90.000` |

#### 📦 B. Purchase Order (PO) Selesai dengan Pembayaran Tempo
| Akun COA | Tipe Akun | Debit (Dr) | Kredit (Cr) |
|----------|-----------|------------|-------------|
| **1101 - Persediaan Barang Dagang** | Asset | `Rp 1.000.000` | |
| **2001 - Utang Dagang** | Liability | | `Rp 1.000.000` |

---

## 4. Membaca Laporan Keuangan & Laporan Buku Besar

Modul pelaporan mengonsolidasi seluruh jurnal transaksi menjadi laporan siap pakai untuk audit pemilik bisnis.

### 4.1 Laporan Laba Rugi (Profit & Loss)

Menampilkan performa laba bersih bisnis dengan mengurangi total Pendapatan dengan Harga Pokok Penjualan (HPP) dan Beban Operasional.

**Lokasi menu:** `Laporan` → `Laba Rugi`

1. Pilih filter **Cabang / Outlet** (misal: `Cabang Demo Utama` atau `Semua Cabang`).
2. Tentukan **Rentang Tanggal / Bulan** berjalan.
3. Klik **Terapkan Filter**.
4. Laporan akan menampilkan:
   - **Pendapatan Bersih**: Total penjualan dikurangi diskon & voucher.
   - **Harga Pokok Penjualan (HPP)**: Total nilai perolehan barang yang terjual.
   - **Laba Kotor**: Selisih `Pendapatan - HPP`.
   - **Bebandan Pengeluaran**: Pengeluaran manual (listrik, parkir, dsb).
   - **Laba/Rugi Bersih**: Nominal akhir performa keuangan outlet.

---

### 4.2 Laporan Arus Kas (Cash Flow)

Menampilkan perputaran kas masuk dan keluar berdasarkan 3 aktivitas utama (Operasional, Investasi, Pendanaan).

**Lokasi menu:** `Laporan` → `Arus Kas`

1. Saring berdasarkan cabang dan bulan berjalan.
2. Laporan menampilkan saldo awal kas, rincian arus kas masuk (penerimaan kasir/pendapatan manual), arus kas keluar (pembayaran supplier/pengeluaran toko), dan saldo akhir kas yang harus cocok dengan uang fisik di rekening bank/kasir.

---

### 4.3 Laporan Buku Besar (General Ledger)

Menampilkan rincian histori mutasi (debit/kredit) per nomor akun COA secara kronologis.

**Lokasi menu:** `Laporan` → `Buku Besar`

1. Pilih nomor akun COA yang ingin diaudit (misal: `1101 - Persediaan`).
2. Saring rentang tanggal.
3. Laporan memperlihatkan rincian setiap mutasi penambahan/pengurangan stok beserta saldo akumulatif per tanggal.

---

## 5. Verifikasi Skenario Selesai

Lakukan pengujian akhir menggunakan checklist berikut:

| Status | Langkah Verifikasi |
|--------|--------------------|
| ☐ | Pengeluaran toko manual berhasil disimpan (nominal terpotong dari Kas/Bank) |
| ☐ | Pemasukan toko manual berhasil disimpan (nominal bertambah di Kas/Bank) |
| ☐ | Validasi pembatasan tipe akun kas/bank berjalan dengan benar |
| ☐ | Integrasi akuntansi menampilkan status "Sudah terjurnal" berwarna hijau untuk Invoice POS |
| ☐ | Integrasi akuntansi menampilkan status "Sudah terjurnal" berwarna hijau untuk PO yang selesai |
| ☐ | Buku besar akuntansi menunjukkan baris Debit dan Kredit berpasangan secara seimbang (Balanced) |
| ☐ | Laporan Laba Rugi memperlihatkan angka laba kotor dan laba bersih secara akurat |
| ☐ | Laporan Arus Kas mencerminkan mutasi kas operasional kasir dan pengadaan barang |

---

## 6. Pertanyaan Umum (FAQ)

**❓ Mengapa pengeluaran toko saya ditolak oleh sistem dengan pesan "Salah satu akun harus bertipe kas/bank"?**

Sistem menerapkan prinsip double-entry accounting. Setiap kas masuk/keluar harus bersentuhan dengan uang fisik/digital. Pastikan Anda memilih akun seperti `Kas Kasir` atau `Bank Mandiri` pada sisi akun asal (pengeluaran) atau akun tujuan (pemasukan).

---

**❓ Apa yang harus saya lakukan jika integrasi jurnal menampilkan status "Belum terjurnal"?**

Periksa apakah ada kode akun COA yang terhapus atau nonaktif. Jika bagan akun COA sudah benar, klik tombol **"Posting Jurnal"** atau **"Re-post"** di halaman tersebut untuk memicu pembukuan ulang.

---

**❓ Apakah nominal HPP (Harga Pokok Penjualan) dihitung manual oleh kasir?**

Tidak. HPP dihitung otomatis oleh sistem menggunakan metode persediaan (rata-rata/moving average) berdasarkan harga beli produk saat Purchase Order (PO) diselesaikan.

---

**❓ Bisakah saya mengekspor laporan keuangan ke format Excel atau PDF?**

Ya. Di setiap halaman laporan (Laba Rugi, Arus Kas, Buku Besar), tersedia tombol **Unduh PDF** atau **Ekspor Excel** di pojok kanan atas tabel laporan.

---

**❓ Apakah laporan keuangan bisa dipisahkan per cabang?**

Ya. Anda dapat memilih filter cabang di bagian atas untuk melihat laporan spesifik cabang, atau memilih `Semua Cabang` untuk melihat kinerja finansial grup bisnis secara keseluruhan.

---

*Dokumen terakhir diperbarui: Agustus 2026 — Morrus Digital Connecting*
