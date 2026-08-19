# 📘 Panduan Pengguna: Skenario 3 — Pengelolaan Produk Konsinyasi (Consignment)

**Morrus POS · Panduan Staf Gudang, Kasir, & Akuntan**

> Dokumen ini menjelaskan secara detail pengelolaan produk konsinyasi (titip jual) dari pihak ketiga (supplier konsinyasi). Panduan ini mencakup pencatatan tanda terima titipan, penjualan barang konsinyasi di kasir POS, perhitungan bagi hasil (settlement), hingga pengembalian barang sisa ke supplier (retur konsinyasi).

---

## 📋 Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Tanda Terima Konsinyasi (CRUD & Alur Lengkap)](#2-tanda-terima-konsinyasi-crud--alur-lengkap)
   - [2.1 Membuat Tanda Terima Baru](#21-membuat-tanda-terima-baru)
   - [2.2 Melihat Daftar Tanda Terima](#22-melihat-daftar-tanda-terima)
   - [2.3 Mengedit Tanda Terima (Draft)](#23-mengedit-tanda-terima-draft)
   - [2.4 Siklus Status Tanda Terima](#24-siklus-status-tanda-terima)
3. [Operasional Penjualan Barang Konsinyasi](#3-operasional-penjualan-barang-konsinyasi)
4. [Settlement & Bagi Hasil Konsinyasi (Settlement)](#4-settlement--bagi-hasil-konsinyasi-settlement)
   - [4.1 Membuat Settlement Baru](#41-membuat-settlement-baru)
   - [4.2 Mengubah Status Settlement (Pelunasan)](#42-mengubah-status-settlement-pelunasan)
5. [Retur Konsinyasi (Consignment Return)](#5-retur-konsinyasi-consignment-return)
   - [5.1 Membuat Retur Konsinyasi Baru](#51-membuat-retur-konsinyasi-baru)
   - [5.2 Siklus Status Retur Konsinyasi](#52-siklus-status-retur-konsinyasi)
6. [Verifikasi Skenario Selesai](#6-verifikasi-skenario-selesai)
7. [Pertanyaan Umum (FAQ)](#7-pertanyaan-umum-faq)

---

## 1. Prasyarat

Sebelum mencatat barang konsinyasi, pastikan kondisi berikut terpenuhi:

| Prasyarat | Status yang Diharapkan |
|-----------|------------------------|
| Supplier Konsinyasi Terdaftar | ✅ Supplier memiliki status aktif di menu **Supplier**. |
| Produk Master Sudah Ada | ✅ Produk yang dititipkan sudah terdaftar di menu **Produk**. |
| Konteks Outlet Aktif | ✅ Pilihlah cabang/outlet spesifik di navbar atas. |
| Peran Hak Akses | ✅ Owner, Admin, atau staf Gudang. |

---

## 2. Tanda Terima Konsinyasi (CRUD & Alur Lengkap)

Tanda terima konsinyasi digunakan untuk mencatat masuknya produk titip jual dari supplier. Pencatatan ini akan **menambah stok produk** di outlet tanpa menciptakan utang dagang langsung pada neraca keuangan.

### 2.1 Membuat Tanda Terima Baru

**Lokasi menu:** `Konsinyasi` → `Daftar Konsinyasi`

**Langkah-langkah:**

1. Buka menu **Konsinyasi** dari sidebar kiri.
2. Klik sub-menu **Daftar Konsinyasi**.
3. Di pojok kanan atas, klik tombol **Buat Tanda Terima**.
4. Isi data formulir sebagai berikut:

| Kolom | Keterangan | Contoh Nilai | Wajib? |
|-------|------------|--------------|--------|
| **Supplier** | Pilih nama supplier konsinyasi yang menitipkan barang. | `PT Multi Pemasok Demo` | ✅ Ya |

**Tabel Item Konsinyasi (Daftar Produk):**

Untuk setiap produk yang dititipkan:

| Kolom | Keterangan | Contoh Nilai |
|-------|------------|--------------|
| **Produk** | Pilih nama produk dari dropdown. | `Keripik Singkong Demo` |
| **Kuantitas (Qty)** | Jumlah barang yang dititipkan oleh supplier. | `50` |
| **Unit Cost (Harga Modal)** | Harga kesepakatan bagi hasil (hak yang akan dibayarkan ke supplier setelah barang laku). | `Rp 10.000` |
| **Unit Price (Harga Jual)** | Harga akhir yang dikenakan ke konsumen di kasir POS. | `Rp 15.000` |

- Gunakan tombol **➕ Tambah Baris** untuk mendaftarkan lebih dari satu produk.
- Klik ikon **🗑 Hapus** di sisi kanan jika ingin membatalkan salah satu baris produk.
- **Nilai Total Konsinyasi** (berdasarkan Unit Cost) akan dihitung otomatis.

5. Klik tombol **Simpan**.
6. Tanda terima konsinyasi berhasil dibuat dalam status **`draft`** dengan nomor dokumen otomatis (misalnya `CSG-20260819-0001`).

---

### 2.2 Melihat Daftar Tanda Terima

**Lokasi menu:** `Konsinyasi` → `Daftar Konsinyasi`

Halaman utama ini menampilkan daftar tanda terima barang konsinyasi:

- **No. Konsinyasi** — Nomor unik dokumen.
- **Supplier & Outlet** — Pihak penitiper dan lokasi cabang penyimpanan.
- **Tanggal** — Tanggal penerimaan barang.
- **Status** — `draft`, `received`, atau `cancelled`.
- **Jumlah Item** — Total variasi produk yang masuk.
- **Aksi** — Tombol Detail.

---

### 2.3 Mengedit Tanda Terima (Draft)

Jika ada kesalahan pengisian saat barang datang, Anda dapat memperbaikinya selama status dokumen masih `draft`.

1. Di tabel daftar konsinyasi, klik tombol **Detail** pada dokumen yang berstatus `draft`.
2. Klik tombol **✏️ Edit**.
3. Perbarui informasi supplier, kuantitas produk, harga modal, atau harga jual.
4. Klik **Simpan**.

---

### 2.4 Siklus Status Tanda Terima

Setiap dokumen konsinyasi memiliki status perkembangan berikut:

```
[draft] ──► [received] (Stok Masuk)
  │
  └───────► [cancelled] (Batal)
```

| Status | Arti | Dampak ke Stok |
|--------|------|----------------|
| `draft` | Dokumen baru dicatat, belum disetujui. | ❌ Stok belum bertambah. |
| `received` | Dokumen telah diverifikasi dan disetujui. | ✅ Stok produk bertambah secara otomatis di outlet. |
| `cancelled` | Dokumen dibatalkan secara permanen. | ❌ Tidak memengaruhi stok. |

**Cara Mengaktifkan Stok (Mengubah Status menjadi Received):**
1. Buka halaman **Detail Tanda Terima**.
2. Klik tombol **Selesai Penerimaan** (atau **Set Status Received**).
3. Klik **Proses** pada dialog konfirmasi.
4. Status dokumen berubah menjadi **`received`** (hijau) dan stok produk langsung bertambah.

---

## 3. Operasional Penjualan Barang Konsinyasi

Setelah status tanda terima berubah menjadi `received`, produk tersebut siap dijual di kasir:

1. Buka menu **Penjualan** → **POS Kasir**.
2. Produk konsinyasi (misal: *Keripik Singkong Demo*) akan otomatis muncul di grid katalog produk dengan stok yang sesuai (`50 pcs`).
3. Tambahkan produk tersebut ke keranjang belanja dan lakukan pembayaran seperti biasa (Tunai/Non-Tunai).
4. Setiap transaksi POS yang berhasil akan memicu dua hal otomatis di latar belakang:
   - Stok fisik produk berkurang (`qty` terjual).
   - Sistem mencatat transaksi ini sebagai **Unpaid Consignment Sale** (Penjualan Konsinyasi Belum Terbayar). Informasi ini mencatat bahwa kita berutang sebesar `Unit Cost` (Harga Modal) per unit produk yang laku kepada supplier terkait.

---

## 4. Settlement & Bagi Hasil Konsinyasi (Settlement)

**Settlement Konsinyasi** adalah proses penarikan data penjualan barang titipan yang sudah laku untuk dihitung bagi hasilnya, kemudian dilakukan pembayaran kepada supplier.

**Lokasi menu:** `Konsinyasi` → `Daftar Konsinyasi` → Klik tombol **Settlement** (atau langsung akses `/consignment-settlements`)

---

### 4.1 Membuat Settlement Baru

**Langkah-langkah:**

1. Masuk ke halaman **Settlement Konsinyasi**.
2. Pilih nama **Supplier** pada panel dropdown sebelah kiri (misal: `PT Multi Pemasok Demo`).
3. Sistem secara otomatis memuat daftar transaksi produk konsinyasi milik supplier tersebut yang statusnya **belum dibayar (unpaid)** pada outlet aktif.
4. Di panel kiri, perhatikan ringkasan data:
   - **Jumlah Unpaid Sales** — Total qty item milik supplier yang sudah laku terjual di POS.
   - **Total Hak Supplier** — Nominal bagi hasil bersih yang harus kita bayarkan ke supplier (`Qty Terjual × Unit Cost`).
5. Periksa tabel rincian di sebelah kanan untuk memastikan kecocokan nomor invoice penjualan kasir, nama produk, kuantitas laku, dan tanggal transaksi.
6. Jika data sudah sesuai, klik tombol **Buat Settlement** di panel kiri.
7. Dokumen settlement berhasil dibuat dengan status **`draft`** dan nomor otomatis (misalnya `STL-20260819-0001`). Anda akan langsung diarahkan ke halaman **Detail Settlement**.

---

### 4.2 Mengubah Status Settlement (Pelunasan)

Dokumen settlement yang baru dibuat masih berstatus `draft`. Untuk menandai bahwa Anda telah mentransfer bagi hasil ke rekening supplier:

1. Buka halaman **Detail Settlement** yang bersangkutan.
2. Pastikan dana bagi hasil sudah ditransfer/dibayarkan ke pihak supplier.
3. Klik tombol **Set Status Settled** (atau **Selesaikan Pembayaran**).
4. Konfirmasi dengan mengeklik **Proses**.
5. Status settlement berubah menjadi **`settled`** (hijau).
6. Penjualan konsinyasi tersebut kini berstatus **paid** dan tidak akan muncul lagi di draft perhitungan settlement berikutnya. Jurnal akuntansi otomatis mencatat biaya bagi hasil ini.

---

## 5. Retur Konsinyasi (Consignment Return)

**Retur Konsinyasi** digunakan jika barang titipan dari supplier tidak laku terjual setelah periode tertentu, rusak, atau ditarik kembali oleh supplier sebelum laku.

**Lokasi menu:** `Konsinyasi` → `Daftar Konsinyasi` → Klik tombol **Retur** (atau langsung akses `/consignments/returns`)

### 5.1 Membuat Retur Konsinyasi Baru

1. Masuk ke halaman **Daftar Retur Konsinyasi**.
2. Klik tombol **Buat Retur** di pojok kanan atas.
3. Pilih **Supplier** tujuan pengembalian barang.
4. Masukkan daftar produk titipan yang ingin dikembalikan beserta jumlahnya (`Qty`).
5. Klik **Simpan**. Dokumen retur tercatat sebagai **`draft`** dengan nomor retur otomatis (misal `CRT-20260819-0001`).

---

### 5.2 Siklus Status Retur Konsinyasi

Untuk memotong stok produk secara permanen di gudang (karena barang dikembalikan fisik ke supplier):

1. Buka halaman **Detail Retur Konsinyasi**.
2. Klik tombol **Selesaikan Retur** (atau **Set Status Completed**).
3. Status berubah menjadi **`completed`** (hijau) dan stok di sistem otomatis berkurang.

---

## 6. Verifikasi Skenario Selesai

Pastikan semua proses konsinyasi berjalan normal dengan checklist berikut:

| Status | Langkah Verifikasi |
|--------|--------------------|
| ☐ | Tanda terima konsinyasi berhasil dibuat dan berstatus `received` |
| ☐ | Stok produk konsinyasi bertambah di menu **Inventori** |
| ☐ | Produk konsinyasi dapat dibeli di kasir POS |
| ☐ | Setelah penjualan sukses, data laku muncul di pratinjau draft halaman **Settlement** |
| ☐ | Dokumen settlement berhasil dibuat dengan status `draft` |
| ☐ | Status settlement berhasil diubah menjadi `settled` setelah pembayaran bagi hasil selesai |
| ☐ | Stok sisa berhasil dipotong saat dokumen **Retur Konsinyasi** diselesaikan (`completed`) |

---

## 7. Pertanyaan Umum (FAQ)

**❓ Apa perbedaan utama Purchase Order (PO) Konsinyasi dengan Tanda Terima Konsinyasi di menu Konsinyasi?**

PO Konsinyasi terintegrasi dengan modul pembelian supplier, sedangkan menu Konsinyasi digunakan untuk pendaftaran titipan langsung di lapangan yang terpisah dari skema procurement korporat. Keduanya sama-sama menambah stok tanpa menciptakan utang dagang instan.

---

**❓ Mengapa produk konsinyasi saya tidak muncul di POS kasir?**

Pastikan status tanda terima konsinyasi sudah diubah dari `draft` menjadi `received`. Jika masih `draft`, stok produk tersebut belum masuk ke sistem dan tidak dapat dijual.

---

**❓ Bagaimana jika bagi hasil/kesepakatan harga modal berubah di tengah jalan?**

Anda tidak dapat mengubah harga modal pada tanda terima yang sudah berstatus `received`. Buatlah dokumen tanda terima konsinyasi baru untuk batch barang titipan berikutnya dengan kesepakatan harga yang baru.

---

**❓ Bolehkah saya membayar sebagian saja (cicil) pada transaksi settlement?**

Saat ini settlement konsinyasi mencakup seluruh unpaid sales yang ditarik saat dokumen dibuat. Pelunasan dicatat sekaligus untuk total nominal settlement tersebut.

---

**❓ Ke mana larinya jurnal akuntansi untuk bagi hasil konsinyasi?**

Saat settlement berstatus `settled`, sistem otomatis mencatat pengeluaran kas/bank yang dipetakan ke akun biaya bagi hasil konsinyasi / HPP konsinyasi di modul keuangan.

---

*Dokumen terakhir diperbarui: Agustus 2026 — Morrus Digital Connecting*
