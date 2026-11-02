import { Outlet, useNavigate, useParams } from "react-router";
import { useStorefront } from "../context/StorefrontContext";

export default function CheckoutLayout() {
  const navigate = useNavigate();
  const { businessSlug, outletCode } = useParams<{ businessSlug?: string; outletCode?: string }>();
  const { selectedOutlet } = useStorefront();

  const handleBack = () => {
    if (selectedOutlet) navigate(`/shop/${selectedOutlet.businessSlug}/o/${selectedOutlet.code}/cart`);
    else if (businessSlug && outletCode) navigate(`/shop/${businessSlug}/o/${outletCode}/cart`);
    else navigate("/shop");
  };

  return (
    <div className="min-h-screen flex flex-col font-outfit" style={{ background: "linear-gradient(135deg, #1c0e05 0%, #2e1810 40%, #1a0f06 100%)" }}>
      
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(15,8,3,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(245,124,0,0.12)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>Keranjang</span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)" }}>M</div>
            <span className="text-sm font-bold text-white hidden sm:block">Checkout</span>
          </div>

          <div className="w-20" />
        </div>
      </header>

      {/* Amber progress bar */}
      <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full w-2/3 rounded-r-full transition-all duration-500"
          style={{ background: "linear-gradient(90deg, #ffa726, #f57c00)" }} />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
