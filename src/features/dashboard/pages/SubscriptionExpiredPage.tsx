import { useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { apiClient } from "../../../api/client";
import { useTheme } from "../../../context/ThemeContext";
import type { AuthSession } from "../../auth/types/auth";
import AppLoader from "../../../components/ui/AppLoader";

export default function SubscriptionExpiredPage() {
  const { setSession, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReactivate = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call backend to reactivate/extend trial
      const nextSession = await apiClient.post<AuthSession>("/api/billing/reactivate");
      setSession(nextSession);
      // Redirect will happen automatically via SubscriptionGuard
      window.location.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Gagal mengaktifkan kembali trial.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 text-gray-900 dark:bg-[#090d16] dark:text-white overflow-hidden font-sans transition-colors duration-300">
      {/* Background Neon Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/[0.04] dark:bg-purple-600/20 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/[0.05] dark:bg-blue-600/25 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Lock Card */}
      <div className="relative max-w-md w-full mx-4 p-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl text-center z-10 transition-colors duration-300">
        
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

        {/* Animated Lock Icon */}
        <div className="relative mx-auto w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6">
          <svg className="w-10 h-10 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Brand */}
        <div className="text-[10px] uppercase tracking-widest text-purple-650 dark:text-purple-400 font-bold mb-2">MorrusPOS SaaS</div>
        
        <h1 className="text-xl font-bold tracking-tight mb-3 text-gray-900 dark:text-white">Masa Uji Coba Berakhir</h1>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Uji coba gratis 30 hari untuk akun bisnis Anda telah berakhir. Seluruh fitur operasional kasir dan toko telah dikunci untuk sementara waktu.
        </p>

        {/* Locked Features List */}
        <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-4 mb-6 text-left border border-gray-200 dark:border-white/5 space-y-2.5">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Fitur yang Terkunci:</div>
          {[
            "Transaksi Kasir & Pembayaran POS",
            "Manajemen Produk & Stok Inventori",
            "Laporan Penjualan & Laba Rugi",
            "Manajemen Staff & Multi-Outlet",
            "Integrasi Channel Online & Konsinyasi"
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center text-xs text-gray-700 dark:text-gray-300">
              <svg className="w-4 h-4 text-rose-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-5 text-left">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="py-2 flex items-center justify-center">
              <AppLoader label="Memproses aktivasi..." />
            </div>
          ) : (
            <button
              onClick={handleReactivate}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs font-semibold text-white rounded-xl transition duration-200 shadow-lg shadow-purple-500/20 active:scale-[0.98] cursor-pointer"
            >
              Aktifkan Kembali (Simulasi 30 Hari Trial)
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-gray-750 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white text-xs font-semibold rounded-xl transition duration-200 active:scale-[0.98] cursor-pointer"
          >
            Keluar Sesi
          </button>
        </div>

        {/* Support Link */}
        <div className="mt-6 text-[10px] text-gray-500">
          Butuh bantuan? Hubungi <a href="mailto:support@morruspos.com" className="text-purple-600 dark:text-purple-400 hover:underline">support@morruspos.com</a>
        </div>

      </div>
    </div>
  );
}
