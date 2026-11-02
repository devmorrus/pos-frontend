import { Link } from "react-router";
import { useStorefront } from "../../../context/StorefrontContext";

export default function LandingPage() {
  const { selectedOutlet } = useStorefront();

  return (
    <div className="flex-1 flex flex-col font-outfit relative overflow-hidden" style={{ minHeight: "calc(100vh - 64px)" }}>
      
      {/* Decorative ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #f57c00, transparent 70%)" }} />
        <div className="absolute bottom-[-5%] left-[-10%] w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #ffa726, transparent 70%)" }} />
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative z-10">

        {/* Animated logo ring */}
        <div className="relative mb-10">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#f57c00", transform: "scale(1.4)" }} />
          <div className="relative h-28 w-28 rounded-[32px] flex items-center justify-center text-white text-5xl font-black shadow-2xl"
            style={{ background: "linear-gradient(135deg, #ffa726 0%, #f57c00 50%, #e65100 100%)", boxShadow: "0 30px 80px -20px rgba(245,124,0,0.6), 0 0 0 1px rgba(245,124,0,0.3)" }}>
            ☕
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">
          Morrus Coffee
        </h1>
        <p className="mt-2 text-sm sm:text-base font-bold tracking-[0.3em] uppercase" style={{ color: "#f57c00" }}>
          Digital Ordering
        </p>

        {/* Divider */}
        <div className="flex items-center space-x-3 my-8 w-full max-w-xs">
          <div className="flex-1 h-px" style={{ background: "rgba(245,124,0,0.2)" }} />
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
          <div className="flex-1 h-px" style={{ background: "rgba(245,124,0,0.2)" }} />
        </div>

        <p className="text-sm sm:text-base leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
          Nikmati kemudahan memesan menu favorit Anda langsung dari genggaman. Cepat, praktis, dan real-time.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {["☕ Kopi Premium", "🥐 Pastry Segar", "⚡ Pesan Cepat"].map(badge => (
            <span key={badge} className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(245,124,0,0.12)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(245,124,0,0.2)" }}>
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="relative z-10 px-6 pb-10 space-y-3">
        {selectedOutlet ? (
          <>
            <Link
              to={`/shop/${selectedOutlet.businessSlug}/o/${selectedOutlet.code}/menu`}
              className="flex items-center justify-center space-x-2 w-full py-4 px-6 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 20px 60px -10px rgba(245,124,0,0.5)" }}
            >
              <span>☕</span>
              <span>Lanjutkan di {selectedOutlet.name}</span>
            </Link>
            <Link
              to="/shop/outlets"
              className="flex items-center justify-center w-full py-3 text-sm font-semibold transition-colors"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Pilih Outlet Lain →
            </Link>
          </>
        ) : (
          <Link
            to="/shop/outlets"
            className="flex items-center justify-center space-x-2 w-full py-4 px-6 rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 20px 60px -10px rgba(245,124,0,0.5)" }}
          >
            <span>Mulai Pesan Sekarang</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        )}
        <p className="text-center text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          MorrusPOS Customer Storefront • v1.0.0
        </p>
      </div>
    </div>
  );
}
