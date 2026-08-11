import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { registerOwnerRequest } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import AppLoader from "../components/ui/AppLoader";

export default function OnboardingWizardPage() {
  const { setSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [owner, setOwner] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [selectedPackage, setSelectedPackage] = useState("Free Trial");
  const [business, setBusiness] = useState({ name: "", category: "Food & Beverage", phone: "" });
  const [outlet, setOutlet] = useState({ name: "", code: "", address: "", phone: "" });

  // Read URL query parameter for package selection on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pkg = params.get("package");
    if (pkg) {
      setSelectedPackage(pkg);
    }
  }, [location.search]);

  // Handle auto-generation of outlet code based on outlet name
  useEffect(() => {
    if (outlet.name && !outlet.code) {
      const cleanName = outlet.name.replace(/[^a-zA-Z]/g, "").toUpperCase();
      const codeSuggestion = cleanName.substring(0, 3) + "01";
      if (codeSuggestion.length >= 3) {
        setOutlet(prev => ({ ...prev, code: codeSuggestion }));
      }
    }
  }, [outlet.name]);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!owner.name || !owner.email || !owner.password || !owner.confirmPassword) {
        setError("Semua field pendaftaran akun wajib diisi.");
        return;
      }
      if (owner.password !== owner.confirmPassword) {
        setError("Password dan konfirmasi password tidak cocok.");
        return;
      }
      if (owner.password.length < 8) {
        setError("Password minimal harus 8 karakter.");
        return;
      }
    } else if (step === 3) {
      if (!business.name || !business.category) {
        setError("Nama bisnis dan kategori bisnis wajib diisi.");
        return;
      }
    } else if (step === 4) {
      if (!outlet.name || !outlet.code) {
        setError("Nama outlet utama dan kode outlet wajib diisi.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!outlet.name || !outlet.code) {
      setError("Nama outlet utama dan kode outlet wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        owner: {
          name: owner.name,
          email: owner.email,
          password: owner.password
        },
        business: {
          name: business.name,
          category: business.category,
          phone: business.phone || null
        },
        package: selectedPackage,
        outlet: {
          name: outlet.name,
          code: outlet.code,
          address: outlet.address || null,
          phone: outlet.phone || null
        }
      };

      const sessionResult = await registerOwnerRequest(payload);
      setSession(sessionResult); // Set context session to auto-login
      window.location.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memproses pendaftaran. Silakan periksa data Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 text-gray-900 dark:bg-[#070b13] dark:text-white overflow-hidden font-sans py-12 px-4 transition-colors duration-300">
      {/* Background neon elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-700/[0.04] dark:bg-purple-700/10 rounded-full filter blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/[0.05] dark:bg-blue-600/15 rounded-full filter blur-[150px] pointer-events-none"></div>

      <div className="relative max-w-lg w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl p-8 z-10 transition-colors duration-300">
        
        {/* Floating Theme Switcher */}
        <div className="absolute top-6 right-6">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 transition duration-200 cursor-pointer"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            M
          </div>
          <span className="font-extrabold text-base tracking-wider text-gray-900 dark:text-white">
            Morrus<span className="text-purple-600 dark:text-purple-400">POS</span>
          </span>
        </div>

        {/* Steps Progress Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-white/10 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs relative z-10 transition duration-300 ${
                s <= step 
                  ? "bg-gradient-to-tr from-purple-600 to-blue-500 text-white shadow-md shadow-purple-500/20" 
                  : "bg-gray-100 border border-gray-200 text-gray-400 dark:bg-[#121824] dark:border-white/10 dark:text-gray-500"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step Titles */}
        <div className="text-center mb-6">
          {step === 1 && <h2 className="text-lg font-bold text-gray-900 dark:text-white">Daftar Akun Owner</h2>}
          {step === 2 && <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pilih Paket Langganan</h2>}
          {step === 3 && <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profil Bisnis Anda</h2>}
          {step === 4 && <h2 className="text-lg font-bold text-gray-900 dark:text-white">Outlet Utama Pertama</h2>}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Langkah {step} dari 4</p>
        </div>

        {error && (
          <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-5 text-left">
            {error}
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Step 1: Owner Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nama Lengkap Owner</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  value={owner.name}
                  onChange={e => setOwner({ ...owner, name: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Email Bisnis</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: owner@namabisnis.com"
                  value={owner.email}
                  onChange={e => setOwner({ ...owner, email: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 8 karakter"
                  value={owner.password}
                  onChange={e => setOwner({ ...owner, password: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Konfirmasi Password</label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi password Anda"
                  value={owner.confirmPassword}
                  onChange={e => setOwner({ ...owner, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Step 2: Package Selection */}
          {step === 2 && (
            <div className="space-y-3">
              {[
                {
                  id: "Free Trial",
                  title: "Free Trial 30 Hari",
                  price: "Rp 0",
                  desc: "Akses seluruh fitur secara gratis selama sebulan tanpa kartu kredit."
                },
                {
                  id: "Standard Plan",
                  title: "Standard Plan",
                  price: "Rp 199.000 / bln",
                  desc: "Ideal untuk bisnis mandiri, mengelola hingga 3 cabang outlet."
                },
                {
                  id: "Professional Plan",
                  title: "Professional Plan",
                  price: "Rp 299.000 / bln",
                  desc: "Untuk enterprise dengan cabang & staff tak terbatas + integrasi online order."
                }
              ].map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  className={`border rounded-xl p-4 cursor-pointer transition flex items-center justify-between ${
                    selectedPackage === pkg.id 
                      ? "border-purple-600 bg-purple-50 dark:border-purple-500 dark:bg-purple-500/5 shadow-xs" 
                      : "border-gray-200 hover:border-gray-300 bg-transparent dark:border-white/10 dark:hover:border-white/20 dark:bg-white/[0.01]"
                  }`}
                >
                  <div className="text-left pr-4">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{pkg.title}</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{pkg.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">{pkg.price}</span>
                  </div>
                </div>
              ))}
              <div className="text-[10px] text-center text-gray-450 dark:text-gray-500 mt-2">
                * Catatan: Semua akun pendaftaran demo akan mendapatkan Free Trial gratis selama 1 bulan secara otomatis.
              </div>
            </div>
          )}

          {/* Step 3: Business Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nama Bisnis / Perusahaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Kenangan"
                  value={business.name}
                  onChange={e => setBusiness({ ...business, name: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Kategori / Tipe Usaha</label>
                <select
                  value={business.category}
                  onChange={e => setBusiness({ ...business, category: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                >
                  <option value="Food & Beverage">F&B / Kafe / Resto</option>
                  <option value="Retail">Retail / Butik / Toko Kelontong</option>
                  <option value="Fashion">Fashion / Pakaian</option>
                  <option value="Services">Jasa / Salon / Laundry</option>
                  <option value="Grocery">Minimarket / Sembako</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nomor Telepon Bisnis (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={business.phone}
                  onChange={e => setBusiness({ ...business, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Step 4: Outlet Details */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nama Outlet Utama</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Cabang Central Jakarta"
                  value={outlet.name}
                  onChange={e => setOutlet({ ...outlet, name: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Kode Outlet (Auto-generate)</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan kode unik, contoh: PST01"
                  value={outlet.code}
                  onChange={e => setOutlet({ ...outlet, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Alamat Outlet (Opsional)</label>
                <textarea
                  placeholder="Masukkan alamat fisik outlet"
                  value={outlet.address}
                  onChange={e => setOutlet({ ...outlet, address: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Telepon Outlet (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 021-1234567"
                  value={outlet.phone}
                  onChange={e => setOutlet({ ...outlet, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 dark:bg-[#121824] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-900 dark:text-white focus:border-purple-600 dark:focus:border-purple-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="w-1/3 py-2.5 border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs font-semibold text-white rounded-xl transition active:scale-95 shadow-md shadow-purple-500/10 cursor-pointer"
              >
                Lanjutkan
              </button>
            ) : (
              <>
                {loading ? (
                  <div className="flex-1 py-1">
                    <AppLoader label="Membuat bisnis & outlet..." />
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs font-semibold text-white rounded-xl transition active:scale-95 shadow-lg shadow-purple-500/20 cursor-pointer"
                  >
                    Selesaikan Pendaftaran
                  </button>
                )}
              </>
            )}
          </div>
        </form>

        {/* Existing account link */}
        {step === 1 && (
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Sudah memiliki akun?{" "}
            <Link to="/signin" className="text-purple-600 dark:text-purple-400 hover:underline">
              Masuk ke Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
