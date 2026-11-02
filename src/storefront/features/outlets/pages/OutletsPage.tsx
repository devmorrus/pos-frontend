import { useNavigate } from "react-router";
import { useStorefront } from "../../../context/StorefrontContext";
import { usePublicOutlets } from "../hooks/usePublicOutlets";
import type { PublicOutlet } from "../types";

export default function OutletsPage() {
  const navigate = useNavigate();
  const { setSelectedOutlet } = useStorefront();
  const { outlets, isLoading, error, refetch } = usePublicOutlets();

  const handleSelectOutlet = (outlet: PublicOutlet) => {
    setSelectedOutlet({
      id: outlet.id,
      businessSlug: outlet.businessSlug,
      code: outlet.code,
      name: outlet.name,
      address: outlet.address ?? undefined,
      phone: outlet.phone ?? undefined,
    });
    navigate(`/shop/${outlet.businessSlug}/o/${outlet.code}/menu`);
  };

  return (
    <div className="flex-1 flex flex-col font-outfit pb-8">

      {/* Header */}
      <div className="py-6">
        <h2 className="text-xl font-black text-white leading-tight">Pilih Lokasi Outlet</h2>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Pilih outlet terdekat Anda untuk mulai memesan
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-16">
          <div
            className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(245,124,0,0.3)", borderTopColor: "#f57c00" }}
          />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Memuat daftar outlet...
          </p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h3 className="text-base font-bold text-white">Gagal Memuat Outlet</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{error}</p>
          <button
            onClick={refetch}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 8px 30px rgba(245,124,0,0.3)" }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && outlets.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h3 className="text-base font-bold text-white">Belum Ada Outlet Aktif</h3>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            Saat ini belum ada outlet yang tersedia. Silakan coba beberapa saat lagi.
          </p>
        </div>
      )}

      {/* Outlet list */}
      {!isLoading && !error && outlets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((outlet) => (
            <button
              key={outlet.id}
              onClick={() => handleSelectOutlet(outlet)}
              className="group flex flex-col items-start p-5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(245,124,0,0.08)";
                e.currentTarget.style.border = "1px solid rgba(245,124,0,0.25)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
              }}
            >
              {/* Icon + status */}
              <div className="flex items-center justify-between w-full mb-4">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "linear-gradient(135deg, rgba(255,167,38,0.2), rgba(245,124,0,0.1))" }}
                >
                  🏪
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  Buka
                </span>
              </div>

              {/* Name */}
              <h3 className="text-sm font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                {outlet.name}
              </h3>

              {/* Address */}
              {outlet.address && (
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  📍 {outlet.address}
                </p>
              )}

              {/* Phone */}
              {outlet.phone && (
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                  📞 {outlet.phone}
                </p>
              )}

              {/* Arrow CTA */}
              <div
                className="mt-4 self-end flex items-center space-x-1.5 text-xs font-bold transition-all group-hover:translate-x-1"
                style={{ color: "#ffa726" }}
              >
                <span>Pesan di sini</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
