# 📘 Panduan Pengguna: Skenario 2 — Pengadaan & Retur Barang

**Morrus POS · Panduan Staf Gudang & Administrator**

> Dokumen ini menjelaskan secara lengkap proses pengadaan barang dari supplier — mulai dari pendaftaran supplier, pembuatan Purchase Order (PO), penerimaan barang di gudang, hingga proses retur barang ke supplier. Pastikan **Skenario 1 (Pengaturan Awal)** sudah diselesaikan sebelum memulai skenario ini.

---

## 📋 Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Manajemen Supplier (CRUD Lengkap)](#2-manajemen-supplier-crud-lengkap)
   - [2.1 Mendaftarkan Supplier Baru](#21-mendaftarkan-supplier-baru)
   - [2.2 Melihat Daftar Supplier](#22-melihat-daftar-supplier)
   - [2.3 Mengedit Data Supplier](#23-mengedit-data-supplier)
   - [2.4 Menonaktifkan Supplier](#24-menonaktifkan-supplier)
3. [Purchase Order / PO (CRUD & Alur Lengkap)](#3-purchase-order--po-crud--alur-lengkap)
   - [3.1 Membuat Purchase Order Baru](#31-membuat-purchase-order-baru)
   - [3.2 Tipe Pembayaran PO](#32-tipe-pembayaran-po)
   - [3.3 Melihat Daftar PO](#33-melihat-daftar-po)
   - [3.4 Melihat Detail PO](#34-melihat-detail-po)
   - [3.5 Siklus Status PO](#35-siklus-status-po)
   - [3.6 Mengubah Status PO Manual](#36-mengubah-status-po-manual)
4. [Penerimaan Barang di Gudang (Receive Goods)](#4-penerimaan-barang-di-gudang-receive-goods)
   - [4.1 Penerimaan Penuh (Full Receive)](#41-penerimaan-penuh-full-receive)
   - [4.2 Penerimaan Sebagian (Partial Receive)](#42-penerimaan-sebagian-partial-receive)
5. [Retur Barang ke Supplier (Supplier Return)](#5-retur-barang-ke-supplier-supplier-return)
   - [5.1 Membuat Retur Supplier Baru](#51-membuat-retur-supplier-baru)
   - [5.2 Melihat Daftar Retur](#52-melihat-daftar-retur)
   - [5.3 Mengedit Retur (Draft)](#53-mengedit-retur-draft)
   - [5.4 Siklus Status Retur](#54-siklus-status-retur)
6. [Manajemen Utang Supplier (Supplier Debts)](#6-manajemen-utang-supplier-supplier-debts)
7. [Verifikasi Skenario Selesai](#7-verifikasi-skenario-selesai)
8. [Pertanyaan Umum (FAQ)](#8-pertanyaan-umum-faq)

---

## 1. Prasyarat

Sebelum memulai skenario pengadaan, pastikan kondisi berikut sudah terpenuhi:

| Prasyarat | Status yang Diharapkan |
|-----------|------------------------|
| Outlet / Cabang sudah dibuat | ✅ Ada minimal 1 outlet aktif |
| Konteks outlet di navbar sudah dipilih | ✅ Bukan "Semua Cabang" — pilih outlet spesifik |
| Akun COA wajib sudah dibuat | ✅ Minimal `1101 - Persediaan`, `2001 - Utang Dagang` |
| Login sebagai | ✅ **Owner**, **Admin**, atau **Gudang** |
| Produk yang ingin dipesan sudah terdaftar di sistem | ✅ Ada di menu **Produk** |

> [!IMPORTANT]
> Jika produk yang ingin dipesan belum terdaftar, buat terlebih dahulu melalui menu **Produk** → **Tambah Produk** sebelum membuat Purchase Order.

---

## 2. Manajemen Supplier (CRUD Lengkap)

**Supplier** adalah vendor atau pemasok barang yang bekerja sama dengan bisnis Anda. Setiap PO harus terhubung ke supplier yang sudah terdaftar.

### 2.1 Mendaftarkan Supplier Baru

**Lokasi menu:** `Pembelian & Supplier` → `Supplier`

**Langkah-langkah:**

1. Buka menu **Pembelian & Supplier** di sidebar kiri.
2. Klik sub-menu **Supplier**.
3. Klik tombol **➕ Tambah Supplier** di pojok kanan atas.
4. Isi formulir berikut:

| Kolom | Keterangan | Contoh | Wajib? |
|-------|------------|--------|--------|
| **Nama Supplier** | Nama resmi perusahaan/individu pemasok. | `PT Multi Pemasok Demo` | ✅ Ya |
| **Nama Kontak** | Nama PIC (Person in Charge) yang bisa dihubungi. | `Budi Santoso` | ❌ Opsional |
| **Nomor Telepon** | Nomor HP atau telepon kantor supplier. | `081234567890` | ❌ Opsional |
| **Email** | Alamat email supplier untuk korespondensi. | `budi@multipemasok.co.id` | ❌ Opsional |
| **Alamat** | Alamat lengkap gudang atau kantor supplier. | `Jl. Industri No. 5, Sidoarjo` | ❌ Opsional |

5. Klik **Simpan**.
6. Supplier baru langsung muncul di tabel daftar supplier dengan status **Aktif**.

---

### 2.2 Melihat Daftar Supplier

**Lokasi menu:** `Pembelian & Supplier` → `Supplier`

Tabel daftar supplier menampilkan kolom:

| Kolom | Keterangan |
|-------|------------|
| **Nama** | Nama lengkap supplier |
| **Kontak** | Nama PIC supplier |
| **Telepon** | Nomor kontak |
| **Email** | Alamat email |
| **Status** | Aktif (hijau) / Nonaktif (abu-abu) |
| **Aksi** | Tombol Edit |

---

### 2.3 Mengedit Data Supplier

1. Buka menu **Pembelian & Supplier** → **Supplier**.
2. Temukan supplier yang ingin diubah.
3. Klik ikon **✏️ Edit** pada baris supplier tersebut.
4. Ubah data yang perlu diperbarui (Nama, Kontak, Telepon, Email, Alamat).
5. Klik **Simpan**.

---

### 2.4 Menonaktifkan Supplier

Supplier tidak dapat dihapus permanen untuk menjaga integritas data PO historis.

1. Buka menu **Pembelian & Supplier** → **Supplier**.
2. Klik **✏️ Edit** pada supplier yang ingin dinonaktifkan.
3. Hilangkan centang pada **"Status Aktif"** / **"Supplier Aktif"**.
4. Klik **Simpan**.
5. Supplier tidak akan muncul lagi di dropdown pilihan supplier saat membuat PO baru.

> [!WARNING]
> Menonaktifkan supplier tidak akan membatalkan PO yang sudah aktif berjalan untuk supplier tersebut.

---

## 3. Purchase Order / PO (CRUD & Alur Lengkap)

**Purchase Order (PO)** adalah dokumen pemesanan resmi yang dikirim ke supplier untuk meminta pengiriman barang. Setiap PO yang diselesaikan (`completed`) akan **otomatis menambah stok** produk di gudang dan **mencatat jurnal** utang dagang.

### 3.1 Membuat Purchase Order Baru

**Lokasi menu:** `Pembelian & Supplier` → `Purchase Order` → Klik **➕ Buat PO**

**Langkah-langkah:**

**Bagian Header PO:**

| Kolom | Keterangan | Contoh | Wajib? |
|-------|------------|--------|--------|
| **Supplier** | Pilih supplier dari dropdown. Hanya supplier aktif yang muncul. | `PT Multi Pemasok Demo` | ✅ Ya |
| **Tipe Pembayaran** | Pilih skema pembayaran ke supplier (lihat §3.2). | `Cash` | ✅ Ya |
| **Tanggal Jatuh Tempo** | Muncul otomatis jika tipe = **Tempo**. Isi tanggal kapan tagihan harus dilunasi. | `2026-09-15` | ✅ (jika Tempo) |

**Bagian Item PO (Tabel Produk):**

Untuk setiap produk yang ingin dipesan:

| Kolom | Keterangan | Contoh |
|-------|------------|--------|
| **Produk** | Pilih produk dari dropdown. | `Kopi Susu Gula Aren` |
| **Kuantitas (Qty)** | Jumlah unit yang dipesan. | `100` |
| **Harga Beli per Unit** | Harga satuan pembelian dari supplier (bukan harga jual). | `10000` |

- Klik **➕ Tambah Baris** untuk menambah produk lain ke dalam PO yang sama.
- Klik ikon **🗑 Hapus** di setiap baris untuk menghapus item.
- **Total PO** dihitung otomatis: `Qty × Harga Beli`.

**Setelah selesai mengisi:**
1. Klik **Simpan PO** (atau **Konfirmasi**).
2. Sistem akan menampilkan dialog konfirmasi — klik **Proses**.
3. PO berhasil dibuat dengan status **`draft`** dan nomor PO otomatis (contoh: `PO-20260819-001`).
4. Anda akan diarahkan ke halaman **Detail PO** secara otomatis.

> [!NOTE]
> Nomor PO dibuat otomatis oleh sistem menggunakan format `PO-YYYYMMDD-NNN`. Nomor ini unik dan tidak bisa diubah secara manual.

---

### 3.2 Tipe Pembayaran PO

Saat membuat PO, pilih salah satu dari tiga tipe pembayaran berikut:

| Tipe | Nama | Keterangan | Dampak ke Sistem |
|------|------|------------|-----------------|
| `cash` | **Cash / Tunai** | Pembayaran dilakukan langsung saat barang diterima. | Tidak membuat utang dagang. |
| `tempo` | **Tempo / Kredit** | Pembayaran dilakukan di kemudian hari sesuai tanggal jatuh tempo. | Membuat **Utang Dagang** yang bisa dilihat di menu **Utang Supplier**. |
| `consignment` | **Konsinyasi** | Barang dititip oleh supplier untuk dijual. Pembayaran ke supplier setelah barang terjual. | Stok bertambah namun tidak membuat utang dagang langsung. |

> [!IMPORTANT]
> Pilih tipe pembayaran dengan hati-hati karena **tidak bisa diubah** setelah PO disimpan. Jika keliru, batalkan PO dan buat ulang.

---

### 3.3 Melihat Daftar PO

**Lokasi menu:** `Pembelian & Supplier` → `Purchase Order`

Tabel daftar PO menampilkan:

| Kolom | Keterangan |
|-------|------------|
| **Nomor PO** | Kode dokumen unik |
| **Tanggal PO** | Tanggal PO dibuat |
| **Supplier** | Nama pemasok |
| **Outlet** | Cabang yang memesan |
| **Tipe Pembayaran** | Cash / Tempo / Konsinyasi |
| **Total** | Nilai total PO dalam Rupiah |
| **Status** | Status saat ini (lihat §3.5) |
| **Aksi** | Tombol Detail |

Anda dapat menggunakan **filter** di atas tabel untuk menyaring PO berdasarkan outlet atau status tertentu.

---

### 3.4 Melihat Detail PO

1. Di tabel daftar PO, klik baris PO yang ingin dilihat (atau klik tombol **Detail**).
2. Halaman detail PO menampilkan:
   - **Informasi header**: Nomor PO, tanggal, supplier, outlet, tipe pembayaran, status.
   - **Tabel item**: Daftar produk, qty dipesan, qty sudah diterima, harga, dan total.
   - **Total tagihan keseluruhan**.
   - **Tombol aksi** sesuai status PO saat ini.

---

### 3.5 Siklus Status PO

Setiap PO melewati tahapan status berikut:

```
[draft] ──► [pending] ──► [partially_received] ──► [completed]
              │                                           │
              └───────────────────────────────────► [cancelled]
```

| Status | Warna | Arti | Yang Bisa Dilakukan |
|--------|-------|------|---------------------|
| `draft` | Abu-abu | PO baru dibuat, belum dikirim ke supplier | Kirim ke pending, atau batalkan |
| `pending` | Kuning | PO sudah dikirim, menunggu barang datang | Terima barang (Receive), Selesaikan, atau batalkan |
| `partially_received` | Kuning | Barang baru diterima sebagian | Terima sisa barang, atau selesaikan |
| `completed` | Hijau | Semua barang sudah diterima, stok sudah bertambah | *(tidak ada aksi lanjutan)* |
| `cancelled` | Merah | PO dibatalkan | *(tidak ada aksi lanjutan)* |

> [!NOTE]
> **Stok gudang hanya bertambah** ketika PO berstatus `completed`. PO dengan status `draft` atau `pending` belum memengaruhi stok sama sekali.

---

### 3.6 Mengubah Status PO Manual

Dari halaman **Detail PO**, tombol aksi yang tersedia bergantung pada status PO saat ini:

| Status Saat Ini | Tombol yang Tersedia |
|-----------------|----------------------|
| `draft` | Kirim ke Pending · Selesaikan PO · Batalkan PO |
| `pending` | Terima Barang · Selesaikan PO · Batalkan PO |
| `partially_received` | Terima Barang · Selesaikan PO · Batalkan PO |
| `completed` | *(tidak ada)* |
| `cancelled` | *(tidak ada)* |

**Cara mengubah status:**
1. Buka halaman Detail PO.
2. Klik tombol aksi yang diinginkan (misalnya **"Kirim ke Pending"**).
3. Dialog konfirmasi akan muncul.
4. Klik **Proses Status** untuk mengonfirmasi.

> [!WARNING]
> Status `cancelled` bersifat **final** — PO yang sudah dibatalkan tidak bisa diaktifkan kembali. Buat PO baru jika diperlukan.

---

## 4. Penerimaan Barang di Gudang (Receive Goods)

Penerimaan barang adalah proses memverifikasi barang yang datang dari supplier secara fisik dan mencatatnya ke sistem. Proses ini akan **menambah stok** produk di gudang.

**Prasyarat:** PO harus berstatus `pending` atau `partially_received`.

### 4.1 Penerimaan Penuh (Full Receive)

Digunakan ketika semua barang yang dipesan datang sekaligus dan dalam kondisi lengkap.

**Langkah-langkah:**

1. Buka menu **Pembelian & Supplier** → **Purchase Order**.
2. Temukan PO yang barangnya sudah tiba (status: `pending`).
3. Klik baris PO untuk membuka halaman **Detail PO**.
4. Klik tombol **📦 Terima Barang**.
5. Anda diarahkan ke halaman **Penerimaan Barang**. Tabel menampilkan:
   - **Nama Produk & SKU**
   - **Qty Dipesan** — total qty dari PO
   - **Sudah Diterima** — qty yang sudah pernah diterima sebelumnya
   - **Qty Diterima Sekarang** — input angka yang perlu Anda isi

6. Untuk penerimaan penuh, nilai **Qty Diterima Sekarang** sudah terisi otomatis dengan sisa qty yang belum diterima. Tidak perlu mengubahnya.
7. Klik **✅ Konfirmasi Penerimaan**.
8. Sistem memproses dan:
   - Stok produk di gudang **bertambah** sesuai qty yang diterima.
   - Status PO berubah menjadi **`completed`** (jika semua item sudah penuh diterima).
   - Jurnal akuntansi **otomatis dibuat**: `Debit Persediaan, Kredit Utang Dagang` (untuk PO bertipe Tempo) atau `Debit Persediaan, Kredit Kas` (untuk PO Cash).

---

### 4.2 Penerimaan Sebagian (Partial Receive)

Digunakan ketika barang dari supplier datang bertahap atau ada sebagian yang belum dikirim.

**Langkah-langkah:**

1. Ikuti langkah 1–5 dari §4.1.
2. Pada kolom **Qty Diterima Sekarang**, ubah angka menjadi jumlah yang benar-benar datang secara fisik saat ini.
   - Contoh: Dipesan `100 pcs`, yang datang baru `60 pcs` → isi `60`.
   - Qty yang diisi **tidak boleh melebihi sisa yang belum diterima**. Sistem akan menampilkan pesan error jika melebihi batas.
3. Klik **✅ Konfirmasi Penerimaan**.
4. Status PO berubah menjadi **`partially_received`** (kuning).
5. Stok bertambah sebesar qty yang baru diterima (`60 pcs`).
6. Saat sisa barang (`40 pcs`) datang kemudian, ulangi proses penerimaan dari Detail PO → **Terima Barang** kembali.

> [!TIP]
> Anda bisa memeriksa histori penerimaan di halaman Detail PO pada kolom **"Sudah Diterima"** per item. Ini membantu memverifikasi berapa qty yang sudah masuk dan berapa yang masih belum.

---

## 5. Retur Barang ke Supplier (Supplier Return)

**Retur Supplier** digunakan ketika ada barang yang diterima dalam kondisi rusak, cacat, atau tidak sesuai spesifikasi dan perlu dikembalikan ke supplier.

> [!IMPORTANT]
> Retur hanya bisa dilakukan untuk barang yang sudah **pernah diterima** dari PO yang sudah `completed` atau `partially_received`. Anda tidak bisa meretur barang dari PO yang belum diterima.

### 5.1 Membuat Retur Supplier Baru

**Lokasi menu:** `Pembelian & Supplier` → `Supplier Return` → Klik **➕ Buat Retur Supplier**

**Langkah-langkah:**

**Bagian Header Retur:**

| Kolom | Keterangan | Contoh | Wajib? |
|-------|------------|--------|--------|
| **Supplier** | Pilih supplier dari dropdown. | `PT Multi Pemasok Demo` | ✅ Ya |
| **Purchase Order** | Pilih nomor PO asal barang yang ingin diretur. Hanya PO dari supplier yang dipilih yang muncul. | `PO-20260819-001` | ✅ Ya |
| **Tanggal Retur** | Tanggal barang dikembalikan secara fisik ke supplier. | `2026-08-20` | ✅ Ya |
| **Catatan / Alasan** | Keterangan singkat alasan retur (wajib untuk dokumentasi). | `5 pcs kemasan bocor/rusak` | ❌ Opsional |

**Bagian Item Retur:**

Setelah PO dipilih, sistem otomatis menampilkan daftar produk dari PO tersebut beserta **qty yang eligible diretur** (qty yang pernah diterima).

| Kolom | Keterangan |
|-------|------------|
| **Produk** | Nama produk dari PO |
| **SKU** | Kode produk |
| **Maks. Qty Retur** | Jumlah maksimum yang bisa diretur (= qty yang sudah pernah diterima) |
| **Qty Retur** | Input jumlah yang ingin dikembalikan. Tidak boleh melebihi maks. |

- Isi **Qty Retur** hanya untuk produk yang bermasalah. Produk lain bisa dikosongkan (0).

**Setelah selesai:**
1. Klik **Simpan Retur**.
2. Retur berhasil dibuat dengan nomor retur otomatis (contoh: `RTN-20260819-001`).
3. Stok produk di gudang **berkurang** otomatis sebesar qty retur.

---

### 5.2 Melihat Daftar Retur

**Lokasi menu:** `Pembelian & Supplier` → `Supplier Return`

| Kolom | Keterangan |
|-------|------------|
| **Nomor Retur** | Kode dokumen retur unik |
| **Tanggal** | Tanggal retur dibuat |
| **Supplier** | Pemasok yang diretur |
| **Nomor PO** | PO asal barang |
| **Outlet** | Cabang asal barang |
| **Total** | Nilai total barang yang diretur |
| **Status** | Status retur saat ini |
| **Dibuat Oleh** | Nama pengguna yang membuat retur |
| **Aksi** | Tombol Detail |

---

### 5.3 Mengedit Retur (Draft)

Retur yang berstatus `draft` masih dapat diedit sebelum dikonfirmasi.

1. Buka halaman **Detail Retur**.
2. Klik tombol **✏️ Edit**.
3. Ubah tanggal retur, catatan, atau qty item yang ingin diretur.
4. Klik **Simpan**.

> [!NOTE]
> Setelah retur dikonfirmasi (status `confirmed` atau lebih lanjut), data retur **tidak bisa diedit** lagi.

---

### 5.4 Siklus Status Retur

```
[draft] ──► [confirmed] ──► [completed]
              │
              └──────────► [cancelled]
```

| Status | Arti |
|--------|------|
| `draft` | Retur dibuat, belum dikonfirmasi |
| `confirmed` | Retur sudah dikonfirmasi dan diproses |
| `completed` | Proses retur selesai |
| `cancelled` | Retur dibatalkan |

---

## 6. Manajemen Utang Supplier (Supplier Debts)

Setiap PO dengan tipe pembayaran **Tempo** akan secara otomatis menciptakan **Utang Dagang** kepada supplier. Utang ini harus dilunasi sebelum tanggal jatuh tempo.

**Lokasi menu:** `Pembelian & Supplier` → `Utang Supplier`

### Melihat Daftar Utang

Halaman ini menampilkan seluruh utang yang belum lunas ke masing-masing supplier:

| Kolom | Keterangan |
|-------|------------|
| **Supplier** | Nama pemasok |
| **Nomor PO** | PO yang menimbulkan utang |
| **Total Tagihan** | Nilai PO yang harus dibayar |
| **Sudah Dibayar** | Jumlah yang sudah dilunasi |
| **Sisa Utang** | Nilai yang masih belum dibayar |
| **Jatuh Tempo** | Tanggal batas pembayaran |
| **Status** | `unpaid` (merah), `partially_paid` (kuning), `paid` (hijau) |

### Melakukan Pembayaran Utang

1. Di tabel daftar utang, klik **Detail** pada utang yang ingin dibayar.
2. Di halaman detail, klik tombol **💳 Bayar Utang** (atau **Catat Pembayaran**).
3. Isi formulir pembayaran:
   - **Nominal Pembayaran** — jumlah yang dibayarkan (bisa sebagian atau penuh).
   - **Akun Pembayaran** — pilih akun bank/kas yang digunakan membayar.
   - **Tanggal Pembayaran** — tanggal transfer/pembayaran dilakukan.
   - **Referensi** — nomor bukti transfer (opsional tapi direkomendasikan).
4. Klik **Simpan Pembayaran**.
5. Status utang akan berubah menjadi `partially_paid` atau `paid` tergantung jumlahnya.

> [!TIP]
> Pembayaran utang bisa dilakukan **berkali-kali secara bertahap** (cicilan) hingga saldo utang menjadi nol dan status menjadi `paid`.

---

## 7. Verifikasi Skenario Selesai

Gunakan checklist berikut untuk memastikan semua proses berjalan dengan benar:

| Status | Yang Perlu Diverifikasi |
|--------|------------------------|
| ☐ | Supplier baru muncul di daftar **Supplier** dengan status Aktif |
| ☐ | PO berhasil dibuat dengan nomor otomatis (format `PO-YYYYMMDD-NNN`) |
| ☐ | Status PO berubah dari `draft` → `pending` setelah dikonfirmasi |
| ☐ | Proses **Terima Barang** berhasil → status PO menjadi `completed` |
| ☐ | Stok produk di menu **Inventori** bertambah sesuai qty yang diterima |
| ☐ | Jika tipe PO = Tempo, utang muncul di menu **Utang Supplier** |
| ☐ | Retur Supplier berhasil dibuat → stok berkurang sesuai qty retur |
| ☐ | Di menu **Keuangan → Integrasi Akuntansi**, PO yang `completed` berstatus **"Sudah terjurnal"** |

---

## 8. Pertanyaan Umum (FAQ)

**❓ Bisakah satu PO memesan dari beberapa supplier sekaligus?**

Tidak. Satu PO hanya bisa dibuat untuk **satu supplier**. Jika ingin memesan dari 2 supplier berbeda, buat 2 PO terpisah.

---

**❓ Apakah stok langsung bertambah saat PO dibuat?**

Tidak. Stok **hanya bertambah** setelah proses **Penerimaan Barang (Receive Goods)** dikonfirmasi. PO yang masih berstatus `draft` atau `pending` belum memengaruhi stok sama sekali.

---

**❓ Bolehkah saya menerima barang lebih dari qty yang dipesan?**

Tidak. Sistem akan menampilkan **pesan error** jika qty yang diinput melebihi sisa qty yang belum diterima dari PO. Jika ada kelebihan pengiriman dari supplier, buat PO baru untuk menampungnya.

---

**❓ Apakah retur bisa dilakukan tanpa ada PO sebelumnya?**

Tidak. Setiap retur **wajib terhubung** ke PO asal. Ini untuk memastikan traceability (keterlacakan) produk yang dikembalikan.

---

**❓ Apa yang terjadi dengan jurnal akuntansi jika PO dibatalkan?**

Jika PO dibatalkan sebelum ada penerimaan barang, tidak ada jurnal yang terbentuk. Jika PO dibatalkan setelah penerimaan sebagian, sistem akan membalik (reverse) jurnal sesuai penerimaan yang sudah terjadi.

---

*Dokumen terakhir diperbarui: Agustus 2026 — Morrus Digital Connecting*
