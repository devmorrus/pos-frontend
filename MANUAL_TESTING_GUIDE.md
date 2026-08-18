# Panduan Uji Manual & Skenario Demo Morrus-POS (End-to-End)

Dokumen ini berisi panduan langkah-demi-langkah (*demo script*) untuk menguji seluruh fitur utama dalam ekosistem Morrus-POS mulai dari pembuatan cabang baru, pengadaan barang, operasional kasir, hingga pencatatan jurnal akuntansi. Gunakan dokumen ini sebagai panduan saat melakukan demo di hadapan klien.

---

## 🔑 Kredensial Peran (Roles & Access)

Pastikan Anda mengetahui akun login dengan peran (*roles*) berikut untuk melakukan demo:
*   **Owner / Admin**: Hak akses penuh (mengelola cabang, setup Chart of Accounts, melihat laporan keuangan global).
*   **Gudang**: Hak akses manajemen produk, stok, pengadaan barang (PO), dan retur supplier.
*   **Keuangan**: Hak akses manajemen Chart of Accounts, pencatatan pendapatan/pengeluaran toko, verifikasi utang supplier, settlement, dan audit integrasi jurnal.
*   **Kasir**: Hak akses kasir POS, buka/tutup sesi kasir, cetak struk transaksi.

---

## 📌 Skenario 1: Pengaturan Awal (Cabang Baru & Master Akun)

*Tujuan: Membuat cabang baru dari awal dan menyiapkan Chart of Accounts (COA) agar transaksi siap terjurnal.*

### Langkah 1: Membuat Outlet / Cabang Baru
1. Login sebagai **Owner**.
2. Masuk ke menu **Pengaturan** > **Outlet**.
3. Klik tombol **Tambah Outlet**.
4. Isi data lengkap (Nama Outlet: `Cabang Demo Utama`, Alamat, Telepon).
5. Klik **Simpan**.

### Langkah 2: Mengganti Context Cabang Aktif
1. Di bagian kanan atas navbar, klik pilihan **Outlet** (dropdown).
2. Pilih `Cabang Demo Utama`.
3. Seluruh dashboard dan data transaksi saat ini akan disaring khusus untuk cabang baru ini.

### Langkah 3: Setup Bagan Akun Keuangan (Chart of Accounts - COA)
1. Buka menu **Keuangan** > **Chart of Accounts**.
2. Pastikan akun-akun penting berikut sudah terdaftar dan aktif (jika belum, klik **Tambah Akun**):
    *   `1001` - **Kas Kasir** (Tipe: Aset Lancar / Cash)
    *   `1002` - **Bank Mandiri** (Tipe: Aset Lancar / Bank)
    *   `1101` - **Persediaan Barang Dagang** (Tipe: Persediaan / Inventory)
    *   `2001` - **Utang Dagang** (Tipe: Kewajiban Lancar / Account Payable)
    *   `4001` - **Pendapatan Penjualan POS** (Tipe: Pendapatan / Revenue)
    *   `5001` - **Harga Pokok Penjualan (HPP)** (Tipe: Beban / Cost of Goods Sold)

---

## 📦 Skenario 2: Pengadaan & Retur Barang (Procurement & Returns)

*Tujuan: Menambah stok cabang baru dengan memesan barang ke supplier, menerima kiriman, dan menguji proses retur barang rusak.*

### Langkah 1: Daftarkan Supplier Baru
1. Buka menu **Pembelian & Supplier** > **Supplier**.
2. Klik **Tambah Supplier**.
3. Masukkan nama: `PT Multi Pemasok Demo`, kontak, dan alamat. Klik **Simpan**.

### Langkah 2: Membuat Purchase Order (PO)
1. Buka menu **Pembelian & Supplier** > **Purchase Order**.
2. Klik **Buat PO**.
3. Pilih Supplier: `PT Multi Pemasok Demo`.
4. Pilih produk yang ingin dipesan (contoh: *Kopi Susu Gula Aren*, kuantitas: `100 pcs`, harga beli per unit: `Rp 10.000`).
5. Klik **Simpan & Kirim PO**. Status PO berubah menjadi **Sent / Open**.
6. *Catat Nomor PO yang terbentuk (contoh: `PO-20260818-001`).*

### Langkah 3: Penerimaan Barang di Gudang (Receive Goods)
1. Login / bertindak sebagai staf **Gudang**.
2. Buka menu **Pembelian & Supplier** > **Purchase Order** > Pilih PO yang baru dibuat.
3. Klik tombol **Penerimaan Barang (Receive)**.
4. Masukkan jumlah barang yang diterima secara fisik (misal: diterima lengkap `100 pcs`).
5. Masukkan nomor batch dan tanggal kedaluwarsa jika ada.
6. Klik **Konfirmasi Penerimaan**. Status PO akan berubah menjadi **Completed** dan stok di menu **Stok** otomatis bertambah sebanyak `100 pcs`.

### Langkah 4: Melakukan Retur Barang ke Supplier (Supplier Return)
1. Jika ada barang yang rusak saat diterima (contoh: `5 pcs` bocor):
2. Buka menu **Pembelian & Supplier** > **Supplier Return**.
3. Klik **Buat Retur Supplier**.
4. Pilih Supplier: `PT Multi Pemasok Demo`.
5. Pilih produk dan masukkan jumlah retur: `5 pcs`. Masukkan alasan: *Kemasan rusak*.
6. Klik **Kirim Retur**. Status stok produk di sistem akan berkurang secara otomatis sebanyak `5 pcs`.

---

## 🤝 Skenario 3: Pengelolaan Produk Konsinyasi (Consignment)

*Tujuan: Mencatat produk titip jual dari pihak ketiga (supplier konsinyasi) dan melakukan perhitungan bagi hasil.*

### Langkah 1: Daftarkan Konsinyasi Baru
1. Buka menu **Konsinyasi** > **Daftar Konsinyasi**.
2. Klik **Daftar Titipan Baru**.
3. Pilih Supplier Konsinyasi, lalu daftarkan produk yang dititipkan (contoh: *Keripik Singkong Demo*, jumlah titipan: `50 pcs`, harga jual ke konsumen: `Rp 15.000`, harga modal/kesepakatan bagi hasil: `Rp 10.000`).
4. Klik **Simpan**. Stok produk konsinyasi sekarang aktif dan siap dijual di kasir POS.

---

## 🛒 Skenario 4: Operasional Kasir & Penjualan POS (POS Cashier)

*Tujuan: Memulai penjualan di kasir, mencatat transaksi tunai & non-tunai, dan menutup shift kasir.*

### Langkah 1: Buka Sesi Kasir & Input Modal Awal (Shift Opening)
1. Login sebagai **Kasir**.
2. Buka menu **Penjualan** > **Sesi Kasir**.
3. Klik **Buka Sesi Kasir Baru**.
4. Masukkan jumlah modal awal laci kasir (*Petty Cash / Modal Awal*), misalnya: `Rp 200.000`.
5. Klik **Buka Sesi**. Kasir sekarang siap melayani penjualan.

### Langkah 2: Transaksi Penjualan (POS Checkout)
1. Buka menu **Penjualan** > **POS Kasir**.
2. Pilih produk yang ingin dibeli pelanggan (contoh: `2 pcs` *Kopi Susu Gula Aren* dan `1 pcs` *Keripik Singkong Demo*).
3. Klik tombol **Bayar** di sisi kanan bawah.
4. Pilih metode pembayaran:
    *   **Tunai**: Masukkan nominal uang yang diterima (misal: `Rp 100.000`) dan lihat nominal kembalian yang muncul.
    *   **E-Wallet / EDC (Non-Tunai)**: Pilih channel settlement (misalnya *QRIS Bank Mandiri*).
5. Klik **Konfirmasi Pembayaran**.
6. Struk transaksi akan tercetak di layar. Klik **Transaksi Baru** untuk kembali ke menu POS.
7. *Catat Nomor Invoice transaksi yang baru saja sukses (contoh: `TRX-20260818-0001`).*

### Langkah 3: Menutup Sesi Kasir & Rekonsiliasi Kas (Shift Closing)
1. Setelah jam operasional selesai, masuk kembali ke menu **Penjualan** > **Sesi Kasir**.
2. Klik **Tutup Sesi Kasir**.
3. Hitung uang fisik secara manual yang ada di laci kasir saat ini.
4. Masukkan jumlah uang fisik tersebut di kolom **Uang Fisik Akhir**.
5. Sistem akan membandingkan otomatis: `Modal Awal + Total Penjualan Tunai` vs `Uang Fisik Akhir`.
6. Jika ada perbedaan, sistem akan mencatat nominal **Selisih Kas** (positif atau negatif).
7. Klik **Tutup Sesi & Rekonsiliasi**.

---

## 💸 Skenario 5: Manajemen Kas & Laporan Keuangan (Accounting & Auditing)

*Tujuan: Mencatat pengeluaran operasional toko dan mengaudit integritas jurnal otomatis di modul akuntansi.*

### Langkah 1: Pencatatan Pengeluaran Toko Manual
1. Buka menu **Keuangan** > **Pengeluaran Toko**.
2. Klik **Catat Pengeluaran**.
3. Pilih kategori biaya (misal: *Beban Biaya Listrik & Air*).
4. Masukkan nominal: `Rp 50.000`, pilih metode pembayaran (misal dari akun Kasir/Bank), dan tambahkan catatan memo.
5. Klik **Simpan**. Aliran kas keluar langsung ter-update.

### Langkah 2: Audit Jurnal Otomatis (Accounting Integration Check)
1. Buka menu **Keuangan** > **Integrasi Akuntansi**.
2. Pada form **Cek Status Posting**:
    *   Pilih **Reference Type**: `Penjualan POS` (atau `Purchase Order`).
    *   Pada kolom **Reference ID / Nomor Dokumen**, ketikkan Nomor Invoice yang telah Anda catat sebelumnya (misal: `TRX-20260818-0001`) atau gunakan tombol **"Pilih"** di bagian **Pilih dari Transaksi / PO Terakhir** untuk menyalin nomor secara instan.
    *   Klik **Cek status**.
3. Hasil pemeriksaan di sisi kanan akan berubah menjadi hijau **"Sudah terjurnal"** lengkap dengan detail posting Debit/Kredit buku besar umum (General Ledger):
    *   *Debit*: Kas Kasir (Aset) - `Rp X.XXX`
    *   *Kredit*: Pendapatan Penjualan (Pendapatan) - `Rp X.XXX`
    *   *Debit*: Harga Pokok Penjualan / HPP (Beban) - `Rp Y.YYY`
    *   *Kredit*: Persediaan Barang Dagang (Aset) - `Rp Y.YYY`

### Langkah 3: Membaca Laporan Laba Rugi & Arus Kas
1. Buka menu **Laporan** > **Laporan Keuangan**.
2. Pilih **Laporan Arus Kas** atau **Laporan Laba Rugi**.
3. Saring berdasarkan cabang `Cabang Demo Utama` dan bulan berjalan.
4. Anda akan melihat performa bisnis riil secara akurat yang bersumber langsung dari data transaksi harian kasir dan pengadaan barang.

---

💡 **Tip Demo**: Tunjukkan ke klien bagaimana stok barang berkurang saat terjadi penjualan di POS kasir dan bertambah saat PO diselesaikan, serta bagaimana pembukuan akuntansi otomatis terbentuk di belakang layar tanpa perlu entri jurnal manual lagi!
