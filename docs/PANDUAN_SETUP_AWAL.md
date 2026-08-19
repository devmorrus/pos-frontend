# 📘 Panduan Pengguna: Skenario 1 — Pengaturan Awal Sistem

**Morrus POS · Panduan Administrator / Owner**

> Dokumen ini menjelaskan secara lengkap seluruh langkah pengaturan awal yang harus dilakukan sebelum sistem dapat digunakan untuk operasional harian. Ikuti urutan langkah di bawah ini secara berurutan.

---

## 📋 Daftar Isi

1. [Prasyarat & Login](#1-prasyarat--login)
2. [Manajemen Outlet / Cabang (CRUD Lengkap)](#2-manajemen-outlet--cabang-crud-lengkap)
   - [2.1 Membuat Outlet Baru](#21-membuat-outlet-baru)
   - [2.2 Melihat Daftar Outlet](#22-melihat-daftar-outlet)
   - [2.3 Mengedit Data Outlet](#23-mengedit-data-outlet)
   - [2.4 Menonaktifkan Outlet](#24-menonaktifkan-outlet)
3. [Mengganti Konteks Cabang Aktif](#3-mengganti-konteks-cabang-aktif)
4. [Setup Bagan Akun Keuangan / COA (CRUD Lengkap)](#4-setup-bagan-akun-keuangan--coa-crud-lengkap)
   - [4.1 Memahami Tipe Akun](#41-memahami-tipe-akun)
   - [4.2 Daftar Akun Wajib Minimal](#42-daftar-akun-wajib-minimal)
   - [4.3 Cara Membuat Akun Baru](#43-cara-membuat-akun-baru)
   - [4.4 Cara Mengedit Akun](#44-cara-mengedit-akun)
   - [4.5 Cara Menonaktifkan Akun](#45-cara-menonaktifkan-akun)
   - [4.6 Akun Bertingkat (Parent–Child)](#46-akun-bertingkat-parentchild)
5. [Verifikasi Pengaturan Selesai](#5-verifikasi-pengaturan-selesai)
6. [Pertanyaan Umum (FAQ)](#6-pertanyaan-umum-faq)

---

## 1. Prasyarat & Login

Sebelum memulai, pastikan Anda memenuhi hal-hal berikut:

| Prasyarat | Keterangan |
|-----------|------------|
| **Akun dengan peran Owner** | Hanya Owner yang memiliki akses penuh ke Pengaturan Outlet dan Chart of Accounts. |
| **Koneksi internet aktif** | Sistem berjalan berbasis web dan membutuhkan koneksi stabil. |
| **Browser** | Google Chrome (direkomendasikan) versi terbaru. |

**Langkah Login:**
1. Buka browser dan akses URL aplikasi Morrus POS.
2. Masukkan **Email** dan **Password** akun Owner Anda.
3. Klik tombol **Masuk**.
4. Setelah berhasil, Anda akan diarahkan ke halaman **Dashboard Operasional**.

> [!IMPORTANT]
> Pastikan Anda login dengan peran **Owner** atau **Admin**. Jika login sebagai Kasir atau Gudang, menu Pengaturan Outlet dan Chart of Accounts tidak akan muncul.

---

## 2. Manajemen Outlet / Cabang (CRUD Lengkap)

**Outlet** adalah representasi fisik cabang toko Anda di dalam sistem. Setiap outlet memiliki stok, kasir, dan transaksi yang terpisah.

### 2.1 Membuat Outlet Baru

**Lokasi menu:** `Pengaturan` → `Outlet`

**Langkah-langkah:**

1. Dari sidebar kiri, klik menu **Pengaturan**.
2. Klik sub-menu **Outlet**.
3. Halaman daftar outlet akan terbuka. Klik tombol **➕ Tambah Outlet** di pojok kanan atas.
4. Sebuah formulir akan muncul. Isi semua kolom berikut:

| Kolom | Keterangan | Contoh Nilai | Wajib? |
|-------|------------|--------------|--------|
| **Kode Outlet** | Kode unik pendek untuk outlet. Tidak boleh sama dengan outlet lain. Gunakan huruf besar tanpa spasi. | `CBG-DEMO-01` | ✅ Ya |
| **Nama Outlet** | Nama lengkap cabang yang akan muncul di seluruh sistem dan struk. | `Cabang Demo Utama` | ✅ Ya |
| **Alamat** | Alamat fisik lengkap toko (jalan, nomor, kota). | `Jl. Raya Surabaya No. 12, Surabaya` | ❌ Opsional |
| **Nomor Telepon** | Nomor kontak toko (digunakan untuk struk dan komunikasi). | `031-5501234` | ❌ Opsional |

5. Setelah semua terisi, klik tombol **Simpan**.
6. Outlet baru akan langsung muncul di tabel daftar outlet dengan status **Aktif**.

> [!NOTE]
> Kode Outlet digunakan sebagai prefix nomor dokumen (PO, transaksi, dsb). Gunakan kode yang singkat dan mudah dikenali, misalnya `SBY-01` untuk Surabaya, `JKT-02` untuk Jakarta.

---

### 2.2 Melihat Daftar Outlet

**Lokasi menu:** `Pengaturan` → `Outlet`

Di halaman ini Anda dapat melihat seluruh outlet yang terdaftar di bisnis Anda dalam bentuk tabel. Informasi yang ditampilkan per baris:

- **Kode** — Kode unik outlet.
- **Nama Outlet** — Nama lengkap cabang.
- **Alamat & Telepon** — Info kontak toko.
- **Status** — `Aktif` (hijau) atau `Nonaktif` (abu-abu).
- **Tanggal Dibuat** — Kapan outlet didaftarkan.
- **Aksi** — Tombol Edit.

---

### 2.3 Mengedit Data Outlet

Anda dapat mengubah nama, alamat, telepon, atau kode outlet kapan saja.

**Langkah-langkah:**

1. Buka menu **Pengaturan** → **Outlet**.
2. Temukan outlet yang ingin diedit di tabel.
3. Klik ikon **✏️ Edit** (pensil) di kolom Aksi pada baris outlet tersebut.
4. Formulir edit akan terbuka dengan data yang sudah terisi sebelumnya.
5. Ubah kolom yang perlu diperbarui:
   - **Kode, Nama, Alamat, Telepon** → langsung ketik nilai baru.
   - **Status Aktif** → aktifkan atau nonaktifkan centang *"Outlet aktif"*.
6. Klik **Simpan** untuk menyimpan perubahan.

> [!WARNING]
> Mengubah **Kode Outlet** pada outlet yang sudah memiliki transaksi berjalan **tidak** akan mengubah nomor dokumen yang sudah ada sebelumnya. Perubahan hanya berlaku untuk dokumen baru.

---

### 2.4 Menonaktifkan Outlet

Outlet tidak dapat dihapus secara permanen untuk menjaga integritas data historis. Namun outlet dapat **dinonaktifkan** agar tidak muncul di pilihan kasir atau laporan aktif.

**Langkah-langkah:**

1. Buka menu **Pengaturan** → **Outlet**.
2. Klik ikon **✏️ Edit** pada outlet yang ingin dinonaktifkan.
3. Di formulir edit, hilangkan centang pada opsi **"Outlet aktif"**.
4. Klik **Simpan**.
5. Outlet akan hilang dari daftar pilihan outlet aktif di navbar dan dropdown kasir.

> [!CAUTION]
> Menonaktifkan outlet tidak akan menghapus data stok atau transaksi yang sudah ada. Namun kasir yang terhubung ke outlet ini tidak akan bisa membuka sesi kasir baru hingga outlet diaktifkan kembali.

---

## 3. Mengganti Konteks Cabang Aktif

Setelah membuat outlet baru, Anda perlu **mengganti tampilan dashboard** agar memperlihatkan data spesifik untuk cabang tersebut.

**Langkah-langkah:**

1. Lihat bagian **header/navbar** di bagian atas halaman (sebelah kanan nama pengguna).
2. Anda akan melihat dropdown bertuliskan nama outlet yang sedang aktif (misalnya: `Semua Cabang` atau nama outlet sebelumnya).
3. Klik dropdown tersebut.
4. Pilih outlet baru yang baru saja Anda buat: `Cabang Demo Utama`.
5. Halaman akan otomatis memuat ulang data — seluruh tabel, stok, transaksi, dan laporan kini disaring hanya untuk `Cabang Demo Utama`.

> [!NOTE]
> Pilihan **"Semua Cabang"** (jika tersedia) akan menampilkan data gabungan dari seluruh outlet. Ini berguna untuk laporan konsolidasi bisnis secara keseluruhan.

---

## 4. Setup Bagan Akun Keuangan / COA (CRUD Lengkap)

**Chart of Accounts (COA)** atau Bagan Akun adalah daftar terstruktur akun-akun keuangan yang digunakan sistem untuk mencatat jurnal secara otomatis di balik layar.

Setiap kali terjadi transaksi (penjualan POS, penerimaan PO, pembayaran supplier, dsb.), sistem akan **otomatis membuat entri jurnal** berdasarkan pemetaan akun-akun COA ini.

**Lokasi menu:** `Keuangan` → `Chart of Accounts`

---

### 4.1 Memahami Tipe Akun

Sistem mendukung **6 tipe akun** berikut. Tipe akun sangat penting karena menentukan ke sisi mana (Debit/Kredit) jurnal otomatis diarahkan:

| Tipe Akun | Nama Bahasa Indonesia | Posisi Normal | Digunakan untuk |
|-----------|----------------------|---------------|-----------------|
| `asset` | **Aset** | Debit | Kas, Bank, Piutang, Persediaan |
| `liability` | **Kewajiban** | Kredit | Utang Dagang, Utang Lain-lain |
| `equity` | **Modal / Ekuitas** | Kredit | Modal Pemilik, Laba Ditahan |
| `revenue` | **Pendapatan** | Kredit | Pendapatan Penjualan |
| `cogs` | **Harga Pokok Penjualan (HPP)** | Debit | Beban HPP / COGS |
| `expense` | **Beban** | Debit | Biaya Operasional, Biaya Gaji, dsb. |

---

### 4.2 Daftar Akun Wajib Minimal

Agar semua fitur sistem dapat berjalan dan menjurnal dengan benar, **minimal** akun-akun berikut harus ada dan aktif:

| Kode Akun | Nama Akun | Tipe | Tandai Kas/Bank? | Keterangan |
|-----------|-----------|------|-----------------|------------|
| `1001` | Kas Kasir | `asset` | ✅ Ya | Akun yang didebit saat kasir menerima pembayaran tunai dari pelanggan. |
| `1002` | Bank (contoh: Bank Mandiri) | `asset` | ✅ Ya | Akun kas digital / transfer. Buat per rekening bank yang Anda miliki. |
| `1101` | Persediaan Barang Dagang | `asset` | ❌ Tidak | Nilai stok barang yang ada di gudang/toko. Bertambah saat PO diterima, berkurang saat terjual. |
| `2001` | Utang Dagang | `liability` | ❌ Tidak | Kewajiban yang timbul saat menerima barang dari supplier (PO). |
| `4001` | Pendapatan Penjualan POS | `revenue` | ❌ Tidak | Dikreditkan setiap kali terjadi transaksi kasir yang berhasil. |
| `5001` | Harga Pokok Penjualan (HPP) | `cogs` | ❌ Tidak | Didebit saat barang terjual, mencerminkan biaya perolehan barang tersebut. |

> [!IMPORTANT]
> Akun yang ditandai **"Kas/Bank" = Ya** (kolom `isCashBank`) digunakan sebagai akun pembayaran. Pastikan setidaknya satu akun `asset` ditandai sebagai Kas/Bank agar sistem dapat memproses pembayaran tunai.

---

### 4.3 Cara Membuat Akun Baru

**Langkah-langkah membuat satu akun COA (contoh: Kas Kasir):**

1. Buka menu **Keuangan** → **Chart of Accounts**.
2. Klik tombol **➕ Tambah Akun** di pojok kanan atas.
3. Formulir tambah akun akan muncul. Isi kolom berikut:

| Kolom | Keterangan | Contoh untuk "Kas Kasir" |
|-------|------------|--------------------------|
| **Kode Akun** | Nomor unik akun (biasanya 4 digit angka). | `1001` |
| **Nama Akun** | Nama deskriptif yang jelas dan mudah dipahami. | `Kas Kasir` |
| **Tipe Akun** | Pilih salah satu dari 6 tipe (lihat tabel di atas). | `Asset` |
| **Tandai sebagai Kas/Bank** | Centang jika akun ini merepresentasikan uang tunai atau rekening bank. | ✅ Dicentang |
| **Cakupan** | Pilih `Bisnis` (berlaku semua cabang) atau `Outlet` (khusus satu cabang). | `Bisnis` |
| **Cabang** | Jika cakupan = Outlet, pilih outlet mana. | *(kosongkan jika Bisnis)* |
| **Akun Induk** | Opsional. Pilih akun parent jika ini adalah sub-akun. | *(kosongkan)* |

4. Klik **Simpan**.
5. Akun baru akan langsung muncul di tabel COA.

**Ulangi langkah yang sama** untuk membuat semua 6 akun wajib di tabel §4.2 di atas.

> [!TIP]
> Gunakan konvensi penomoran yang konsisten:
> - `1xxx` = Aset
> - `2xxx` = Kewajiban
> - `3xxx` = Ekuitas
> - `4xxx` = Pendapatan
> - `5xxx` = Harga Pokok Penjualan (COGS)
> - `6xxx` = Beban Operasional
>
> Ini memudahkan pembacaan laporan General Ledger di kemudian hari.

---

### 4.4 Cara Mengedit Akun

Anda dapat mengubah nama, tipe, atau kode akun yang sudah ada.

**Langkah-langkah:**

1. Buka menu **Keuangan** → **Chart of Accounts**.
2. Temukan akun yang ingin diubah di tabel.
3. Klik ikon **✏️ Edit** (pensil) pada baris akun tersebut.
4. Formulir edit terbuka dengan data akun terisi.
5. Ubah field yang diperlukan:
   - **Kode Akun, Nama Akun** → ketik langsung.
   - **Tipe Akun** → pilih ulang dari dropdown.
   - **Tandai Kas/Bank** → centang atau hilangkan centang.
   - **Status Aktif** → nonaktifkan jika tidak lagi digunakan.
6. Klik **Simpan** untuk menyimpan.

> [!WARNING]
> Mengubah **Tipe Akun** dari akun yang sudah memiliki jurnal historis dapat memengaruhi laporan Laba Rugi dan Neraca. Lakukan perubahan ini hanya di awal setup atau konsultasikan terlebih dahulu.

---

### 4.5 Cara Menonaktifkan Akun

Akun yang sudah tidak relevan dapat dinonaktifkan agar tidak lagi muncul di pilihan akun pada formulir transaksi.

**Langkah-langkah:**

1. Buka menu **Keuangan** → **Chart of Accounts**.
2. Klik ikon **✏️ Edit** pada akun yang ingin dinonaktifkan.
3. Hilangkan centang pada toggle/checkbox **"Status Aktif"**.
4. Klik **Simpan**.
5. Akun akan tetap terlihat di daftar COA (dengan label *Nonaktif*) namun tidak bisa dipilih di formulir transaksi baru.

> [!CAUTION]
> Jangan nonaktifkan akun yang **masih aktif digunakan dalam mapping jurnal otomatis** (seperti Kas Kasir atau Persediaan). Hal ini dapat menyebabkan transaksi baru gagal dijurnal oleh sistem.

---

### 4.6 Akun Bertingkat (Parent–Child)

Sistem mendukung hierarki akun — misalnya akun `Kas` sebagai induk, dengan sub-akun `Kas Kasir Utama`, `Kas Kasir Cadangan`, dsb.

**Cara membuat akun turunan (child account):**

1. Pastikan akun induk (parent) sudah dibuat lebih dahulu.
2. Buat akun baru seperti biasa (lihat §4.3).
3. Pada kolom **Akun Induk**, pilih akun parent dari dropdown.
4. Klik **Simpan**.

**Contoh hierarki umum yang direkomendasikan:**

```
1000 — Aset Lancar (Parent)
  ├── 1001 — Kas Kasir
  ├── 1002 — Bank Mandiri
  └── 1101 — Persediaan Barang Dagang

2000 — Kewajiban Jangka Pendek (Parent)
  └── 2001 — Utang Dagang

4000 — Pendapatan (Parent)
  └── 4001 — Pendapatan Penjualan POS

5000 — Harga Pokok Penjualan (Parent)
  └── 5001 — HPP Barang Dagang
```

---

## 5. Verifikasi Pengaturan Selesai

Setelah menyelesaikan semua langkah di atas, lakukan checklist verifikasi berikut sebelum mengizinkan tim operasional mulai bekerja:

| Status | Yang Perlu Diverifikasi |
|--------|------------------------|
| ☐ | Outlet baru sudah muncul di halaman **Pengaturan → Outlet** dengan status **Aktif** |
| ☐ | Dropdown outlet di navbar sudah menampilkan nama cabang baru |
| ☐ | 6 akun wajib (`1001`, `1002`, `1101`, `2001`, `4001`, `5001`) sudah ada di halaman **Keuangan → Chart of Accounts** |
| ☐ | Semua 6 akun tersebut berstatus **Aktif** |
| ☐ | Akun `1001 - Kas Kasir` sudah dicentang sebagai **Kas/Bank = Ya** |
| ☐ | Akun `1002 - Bank` juga sudah dicentang sebagai **Kas/Bank = Ya** |
| ☐ | Konteks outlet di navbar sudah diganti ke cabang yang baru |

Jika semua centang sudah terpenuhi, sistem siap digunakan untuk **Skenario 2: Pengadaan & Retur Barang**.

---

## 6. Pertanyaan Umum (FAQ)

**❓ Apakah saya perlu membuat COA lagi untuk setiap outlet baru?**

Tidak perlu. Akun dengan cakupan **Bisnis** secara otomatis berlaku untuk semua outlet. Anda hanya perlu membuat akun baru jika ingin memisahkan pencatatan kas untuk cabang tertentu secara eksplisit (misalnya `Kas Kasir - Surabaya` vs `Kas Kasir - Jakarta`).

---

**❓ Apa yang terjadi jika ada transaksi terjadi tapi akun belum dibuat?**

Sistem akan tetap mencatat transaksi, namun kolom jurnal akan kosong atau transaksi akan ditandai sebagai **"Belum terjurnal"**. Anda bisa memperbaiki ini dengan membuat akun yang sesuai dan kemudian menjalankan pengecekan dari menu **Keuangan → Integrasi Akuntansi**.

---

**❓ Bolehkah saya mengganti kode akun setelah ada transaksi?**

Secara teknis bisa, namun **tidak disarankan**. Kode akun yang sudah muncul di laporan historis tidak akan ikut berubah. Lebih baik nonaktifkan akun lama dan buat akun baru dengan kode yang benar.

---

**❓ Berapa banyak outlet yang bisa dibuat?**

Tidak ada batasan jumlah outlet dari sisi aplikasi. Namun, jumlah outlet mungkin dibatasi oleh paket langganan bisnis Anda.

---

**❓ Apakah kasir bisa memilih outlet sendiri?**

Tidak. Kasir yang login akan **otomatis dihubungkan** ke outlet yang telah ditentukan oleh Administrator saat pembuatan akun kasir tersebut. Hanya Owner yang dapat berpindah antar outlet dari navbar.

---

*Dokumen terakhir diperbarui: Agustus 2026 — Morrus Digital Connecting*
