# MorrusPOS Frontend

Frontend untuk **MorrusPOS**, sistem POS dan manajemen operasional UMKM yang mencakup:

- transaksi kasir
- stok dan transfer cabang
- supplier dan purchase order
- utang usaha
- konsinyasi
- dashboard operasional
- customer ordering (storefront publik)

Saat ini frontend masih dalam tahap transformasi dari template **TailAdmin React** menjadi aplikasi MorrusPOS yang terintegrasi dengan backend ASP.NET Core.

![MorrusPOS Frontend Preview](./banner.png)

---

## Hak Akses Per Role

Sistem MorrusPOS menggunakan sistem berbasis **Role + Permission**. Setiap role memiliki kombinasi halaman yang bisa diakses dan aksi yang boleh dilakukan.

### Daftar Role

| Role | Keterangan |
|---|---|
| `Owner` | Pemilik usaha. Akses penuh ke seluruh sistem. |
| `Admin` | Administrator. Akses hampir penuh, setara Owner. |
| `KepalaCabang` | Kepala Cabang. Mengelola operasional kasir & stok cabang. |
| `Kasir` | Operator kasir. Fokus pada transaksi penjualan harian. |
| `Gudang` | Staff gudang. Fokus pada pengelolaan stok dan produk. |
| `Keuangan` | Staff keuangan. Fokus pada laporan, supplier, dan konsinyasi. |
| *(Publik)* | Pelanggan tanpa akun. Hanya bisa mengakses halaman Storefront. |

---

### Detail Akses Per Menu

#### 🏠 Dashboard
**Route:** `/dashboard`

| Role | Akses |
|---|---|
| Owner | ✅ |
| Admin | ✅ |
| KepalaCabang | ✅ |
| Kasir | ✅ |
| Gudang | ✅ |
| Keuangan | ✅ |

> Semua pengguna yang sudah login dapat melihat dashboard. Konten dashboard bisa berbeda tergantung role.

---

#### 🖥️ Sesi Kasir
**Route:** `/cashier/session`
**Permission:** `transaction.create`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Buka & tutup sesi kasir, lihat semua sesi |
| Admin | ✅ | Buka & tutup sesi kasir, lihat semua sesi |
| KepalaCabang | ✅ | Buka & tutup sesi kasir di cabangnya |
| Kasir | ✅ | Buka & tutup sesi kasir sendiri |
| Gudang | ❌ | — |
| Keuangan | ❌ | — |

---

#### 🛒 POS Kasir
**Route:** `/pos`
**Permission:** `transaction.create`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Input transaksi, pilih produk, checkout, cetak struk |
| Admin | ✅ | Input transaksi, pilih produk, checkout, cetak struk |
| KepalaCabang | ✅ | Input transaksi, pilih produk, checkout, cetak struk |
| Kasir | ✅ | Input transaksi, pilih produk, checkout, cetak struk |
| Gudang | ❌ | — |
| Keuangan | ❌ | — |

---

#### 📋 Transaksi (Riwayat)
**Route:** `/transactions`, `/transactions/:id`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Lihat semua transaksi, detail transaksi, void transaksi |
| Admin | ✅ | Lihat semua transaksi, detail transaksi, void transaksi |
| KepalaCabang | ✅ | Lihat transaksi cabang, detail transaksi |
| Kasir | ✅ | Lihat transaksi yang dibuat sendiri |
| Gudang | ❌ | — |
| Keuangan | ✅ | Lihat semua transaksi untuk keperluan laporan |

---

#### 📦 Produk
**Route:** `/products`, `/products/create`, `/products/:id/edit`
**Permission:** `product.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Lihat, tambah, edit, nonaktifkan produk |
| Admin | ✅ | Lihat, tambah, edit, nonaktifkan produk |
| KepalaCabang | ✅ | Lihat dan edit produk cabang |
| Kasir | ❌ | — |
| Gudang | ✅ | Lihat, tambah, edit produk (master data stok) |
| Keuangan | ❌ | — |

---

#### 🗂️ Kategori
**Route:** `/categories`
**Permission:** `product.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Lihat, tambah, edit, hapus kategori |
| Admin | ✅ | Lihat, tambah, edit, hapus kategori |
| KepalaCabang | ✅ | Lihat kategori |
| Kasir | ❌ | — |
| Gudang | ✅ | Lihat, tambah, edit kategori |
| Keuangan | ❌ | — |

---

#### 📊 Stok (Inventori)
**Route:** `/inventory`, `/stock-opnames`, `/stock-opnames/create`, `/stock-opnames/:id`
**Permission:** `stock.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Lihat stok, buat & lihat stock opname, audit stok |
| Admin | ✅ | Lihat stok, buat & lihat stock opname, audit stok |
| KepalaCabang | ✅ | Lihat stok cabang, buat stock opname cabang |
| Kasir | ❌ | — |
| Gudang | ✅ | Lihat stok, buat & kelola stock opname |
| Keuangan | ❌ | — |

---

#### 🔄 Transfer Stok
**Route:** `/stock-transfers/outgoing`, `/stock-transfers/incoming`, `/stock-transfers/:id`
**Permission:** `stock.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Buat & lihat transfer keluar, konfirmasi transfer masuk |
| Admin | ✅ | Buat & lihat transfer keluar, konfirmasi transfer masuk |
| KepalaCabang | ✅ | Lihat & konfirmasi transfer masuk ke cabang |
| Kasir | ❌ | — |
| Gudang | ✅ | Buat transfer keluar, konfirmasi transfer masuk |
| Keuangan | ❌ | — |

---

#### 🏭 Supplier
**Route:** `/suppliers`
**Permission:** `supplier.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Lihat, tambah, edit data supplier |
| Admin | ✅ | Lihat, tambah, edit data supplier |
| KepalaCabang | ❌ | — |
| Kasir | ❌ | — |
| Gudang | ❌ | — |
| Keuangan | ✅ | Lihat dan kelola data supplier |

---

#### 🧾 Purchase Order
**Route:** `/purchase-orders`, `/purchase-orders/create`, `/purchase-orders/:id`
**Permission:** `supplier.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Buat PO, lihat semua PO, approve PO, cetak dokumen |
| Admin | ✅ | Buat PO, lihat semua PO, approve PO, cetak dokumen |
| KepalaCabang | ❌ | — |
| Kasir | ❌ | — |
| Gudang | ❌ | — |
| Keuangan | ✅ | Buat PO, lihat semua PO, kelola pembayaran |

---

#### 💸 Utang Supplier
**Route:** `/supplier-debts`, `/supplier-debts/payments`
**Permission:** `supplier.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Lihat utang, catat pembayaran, lihat riwayat bayar |
| Admin | ✅ | Lihat utang, catat pembayaran, lihat riwayat bayar |
| KepalaCabang | ❌ | — |
| Kasir | ❌ | — |
| Gudang | ❌ | — |
| Keuangan | ✅ | Lihat utang, catat pembayaran, rekonsiliasi |

---

#### 📦 Konsinyasi
**Route:** `/consignments`, `/consignments/create`, `/consignments/:id`
**Permission:** `consignment.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Buat konsinyasi, lihat daftar, kelola status |
| Admin | ✅ | Buat konsinyasi, lihat daftar, kelola status |
| KepalaCabang | ❌ | — |
| Kasir | ❌ | — |
| Gudang | ❌ | — |
| Keuangan | ✅ | Buat konsinyasi, kelola dokumen & settlement |

---

#### 💼 Settlement Konsinyasi
**Route:** `/consignment-settlements`, `/consignment-settlements/:id`
**Permission:** `consignment.manage`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Lihat & proses settlement, cetak dokumen |
| Admin | ✅ | Lihat & proses settlement, cetak dokumen |
| KepalaCabang | ❌ | — |
| Kasir | ❌ | — |
| Gudang | ❌ | — |
| Keuangan | ✅ | Lihat & proses settlement, rekonsiliasi keuangan |

---

#### 👥 Pengguna (Manajemen Akun)
**Route:** `/users`, `/users/create`, `/users/:id/edit`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Tambah, edit, nonaktifkan pengguna, atur role |
| Admin | ✅ | Tambah, edit, nonaktifkan pengguna, atur role |
| KepalaCabang | ❌ | — |
| Kasir | ❌ | — |
| Gudang | ❌ | — |
| Keuangan | ❌ | — |

---

#### 🏬 Cabang (Outlets)
**Route:** `/outlets`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Owner | ✅ | Lihat, tambah, edit data cabang/outlet |
| Admin | ✅ | Lihat, tambah, edit data cabang/outlet |
| KepalaCabang | ❌ | — |
| Kasir | ❌ | — |
| Gudang | ❌ | — |
| Keuangan | ❌ | — |

---

#### 🔑 Ganti Password
**Route:** `/profile/change-password`

| Role | Akses | Yang Bisa Dilakukan |
|---|---|---|
| Semua Role | ✅ | Ganti password akun sendiri |

---

#### ☕ Storefront Pelanggan (Publik)
**Route:** `/shop/...`

Halaman ini **tidak memerlukan login**. Dapat diakses oleh siapa saja melalui browser.

| Halaman | Route | Fungsi |
|---|---|---|
| Landing Page | `/shop` | Tampilan selamat datang, pilih outlet atau lanjutkan pesanan |
| Pilih Outlet | `/shop/outlets` | Daftar outlet yang tersedia untuk dipesan |
| Menu | `/shop/o/:outletCode/menu` | Katalog produk dengan filter kategori & pencarian |
| Detail Produk | `/shop/o/:outletCode/products/:productId` | Detail produk, input catatan, pilih jumlah, tambah ke keranjang |
| Keranjang | `/shop/o/:outletCode/cart` | Review item belanja, edit kuantitas, hapus item |
| Checkout | `/shop/o/:outletCode/checkout` | Isi data diri (nama, telepon), pilih metode pemesanan (pickup/dine-in/delivery) |
| Status Pesanan | `/shop/o/:outletCode/orders/:orderId` | Tracking status pengerjaan pesanan, nomor invoice, tombol WhatsApp kasir |

---

### Ringkasan Akses per Role

| Menu | Owner | Admin | KepalaCabang | Kasir | Gudang | Keuangan |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sesi Kasir | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| POS Kasir | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Transaksi | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Produk | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Kategori | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Stok & Opname | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Transfer Stok | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Supplier | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Purchase Order | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Utang Supplier | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Konsinyasi | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Settlement Konsinyasi | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Pengguna | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cabang | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ganti Password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Storefront | *(publik)* | *(publik)* | *(publik)* | *(publik)* | *(publik)* | *(publik)* |

---

## Status Project

Kondisi saat ini:

- basis UI masih menggunakan template TailAdmin
- struktur frontend baru berbasis feature mulai disiapkan
- backend aktif sudah tersedia sampai **Fase 6**
- frontend sedang disiapkan untuk mengikuti roadmap MorrusPOS
- storefront customer ordering sudah tersedia di `/shop`

Artinya, project ini belum final sebagai produk operasional penuh, tetapi pondasi untuk migrasi modul sudah mulai dibangun.

## Fitur Utama yang Telah Diimplementasikan

Aplikasi frontend ini telah terintegrasi penuh dengan backend untuk modul-modul bisnis berikut:

### 1. Sesi Shift Kasir (Shift Control) & Kas Kecil (Petty Cash)
- **Reconciliation Dashboard**: Tampilan visual di `/cashier/session` yang membandingkan Modal Awal, Penjualan Tunai, Pengeluaran Kas Kecil, dan Estimasi Uang di Laci (*Expected Cash*).
- **Ringkasan Non-Tunai**: Detail penerimaan non-cash (seperti QRIS, EDC, atau Transfer Bank) disajikan terpisah untuk mempermudah pencocokan EDC fisik saat closing.
- **Petty Cash Logger**: Form penginputan kas keluar (ATK, Konsumsi, Operasional, dll) yang langsung memotong saldo kas laci POS aktif dan mencatat histori pengeluaran per sesi.
- **Live Variance Calculator**: Input nominal uang fisik laci kas secara interaktif yang menghitung otomatis selisih kas (*Variance*) dengan notifikasi status (Pas/Cocok, Selisih Lebih, Selisih Kurang).

---

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- ApexCharts
- FullCalendar

## Struktur Project

Struktur lama TailAdmin masih ada untuk referensi dan migrasi bertahap. Struktur baru MorrusPOS yang sedang dipakai:

```text
frontend/
├── docs/
├── public/
├── src/
│   ├── app/
│   │   ├── guards/
│   │   ├── providers/
│   │   └── router/
│   ├── api/
│   │   ├── client/
│   │   ├── modules/
│   │   └── types/
│   ├── components/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── tables/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── pos/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── inventory/
│   │   ├── suppliers/
│   │   ├── purchase-orders/
│   │   ├── debts/
│   │   ├── consignments/
│   │   ├── users/
│   │   └── outlets/
│   ├── storefront/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── components/
│   │   ├── api/
│   │   └── features/
│   │       ├── landing/
│   │       ├── outlets/
│   │       ├── catalog/
│   │       ├── cart/
│   │       ├── checkout/
│   │       └── orders/
│   ├── hooks/
│   ├── lib/
│   ├── styles/
│   └── utils/
├── package.json
└── vite.config.ts
```

Referensi tambahan:

- [docs/frontend_roadmap.md](./docs/frontend_roadmap.md)
- [src/structure.md](./src/structure.md)

## Setup Development

### Prasyarat

- Node.js 18 atau lebih baru
- npm

### Install dependency

```bash
npm install
```

### Jalankan development server

```bash
npm run dev
```

Secara default aplikasi akan berjalan di:

```text
http://localhost:5173
```

Backend ASP.NET Core harus berjalan terlebih dahulu (default port 5000 / 7000).

### Build production

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Automation testing dengan Playwright

Frontend ini sekarang sudah punya fondasi E2E testing berbasis **Playwright**.

Perintah yang tersedia:

```bash
npm run test:e2e
```

```bash
npm run test:e2e:headed
```

```bash
npm run test:e2e:ui
```

Catatan implementasi saat ini:

- test berjalan terhadap frontend Vite lokal
- backend di-mock di level network request agar suite stabil
- helper mock berada di `tests/e2e/fixtures/`
- suite awal mencakup:
  - auth guard guest ke `/signin`
  - login sukses ke dashboard shell
  - owner wajib pilih outlet sebelum listing produk dimuat

## Integrasi Backend

Frontend ini akan terhubung ke backend MorrusPOS berbasis ASP.NET Core.

Rencana integrasi utamanya:

- login dan refresh token
- request API terpusat
- context user, role, dan outlet
- proteksi route berbasis auth dan permission
- checkout POS
- update stok real-time via SignalR

Untuk demo awal, target minimum yang harus bisa berjalan:

1. membuat order manual tanpa integrasi GrabFood/GoFood/ShopeeFood
2. stok berkurang secara real-time setelah checkout

Backend untuk kebutuhan demo tersebut sudah tersedia.

## Roadmap Implementasi Frontend

Urutan kerja yang direkomendasikan:

1. fondasi app, router, providers, API client
2. auth flow dan route guard
3. produk dan kategori
4. POS kasir dan sesi kasir
5. inventory, opname, dan transfer
6. supplier, PO, utang
7. konsinyasi
8. dashboard dan integrasi online order

Roadmap lengkap ada di:

- [docs/frontend_roadmap.md](./docs/frontend_roadmap.md)

## Catatan Migrasi dari TailAdmin

Template TailAdmin dipakai sebagai starting point visual, tetapi:

- route demo generik akan dibersihkan bertahap
- halaman bisnis MorrusPOS akan menggantikan halaman demo template
- komponen lama hanya dipertahankan selama masih berguna

Jadi repo ini bukan lagi template umum, melainkan sedang diarahkan menjadi frontend khusus MorrusPOS.

## Git Workflow Singkat

Jika repo frontend ini berdiri sendiri:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin <url-repository>
git push -u origin main
```

Jika `git push` gagal dengan pesan `src refspec main does not match any`, biasanya penyebabnya karena belum ada commit pertama.

## License

Project ini mengikuti lisensi yang berlaku pada file [LICENSE.md](./LICENSE.md).
