import { Link } from "react-router";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 dark:bg-[#070b13] dark:text-white font-sans overflow-x-hidden relative transition-colors duration-300">
      {/* Background Neon Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-700/[0.04] dark:bg-purple-700/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-700/[0.05] dark:bg-blue-700/10 blur-[150px] pointer-events-none"></div>

      {/* Header Navigation */}
      <header className="border-b border-gray-200 dark:border-white/5 backdrop-blur-md sticky top-0 z-50 bg-white/80 dark:bg-[#070b13]/80 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-md shadow-purple-500/20">
              M
            </div>
            <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
              Morrus<span className="text-purple-600 dark:text-purple-400">POS</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs text-gray-600 dark:text-gray-400 font-medium">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Fitur Utama</a>
            <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Harga Paket</a>
            <a href="/shop" className="hover:text-gray-900 dark:hover:text-white transition-colors">Storefront Demo</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 transition duration-200 cursor-pointer mr-1"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                // Sun Icon
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                // Moon Icon
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="py-1.5 px-4 bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white rounded-lg transition active:scale-95 shadow-md shadow-purple-500/10"
              >
                Dashboard Bisnis
              </Link>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="py-1.5 px-4 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/signup"
                  className="py-1.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs font-semibold text-white rounded-lg transition active:scale-95 shadow-md shadow-purple-500/20"
                >
                  Coba Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-100 text-purple-600 dark:bg-white/5 dark:border-white/10 dark:text-purple-300 rounded-full text-[10px] tracking-wide font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
          MorrusPOS Cloud SaaS Platform
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6 text-gray-900 dark:text-white">
          Kelola Bisnis POS & Multi-Cabang <br className="hidden md:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-teal-500 dark:from-purple-400 dark:via-blue-400 dark:to-teal-400">
            Lebih Cepat dan Otomatis
          </span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Ubah pencatatan manual menjadi digital. Dapatkan wawasan laba-rugi real-time, manajemen stok lintas outlet, pengadaan supplier terstruktur, hingga online ordering untuk pelanggan Anda.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-sm font-semibold text-white rounded-xl transition duration-200 active:scale-95 shadow-lg shadow-purple-500/20"
          >
            Mulai Uji Coba Gratis 30 Hari
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto py-3 px-8 bg-white hover:bg-gray-50 text-gray-700 dark:text-white dark:bg-white/5 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 text-sm font-semibold rounded-xl transition duration-200 active:scale-95"
          >
            Lihat Paket Harga
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-gray-200 dark:border-white/5 z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">Solusi Bisnis SaaS End-to-End</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">Satu dasbor terpadu untuk mengelola seluruh aspek operasional toko dan restoran Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Kasir POS & Sesi Kasir",
              desc: "Aplikasi POS kasir responsif dengan manajemen shift kasir (cashier session) untuk meminimalkan selisih uang tunai.",
              icon: (
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )
            },
            {
              title: "Inventori & Transfer Stok",
              desc: "Pantau stok on-hand di setiap cabang, lakukan audit opname, serta pindahkan produk antarcabang secara aman.",
              icon: (
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )
            },
            {
              title: "Laporan Keuangan Laba-Rugi",
              desc: "Analisis laba kotor, HPP (Harga Pokok Penjualan) rata-rata, pengeluaran PO, dan total pendapatan secara instan.",
              icon: (
                <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )
            },
            {
              title: "Pembelian PO & Hutang Dagang",
              desc: "Buat purchase order resmi, kelola tagihan supplier tempo/jatuh tempo, dan rekam pembayaran secara sistematis.",
              icon: (
                <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )
            },
            {
              title: "Konsinyasi & Produk Titipan",
              desc: "Catat barang titipan supplier (vendor consignment), rekam penjualan, dan lakukan settlement berkala secara otomatis.",
              icon: (
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 8h.01M12 12h.01" />
                </svg>
              )
            },
            {
              title: "Online Storefront & Ordering",
              desc: "Setiap outlet mendapatkan mini website online order otomatis. Pelanggan cukup scan QR, pesan, dan bayar online.",
              icon: (
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )
            }
          ].map((feat, idx) => (
            <div key={idx} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition duration-300 shadow-xs hover:shadow-md dark:shadow-none group">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition duration-300">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{feat.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-gray-200 dark:border-white/5 z-10 relative">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">Paket Harga Langganan</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto">Pilih paket sesuai kebutuhan bisnis Anda. Seluruh pendaftaran baru otomatis mendapatkan masa uji coba gratis sebulan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Card 1: Trial */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-md dark:shadow-none">
            <div>
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-4">Trial Package</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Free Trial</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">Masa eksplorasi dan uji coba seluruh modul sistem.</p>
              <div className="text-4xl font-extrabold mb-8 text-gray-900 dark:text-white">
                Rp 0<span className="text-xs text-gray-500 dark:text-gray-400 font-normal"> / 30 hari</span>
              </div>
              <ul className="text-xs space-y-3 text-gray-700 dark:text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Akses Semua Modul Kasir & POS
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> 1 Bisnis / 1 Outlet Utama
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Maksimal 3 User Staff
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Laporan Laba Rugi Dasar
                </li>
              </ul>
            </div>
            <Link
              to="/signup?package=Free%20Trial"
              className="w-full py-2.5 px-4 bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 text-xs font-semibold text-gray-700 dark:text-white rounded-xl text-center transition active:scale-95"
            >
              Mulai Uji Coba Gratis
            </Link>
          </div>

          {/* Card 2: Basic */}
          <div className="bg-white dark:bg-white/5 border-2 border-purple-600 dark:border-purple-500 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-lg dark:shadow-none">
            <div className="absolute top-0 right-0 bg-purple-600 dark:bg-purple-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              Populer
            </div>
            <div>
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-4">Basic Retail</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Standard Plan</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">Tepat untuk owner dengan bisnis mandiri atau dua cabang.</p>
              <div className="text-4xl font-extrabold mb-8 text-gray-900 dark:text-white">
                Rp 149.000<span className="text-xs text-gray-500 dark:text-gray-400 font-normal"> / bln</span>
              </div>
              <ul className="text-xs space-y-3 text-gray-700 dark:text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Semua Fitur Trial
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Up to 3 Cabang Outlet
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Maksimal 10 User Staff
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Manajemen Stok & Mutasi Lintas Cabang
                </li>
              </ul>
            </div>
            <Link
              to="/signup?package=Standard%20Plan"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs font-semibold text-white rounded-xl text-center transition active:scale-95 shadow-md shadow-purple-500/20"
            >
              Pilih Paket Standard
            </Link>
          </div>

          {/* Card 3: Pro */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-md dark:shadow-none">
            <div>
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-4">Scale Up Resto / Retail</div>
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Professional Plan</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">Sempurna untuk bisnis waralaba (franchise) skala besar.</p>
              <div className="text-4xl font-extrabold mb-8 text-gray-900 dark:text-white">
                Rp 299.000<span className="text-xs text-gray-500 dark:text-gray-400 font-normal"> / bln</span>
              </div>
              <ul className="text-xs space-y-3 text-gray-700 dark:text-gray-300 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Semua Fitur Standard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Cabang Outlet Unlimited
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Staff/User Unlimited
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> Integrasi Online Storefront & Kurir
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✔</span> API Akses & Laporan Kustom
                </li>
              </ul>
            </div>
            <Link
              to="/signup?package=Professional%20Plan"
              className="w-full py-2.5 px-4 bg-slate-100 border border-slate-200 hover:bg-slate-200 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 text-xs font-semibold text-gray-700 dark:text-white rounded-xl text-center transition active:scale-95"
            >
              Pilih Paket Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-white/5 text-center text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#070b13] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center font-bold text-white text-sm">
              M
            </div>
            <span className="font-bold text-gray-900 dark:text-white tracking-wider">MorrusPOS</span>
          </div>
          <p>© 2026 MorrusPOS SaaS. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-6">
            <a href="/shop" className="hover:text-gray-900 dark:hover:text-white transition-colors">Storefront</a>
            <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Fitur</a>
            <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Harga</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
