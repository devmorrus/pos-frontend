# 📘 Panduan Pengguna: Skenario 4 — Operasional Kasir & Penjualan POS

**Morrus POS · Panduan Kasir & Supervisor Outlet**

> Dokumen ini menjelaskan secara lengkap alur operasional penjualan harian di kasir POS — mulai dari pembukaan sesi (shift), pelayanan transaksi pelanggan (tunai & non-tunai), pencatatan pengeluaran operasional kecil dari kas laci, hingga penutupan sesi disertai rekonsiliasi kas (selisih uang fisik vs sistem).

---

## 📋 Daftar Isi

1. [Prasyarat](#1-prasyarat)
2. [Membuka Sesi Kasir & Modal Awal (Shift Opening)](#2-membuka-sesi-kasir--modal-awal-shift-opening)
3. [Transaksi Penjualan di POS (POS Checkout)](#3-transaksi-penjualan-di-pos-pos-checkout)
   - [3.1 Menambahkan Produk ke Keranjang](#31-menambahkan-produk-ke-keranjang)
   - [3.2 Mengelola Item di Keranjang (Qty Stepper & Diskon)](#32-mengelola-item-di-keranjang-qty-stepper--diskon)
   - [3.3 Mengaitkan Data Pelanggan](#33-mengaitkan-data-pelanggan)
   - [3.4 Menggunakan Kode Voucher](#34-menggunakan-kode-voucher)
   - [3.5 Simulasi Pembayaran Tunai & Kembalian](#35-simulasi-pembayaran-tunai--kembalian)
   - [3.6 Simulasi Pembayaran Non-Tunai (QRIS, EDC, Transfer)](#36-simulasi-pembayaran-non-tunai-qris-edc-transfer)
   - [3.7 Cetak Struk / Invoice](#37-cetak-struk--invoice)
4. [Pencatatan Kas Kecil (Petty Cash Expense)](#4-pencatatan-kas-kecil-petty-cash-expense)
5. [Menutup Sesi Kasir & Rekonsiliasi Kas (Shift Closing)](#5-menutup-sesi-kasir--rekonsiliasi-kas-shift-closing)
6. [Verifikasi Skenario Selesai](#6-verifikasi-skenario-selesai)
7. [Pertanyaan Umum (FAQ)](#7-pertanyaan-umum-faq)

---

## 1. Prasyarat

Sebelum kasir mulai melayani pelanggan, pastikan kondisi berikut sudah terpenuhi:

| Prasyarat | Status yang Diharapkan |
|-----------|------------------------|
| Stok Produk Tersedia | ✅ Produk sudah di-input dan memiliki stok aktif (dari Skenario 2 atau 3). |
| Akun Kasir Aktif | ✅ Pengguna login dengan peran **Kasir**, **Admin**, atau **Owner**. |
| Laci Kas Fisik Siap | ✅ Uang kertas recehan untuk modal awal kembalian sudah dihitung manual. |

---

## 2. Membuka Sesi Kasir & Modal Awal (Shift Opening)

Sesi Kasir berfungsi membatasi pencatatan uang tunai agar tidak bercampur antar-kasir atau antar-shift. Kasir **tidak dapat mengakses** layar POS sebelum sesi dibuka.

**Lokasi menu:** `Penjualan` → `Sesi Kasir` (atau akses langsung ke halaman `/cashier/session`)

**Langkah-langkah:**

1. Masuk ke halaman **Sesi Kasir**.
2. **Pilih Outlet Kerja** (Khusus Owner):
   - Jika Anda login sebagai *Owner*, pilih nama outlet aktif dari dropdown (misal: `Cabang Demo Utama`).
   - Jika login sebagai *Kasir/Admin*, sistem otomatis mengunci outlet sesuai cabang tempat Anda bekerja.
3. Di panel **Buka Sesi Baru**, isi kolom berikut:

| Kolom | Keterangan | Contoh Nilai | Wajib? |
|-------|------------|--------------|--------|
| **Kas Awal** | Jumlah uang fisik receh di dalam laci kasir saat shift dimulai (untuk kembalian). | `200000` | ✅ Ya |

4. Klik tombol **Buka Sesi**.
5. Sistem memproses pembukaan sesi. Setelah sukses, Anda akan dialihkan secara otomatis ke halaman **POS Kasir** (`/pos`).

> [!NOTE]
> Satu pengguna hanya boleh memiliki satu sesi aktif dalam satu waktu. Jika ada sesi yang belum ditutup dari shift sebelumnya, sistem akan meminta Anda menyelesaikan sesi tersebut terlebih dahulu.

---

## 3. Transaksi Penjualan di POS (POS Checkout)

Layar POS dirancang dengan layout modern vertikal portrait agar kasir dapat memproses transaksi dengan cepat.

### 3.1 Menambahkan Produk ke Keranjang

**Lokasi menu:** `/pos` (Katalog)

1. **Cari Produk**: Gunakan kotak pencarian di bagian atas. Ketik nama produk, SKU, atau lakukan scan barcode produk langsung menggunakan scanner.
2. **Tambah Produk**: Klik card/kotak produk yang diinginkan.
   - **Quantity Badge (Badge Jumlah)**: Di pojok kiri atas gambar produk akan muncul badge jumlah (misal: `1×`, `2×`, `3×` dst.) yang menunjukkan berapa kali produk tersebut telah diklik (ditambahkan ke keranjang).
   - **Indikator Grid**: Produk yang ada di keranjang ditandai dengan border warna brand yang menyala di sekelilingnya.
   - **Stok Habis**: Produk dengan stok `0` otomatis berwarna abu-abu (grayscale) dan tidak dapat diklik.
3. Jika produk memiliki variasi (misal ukuran Kecil/Besar) atau topping tambahan, sebuah **modal pilihan varian** akan otomatis terbuka. Pilih varian dan tambahan yang sesuai, lalu klik **Tambahkan ke Keranjang**.

---

### 3.2 Mengelola Item di Keranjang (Qty Stepper & Diskon)

Setelah selesai memilih barang, klik tombol **Checkout & Bayar** di baris ringkasan bawah (floating bar) untuk masuk ke halaman **Checkout**.

**Mengubah Kuantitas**:
- Gunakan tombol **`−`** (minus) dan **`+`** (plus) di sebelah input kuantitas produk untuk mengurangi atau menambah jumlah barang dengan cepat.
- Jika kuantitas dikurangi di bawah `1`, item tersebut otomatis terhapus dari keranjang setelah konfirmasi.
- Klik tombol **🗑 Hapus** di pojok kanan item jika ingin membatalkan item tersebut sepenuhnya.

**Diskon Per Item**:
- Klik link **Atur diskon per item** (collapsible details).
- Masukkan jumlah diskon dalam Rupiah pada kolom input yang tersedia di samping nama produk.

---

### 3.3 Mengaitkan Data Pelanggan

Secara bawaan, transaksi dicatat sebagai pelanggan tanpa nama (**Guest**). Jika pelanggan adalah member terdaftar:

1. Di panel **Pelanggan**, ketik nomor HP atau nama pelanggan pada kolom pencarian.
2. Hasil pencarian akan muncul di bawahnya. Klik **Pilih →**.
3. Profil pelanggan akan terpasang di transaksi, menampilkan data limit kredit/hutang pelanggan (jika ada).
4. Jika ingin melepaskan akun pelanggan, klik tombol **Ganti**.

---

### 3.4 Menggunakan Kode Voucher

Jika pelanggan memiliki voucher promo:

1. Ketik kode voucher pada kolom **Kode Voucher** (misal: `DISKON20K`).
2. Sistem otomatis menghitung ulang nilai transaksi di bagian **Ringkasan Harga**.
3. Jika voucher valid, nilai potongan voucher akan mengurangi total tagihan pada baris *Voucher*.

---

### 3.5 Simulasi Pembayaran Tunai & Kembalian

1. Di panel **Metode Pembayaran**, secara bawaan metode aktif adalah **💵 Cash**.
2. Masukkan nominal uang kertas fisik yang diterima dari pelanggan di kolom nominal (misal: total tagihan `Rp 85.000`, pelanggan membayar `Rp 100.000` → ketik `100000`).
3. Sistem secara real-time menampilkan nominal **💰 Kembalian** yang wajib diserahkan kasir kepada pelanggan (misal: `Rp 15.000`).

---

### 3.6 Simulasi Pembayaran Non-Tunai (QRIS, EDC, Transfer)

Jika pelanggan membayar menggunakan metode non-tunai:

1. Pada baris pilihan metode pembayaran, klik salah satu tombol visual:
   - **📱 QRIS** — Untuk pembayaran scan barcode dinamis/statis.
   - **💳 EDC** — Untuk gesek kartu debit/kredit di mesin EDC.
   - **🏦 Transfer** — Untuk transfer langsung ke rekening bank outlet.
2. Masukkan nomor bukti transaksi atau referensi transfer di kolom **No. Referensi (wajib) *.**
3. Masukkan nominal pembayaran yang pas sesuai tagihan.

> [!IMPORTANT]
> Untuk pembayaran non-tunai (QRIS, EDC, Transfer), kolom **Nomor Referensi wajib diisi**. Sistem akan menolak checkout jika kolom ini dibiarkan kosong.

---

### 3.7 Cetak Struk / Invoice

1. Setelah nominal pembayaran dan metode sudah pas (ditandai dengan warna hijau pada total bayar), klik tombol **✓ Checkout Sekarang**.
2. Tombol akan berubah menjadi status proses loading.
3. Struk transaksi format struk thermal akan terbuka di layar.
4. Klik **Cetak** untuk mengirim ke printer kasir, atau klik **Transaksi Baru** untuk kembali ke halaman katalog POS melayani pelanggan berikutnya.

---

## 4. Pencatatan Kas Kecil (Petty Cash Expense)

Selama shift berjalan, kasir terkadang perlu mengeluarkan uang tunai dari laci kasir untuk keperluan operasional kecil mendadak (misalnya: membeli es batu, membeli sapu baru, atau membayar parkir kurir). Seluruh pengeluaran ini **wajib dicatat** agar tidak dianggap sebagai selisih kas minus di akhir shift.

**Lokasi menu:** `Penjualan` → `Sesi Kasir`

**Langkah-langkah:**

1. Buka menu **Sesi Kasir** (sesi saat ini harus sedang aktif).
2. Di bagian **Pengeluaran Kas Kecil**, isi formulir:

| Kolom | Keterangan | Contoh Nilai |
|-------|------------|--------------|
| **Nominal** | Jumlah uang tunai yang diambil dari laci. | `25000` |
| **Kategori** | Pilih kategori pengeluaran. | `Lain-lain` |
| **Deskripsi** | Catatan detail alasan pengambilan uang. | `Beli es batu kristal` |

3. Klik **Catat Pengeluaran**.
4. Pengeluaran kas kecil akan langsung terdaftar di tabel riwayat kas kecil sesi.
5. Nilai uang kas di sistem (**Expected Cash**) otomatis berkurang sebesar nominal pengeluaran tersebut.

---

## 5. Menutup Sesi Kasir & Rekonsiliasi Kas (Shift Closing)

Proses penutupan sesi dilakukan di akhir hari kerja atau saat pergantian shift kasir.

**Lokasi menu:** `Penjualan` → `Sesi Kasir`

**Langkah-langkah:**

1. Buka menu **Sesi Kasir**.
2. Klik tombol **Tutup Sesi Kasir**.
3. Sistem memuat ringkasan data keuangan shift saat ini:
   - **Modal Awal**: Kas awal laci.
   - **Penjualan Tunai**: Total transaksi POS yang menggunakan metode tunai.
   - **Kas Kecil**: Total pengeluaran kas kecil yang dicatat di langkah §4.
   - **Kas Seharusnya (Expected Cash)**: Rumus hitung otomatis (`Modal Awal + Penjualan Tunai − Kas Kecil`).
   - **Penjualan Non-Tunai**: Ringkasan total uang masuk lewat QRIS, EDC, dan Transfer.
4. Hitung secara manual seluruh uang kertas dan koin fisik yang ada di dalam laci kasir Anda saat ini.
5. Masukkan nominal uang hasil perhitungan fisik di kolom **Uang Fisik Akhir** (misal: Kas Seharusnya di layar adalah `Rp 1.450.000`, uang fisik di laci setelah dihitung adalah `Rp 1.450.000` → ketik `1450000`).
6. Lihat kalkulasi **Selisih Kas**:
   - Jika Uang Fisik **sama dengan** Kas Seharusnya → Selisih `Rp 0` (Balance/Sesuai).
   - Jika Uang Fisik **kurang dari** Kas Seharusnya → Selisih bernilai negatif (Kas kurang / tekor).
   - Jika Uang Fisik **lebih dari** Kas Seharusnya → Selisih bernilai positif (Kas lebih).
7. Klik tombol **Tutup Sesi & Rekonsiliasi**.
8. Sesi kasir resmi ditutup, kasir keluar dari shift aktif, dan data rekonsiliasi tersimpan secara permanen untuk diaudit oleh Supervisor/Owner.

---

## 6. Verifikasi Skenario Selesai

Lakukan pemeriksaan akhir menggunakan checklist berikut:

| Status | Langkah Verifikasi |
|--------|--------------------|
| ☐ | Sesi kasir berhasil dibuka dengan nominal kas awal tertentu |
| ☐ | Layar POS menampilkan quantity badge real-time di atas produk saat diklik |
| ☐ | Qty stepper (`-` / `+`) di keranjang belanja berjalan lancar |
| ☐ | Pembayaran tunai otomatis memunculkan nominal kembalian yang tepat |
| ☐ | Pembayaran non-tunai mewajibkan input nomor referensi bukti transaksi |
| ☐ | Pengeluaran kas kecil berhasil tercatat dan memotong nilai expected cash |
| ☐ | Penutupan sesi menampilkan nominal selisih kas (variance) yang akurat |
| ☐ | Dokumen transaksi di menu **Keuangan → Integrasi Akuntansi** tercatat **"Sudah terjurnal"** secara otomatis |

---

## 7. Pertanyaan Umum (FAQ)

**❓ Mengapa sistem tidak mengizinkan saya mengeklik "Checkout Sekarang" saat transaksi non-tunai?**

Periksa apakah kolom **Nomor Referensi** sudah diisi. Sistem mewajibkan input nomor referensi/bukti bayar untuk metode non-tunai (QRIS, EDC, Transfer) untuk keperluan rekonsiliasi bank di kemudian hari.

---

**❓ Apa yang harus saya lakukan jika terjadi selisih kas minus saat penutupan?**

Tetap masukkan jumlah uang fisik yang sebenarnya ada di laci apa adanya ke dalam kolom **Uang Fisik Akhir**. Laporkan selisih minus tersebut kepada Supervisor atau Owner untuk ditelusuri riwayat transaksinya. Jangan memanipulasi angka agar balance.

---

**❓ Bisakah saya mencampur pembayaran tunai dan non-tunai dalam satu transaksi?**

Ya. Anda dapat menambahkan baris pembayaran tambahan pada panel metode pembayaran dengan mengeklik **+ Tambah** di samping tulisan metode pembayaran, lalu membagi nominal pembayarannya (misal sebagian tunai, sebagian QRIS).

---

**❓ Bagaimana jika saya lupa mencatat pengeluaran kas kecil hingga sesi ditutup?**

Pengeluaran yang terlupa akan terbaca sebagai selisih kurang (tekor) saat penutupan sesi. Catatlah pengeluaran operasional sekecil apa pun sesaat setelah uang diambil dari laci.

---

**❓ Apakah struk belanja kasir bisa dicetak ulang?**

Ya. Anda dapat membuka menu **Penjualan → Histori Transaksi**, pilih nomor invoice pelanggan yang dimaksud, lalu klik tombol **Cetak Uang / Re-print Struk**.

---

*Dokumen terakhir diperbarui: Agustus 2026 — Morrus Digital Connecting*
