import { Link } from "react-router";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

const features = [
  { title: "Kasir POS & Sesi Kasir",         desc: "Aplikasi POS responsif dengan manajemen shift kasir untuk meminimalkan selisih uang tunai.", icon: "🖥️", from: "#7c3aed", to: "#9333ea" },
  { title: "Inventori & Transfer Stok",       desc: "Pantau stok on-hand di setiap cabang, audit opname, dan pindahkan produk antarcabang secara aman.", icon: "📦", from: "#2563eb", to: "#0891b2" },
  { title: "Laporan Laba-Rugi",              desc: "Analisis laba kotor, HPP rata-rata, pengeluaran PO, dan total pendapatan secara instan.", icon: "📊", from: "#059669", to: "#0d9488" },
  { title: "Purchase Order & Hutang Dagang", desc: "Buat PO resmi, kelola tagihan supplier tempo/jatuh tempo, dan rekam pembayaran sistematis.", icon: "📋", from: "#e11d48", to: "#db2777" },
  { title: "Konsinyasi & Produk Titipan",    desc: "Catat barang titipan supplier, rekam penjualan, dan lakukan settlement berkala otomatis.", icon: "🤝", from: "#ea580c", to: "#d97706" },
  { title: "Online Storefront & Ordering",   desc: "Setiap outlet mendapat mini website online order. Pelanggan scan QR, pesan, dan bayar online.", icon: "🌐", from: "#4f46e5", to: "#7c3aed" },
];

const stats = [
  { value: "500+",   label: "Outlet Aktif",     icon: "🏪" },
  { value: "99.9%",  label: "Uptime SLA",        icon: "⚡" },
  { value: "30 Hari",label: "Uji Coba Gratis",   icon: "🎁" },
  { value: "24/7",   label: "Dukungan Tim",       icon: "💬" },
];

const pricingPlans = [
  {
    badge: "Trial Package", name: "Free Trial", desc: "Masa eksplorasi dan uji coba seluruh modul sistem.",
    price: "Rp 0", period: "30 hari",
    features: ["Akses Semua Modul Kasir & POS","1 Bisnis / 1 Outlet Utama","Maksimal 3 User Staff","Laporan Laba Rugi Dasar"],
    cta: "Mulai Uji Coba Gratis", href: "/signup?package=Free%20Trial", highlight: false,
  },
  {
    badge: "⭐ Paling Populer", name: "Standard Plan", desc: "Tepat untuk owner dengan bisnis mandiri atau dua cabang.",
    price: "Rp 199.000", period: "bln",
    features: ["Semua Fitur Trial","Up to 3 Cabang Outlet","Maksimal 10 User Staff","Manajemen Stok & Mutasi Lintas Cabang"],
    cta: "Pilih Paket Standard", href: "/signup?package=Standard%20Plan", highlight: true,
  },
  {
    badge: "Scale Up Franchise", name: "Professional Plan", desc: "Sempurna untuk bisnis waralaba (franchise) skala besar.",
    price: "Rp 299.000", period: "bln",
    features: ["Semua Fitur Standard","Cabang Outlet Unlimited","Staff/User Unlimited","Integrasi Online Storefront & Kurir","API Akses & Laporan Kustom"],
    cta: "Pilih Paket Pro", href: "/signup?package=Professional%20Plan", highlight: false,
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="min-h-screen overflow-x-hidden text-gray-900 dark:text-white transition-colors duration-300"
      style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: theme === "dark" ? "#06080f" : undefined }}
    >
      {/* ── CSS Animations ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', -apple-system, sans-serif !important; }

        @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes floatUp  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes floatUp2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseRing{ 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }

        .anim-grad { background:linear-gradient(135deg,#7c3aed,#2563eb,#0891b2,#7c3aed); background-size:300% 300%; animation:gradShift 5s ease infinite; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .card-1 { animation: floatUp 4.5s ease-in-out infinite; }
        .card-2 { animation: floatUp2 5.5s ease-in-out infinite; }
        .h-anim { animation: fadeUp .65s ease both; }
        .h-anim-1 { animation-delay:.1s; }
        .h-anim-2 { animation-delay:.2s; }
        .h-anim-3 { animation-delay:.35s; }
        .h-anim-4 { animation-delay:.5s; }

        .nav-blur { backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
        .feature-card { transition:all .22s cubic-bezier(.4,0,.2,1); }
        .feature-card:hover { transform:translateY(-5px); }
        .pricing-card { transition:all .25s cubic-bezier(.4,0,.2,1); }
        .pricing-card:hover { transform:translateY(-4px); }

        /* Hero gradient background */
        .hero-bg-light {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(167,139,250,.18) 0%, transparent 70%),
                      radial-gradient(ellipse 60% 50% at 80% 30%, rgba(96,165,250,.12) 0%, transparent 60%),
                      radial-gradient(ellipse 50% 40% at 20% 60%, rgba(45,212,191,.08) 0%, transparent 60%),
                      linear-gradient(180deg, #f3f0ff 0%, #eff6ff 40%, #f0fdfa 70%, #f8fafc 100%);
        }
        .hero-bg-dark {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,.25) 0%, transparent 70%),
                      radial-gradient(ellipse 60% 50% at 80% 30%, rgba(37,99,235,.15) 0%, transparent 60%),
                      radial-gradient(ellipse 50% 40% at 20% 60%, rgba(14,165,233,.1) 0%, transparent 60%),
                      linear-gradient(180deg, #09040f 0%, #06080f 100%);
        }
        .hero-glow { filter: blur(60px); }
      `}</style>

      {/* ── Navbar ── */}
      <header className="nav-blur sticky top-0 z-50 border-b border-black/5 dark:border-white/5"
        style={{ background: theme === "dark" ? "rgba(6,8,15,0.88)" : "rgba(243,240,255,0.88)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg"
              style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>M</div>
            <span className="font-black text-lg">
              Morrus<span className="anim-grad">POS</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500 dark:text-gray-400">
            {[["#features","Fitur Utama"],["#pricing","Harga Paket"],["/shop","Storefront Demo"]].map(([h,l]) => (
              <a key={h} href={h} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{l}</a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} title="Toggle theme"
              className="w-9 h-9 flex items-center justify-center rounded-xl border text-gray-500 dark:text-gray-400 transition-all"
              style={{ borderColor: theme === "dark" ? "rgba(255,255,255,.1)" : "rgba(124,58,237,.2)", background: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(124,58,237,.05)" }}>
              {theme === "dark" ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg"
                style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>Dashboard Bisnis</Link>
            ) : (
              <>
                <Link to="/signin" className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Masuk</Link>
                <Link to="/signup" className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg shadow-violet-500/25 active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>Coba Gratis →</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={`relative z-10 pt-24 pb-0 overflow-hidden ${theme === "dark" ? "hero-bg-dark" : "hero-bg-light"}`}>
        <div className="max-w-7xl mx-auto px-6 text-center pb-12">
          {/* Badge */}
          <div className="h-anim h-anim-1 inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
            style={{ background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.25)", color: "#7c3aed" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-ping" />
            MorrusPOS Cloud SaaS Platform — Sistem POS Modern Indonesia
          </div>

          {/* Heading */}
          <h1 className="h-anim h-anim-2 text-5xl md:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.05] mb-6 text-gray-900 dark:text-white">
            Kelola Bisnis POS &amp;<br className="hidden md:inline" />
            {" "}Multi-Cabang{" "}
            <span className="anim-grad">Lebih Cepat<br className="hidden md:inline" /> dan Otomatis</span>
          </h1>

          {/* Subtitle */}
          <p className="h-anim h-anim-3 text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Ubah pencatatan manual menjadi digital. Dapatkan wawasan laba-rugi real-time, manajemen stok lintas outlet,
            pengadaan supplier terstruktur, hingga online ordering untuk pelanggan Anda.
          </p>

          {/* CTA */}
          <div className="h-anim h-anim-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link to="/signup"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-bold text-white shadow-xl shadow-violet-500/30 active:scale-95 transition-transform"
              style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>
              🚀 Mulai Uji Coba Gratis 30 Hari
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a href="#pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-semibold transition-all active:scale-95"
              style={{
                border: "1.5px solid rgba(124,58,237,.25)",
                background: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.7)",
                color: theme === "dark" ? "#e2e8f0" : "#374151",
                backdropFilter: "blur(8px)",
              }}>
              Lihat Paket Harga
            </a>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-16">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl px-4 py-4 text-center"
                style={{
                  background: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.7)",
                  border: theme === "dark" ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(124,58,237,.12)",
                  backdropFilter: "blur(12px)",
                }}>
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup — full width, inside hero */}
        <div className="relative w-full max-w-5xl mx-auto px-6 pb-0">
          {/* The main browser frame */}
          <div className="relative rounded-t-2xl overflow-hidden shadow-2xl"
            style={{
              border: theme === "dark" ? "1px solid rgba(255,255,255,.1)" : "1px solid rgba(124,58,237,.15)",
              background: theme === "dark" ? "rgba(17,24,39,.9)" : "rgba(255,255,255,.9)",
              backdropFilter: "blur(20px)",
            }}>
            {/* Browser chrome bar */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b"
              style={{ background: theme === "dark" ? "rgba(255,255,255,.04)" : "rgba(124,58,237,.04)", borderColor: theme === "dark" ? "rgba(255,255,255,.06)" : "rgba(124,58,237,.1)" }}>
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <div className="h-3 w-3 rounded-full bg-amber-400" />
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <div className="ml-3 h-5 flex-1 max-w-xs rounded-lg flex items-center px-3 text-[10px] font-mono text-gray-400"
                style={{ background: theme === "dark" ? "rgba(255,255,255,.06)" : "rgba(124,58,237,.06)" }}>
                app.morruspos.id/dashboard
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-5">
              {/* Top metric cards */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Pendapatan Hari Ini", val: "Rp 4.21jt", color: "#7c3aed", bg: "rgba(124,58,237,.08)" },
                  { label: "Total Transaksi", val: "142 Trx", color: "#2563eb", bg: "rgba(37,99,235,.08)" },
                  { label: "Produk Terjual", val: "389 Item", color: "#059669", bg: "rgba(5,150,105,.08)" },
                  { label: "Gross Profit", val: "Rp 1.7jt", color: "#d97706", bg: "rgba(217,119,6,.08)" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl p-3.5" style={{ background: m.bg, border: `1px solid ${m.color}22` }}>
                    <p className="text-[10px] text-gray-400 mb-1.5">{m.label}</p>
                    <p className="text-base font-black" style={{ color: m.color }}>{m.val}</p>
                    <p className="text-[9px] text-emerald-500 mt-0.5 font-semibold">↑ +12.4%</p>
                  </div>
                ))}
              </div>

              {/* Chart + outlet grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Chart area */}
                <div className="col-span-2 rounded-xl p-4"
                  style={{ background: theme === "dark" ? "rgba(255,255,255,.03)" : "rgba(124,58,237,.03)", border: theme === "dark" ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(124,58,237,.08)" }}>
                  <p className="text-[10px] font-semibold text-gray-400 mb-3">Grafik Penjualan — 7 Hari</p>
                  <div className="flex items-end gap-1.5 h-16">
                    {[55, 80, 45, 90, 65, 100, 75].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm transition-all" style={{
                        height: `${h}%`,
                        background: i === 5
                          ? "linear-gradient(to top,#7c3aed,#2563eb)"
                          : theme === "dark" ? "rgba(124,58,237,.25)" : "rgba(124,58,237,.15)",
                      }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {["Sen","Sel","Rab","Kam","Jum","Sab","Min"].map(d => (
                      <span key={d} className="text-[8px] text-gray-400 flex-1 text-center">{d}</span>
                    ))}
                  </div>
                </div>

                {/* Outlet status */}
                <div className="rounded-xl p-4"
                  style={{ background: theme === "dark" ? "rgba(255,255,255,.03)" : "rgba(124,58,237,.03)", border: theme === "dark" ? "1px solid rgba(255,255,255,.06)" : "1px solid rgba(124,58,237,.08)" }}>
                  <p className="text-[10px] font-semibold text-gray-400 mb-3">Status Outlet</p>
                  {[["Pusat","Aktif","#10b981"],["Selatan","Aktif","#10b981"],["Timur","Standby","#f59e0b"]].map(([name,status,color]) => (
                    <div key={name} className="flex items-center justify-between py-1.5 border-b last:border-0"
                      style={{ borderColor: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(124,58,237,.07)" }}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{name}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color, background: `${color}18` }}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gradient fade at bottom of mockup */}
          <div className="h-20 -mt-1" style={{
            background: theme === "dark"
              ? "linear-gradient(to bottom, transparent, #06080f)"
              : "linear-gradient(to bottom, transparent, #f8fafc)",
          }} />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto"
        style={{ background: theme === "dark" ? "#06080f" : "#f8fafc" }}>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-xs font-semibold"
            style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.2)", color: "#7c3aed" }}>
            ✨ Fitur Unggulan
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">
            Solusi Bisnis SaaS <span className="anim-grad">End-to-End</span>
          </h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Satu dasbor terpadu untuk mengelola seluruh aspek operasional toko dan restoran Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="feature-card group relative rounded-3xl p-7 overflow-hidden"
              style={{
                background: theme === "dark" ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.9)",
                border: theme === "dark" ? "1px solid rgba(255,255,255,.07)" : "1px solid rgba(124,58,237,.1)",
                boxShadow: theme === "dark" ? "none" : "0 4px 24px rgba(124,58,237,.06)",
              }}>
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-lg"
                style={{ background: `linear-gradient(135deg,${f.from},${f.to})` }}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 30% 30%, ${f.from}0d, transparent 60%)` }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="py-10 px-6"
        style={{ background: theme === "dark" ? "#09040f" : "#f0ebff" }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6">
            Dipercaya oleh berbagai jenis bisnis
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {["🛍️ Retail Modern","☕ Kafe & Restoran","💊 Apotek","🏪 Minimarket","🍕 Franchise / Waralaba"].map(b => (
              <span key={b} className="text-sm font-black text-gray-500 dark:text-gray-400 tracking-tight">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 py-24 px-6 max-w-7xl mx-auto"
        style={{ background: theme === "dark" ? "#06080f" : "#f8fafc" }}>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-xs font-semibold"
            style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.2)", color: "#7c3aed" }}>
            💎 Harga Transparan
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">
            Paket Harga <span className="anim-grad">Langganan</span>
          </h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Pilih paket sesuai kebutuhan bisnis Anda. Seluruh pendaftaran baru mendapatkan masa uji coba gratis sebulan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((p, i) => (
            <div key={i} className={`pricing-card relative flex flex-col justify-between rounded-3xl p-8 overflow-hidden ${
              p.highlight ? "shadow-2xl shadow-violet-500/25" : "shadow-md"
            }`}
              style={p.highlight ? {
                background: "linear-gradient(145deg,#7c3aed,#4f46e5,#2563eb)",
                border: "none",
              } : {
                background: theme === "dark" ? "rgba(255,255,255,.04)" : "#ffffff",
                border: theme === "dark" ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(124,58,237,.12)",
              }}>
              {p.highlight && (
                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-15" style={{ background: "white" }} />
              )}
              <div className="relative">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
                  style={p.highlight ? { background: "rgba(255,255,255,.2)", color: "white" } : { background: "rgba(124,58,237,.1)", color: "#7c3aed" }}>
                  {p.badge}
                </span>
                <h3 className={`text-2xl font-black mb-2 ${p.highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>{p.name}</h3>
                <p className={`text-xs mb-6 leading-relaxed ${p.highlight ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>{p.desc}</p>
                <div className="mb-7">
                  <span className={`text-4xl font-black ${p.highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>{p.price}</span>
                  <span className={`text-sm ml-1 ${p.highlight ? "text-white/60" : "text-gray-400"}`}>/ {p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-sm ${p.highlight ? "text-white/90" : "text-gray-600 dark:text-gray-300"}`}>
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={p.highlight ? { background: "rgba(255,255,255,.25)", color: "white" } : { background: "rgba(124,58,237,.12)", color: "#7c3aed" }}>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link to={p.href}
                className="block w-full py-3 px-6 rounded-2xl text-sm font-bold text-center active:scale-95 transition-transform"
                style={p.highlight ? {
                  background: "white", color: "#7c3aed",
                } : {
                  background: "linear-gradient(135deg,#7c3aed,#2563eb)", color: "white",
                  boxShadow: "0 4px 16px rgba(124,58,237,.25)",
                }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 py-20 px-6 max-w-5xl mx-auto"
        style={{ background: theme === "dark" ? "#06080f" : "#f8fafc" }}>
        <div className="relative rounded-3xl overflow-hidden text-center p-12 md:p-16"
          style={{ background: "linear-gradient(135deg,#6d28d9,#7c3aed,#4f46e5,#2563eb)" }}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.1) 1px,transparent 1px)",
            backgroundSize: "32px 32px"
          }} />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10 animate-pulse" style={{ background: "white" }} />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Mulai Transformasi Digital<br />Bisnis Anda Hari Ini
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto text-sm leading-relaxed">
              Bergabung dengan ratusan pemilik bisnis yang sudah merasakan manfaat MorrusPOS.
              Gratis 30 hari, tidak perlu kartu kredit.
            </p>
            <Link to="/signup"
              className="inline-flex items-center gap-2 bg-white font-bold py-3.5 px-8 rounded-2xl text-sm active:scale-95 transition-transform shadow-xl"
              style={{ color: "#7c3aed" }}>
              🚀 Daftar Sekarang — Gratis!
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="text-white/40 text-xs mt-4">✓ Tanpa kartu kredit &nbsp;·&nbsp; ✓ Setup instan &nbsp;·&nbsp; ✓ Batalkan kapan saja</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12 transition-colors"
        style={{
          background: theme === "dark" ? "#06080f" : "#f0ebff",
          borderColor: theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(124,58,237,.15)",
        }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md"
              style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}>M</div>
            <span className="font-black text-base text-gray-900 dark:text-white">Morrus<span className="anim-grad">POS</span></span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 MorrusPOS SaaS. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            {[["Storefront","/shop"],["Fitur","#features"],["Harga","#pricing"]].map(([l,h]) => (
              <a key={h} href={h} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
