import { Outlet, Link, useParams, useLocation } from "react-router";
import { useStorefront } from "../context/StorefrontContext";

export default function StorefrontLayout() {
  const { selectedOutlet, cartTotalItems, cartSubtotal } = useStorefront();
  const { businessSlug, outletCode } = useParams<{ businessSlug?: string; outletCode?: string }>();
  const location = useLocation();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const isCartPage = location.pathname.includes("/cart");
  const isCheckoutPage = location.pathname.includes("/checkout");
  const isOrderPage = location.pathname.includes("/orders");
  const showFloatingCart = cartTotalItems > 0 && !isCartPage && !isCheckoutPage && !isOrderPage && selectedOutlet;

  return (
    <div className="min-h-screen flex flex-col font-outfit" style={{ background: "linear-gradient(135deg, #1c0e05 0%, #2e1810 40%, #1a0f06 100%)" }}>
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(15,8,3,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(245,124,0,0.15)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <Link to="/shop" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0 transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #f57c00, #e65100)" }}>
              M
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white leading-tight tracking-tight">Morrus Coffee</p>
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: "#f57c00" }}>Digital Menu</p>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center space-x-2">
            {selectedOutlet && (
              <Link
                to="/shop/outlets"
                className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                style={{ color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,124,0,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5" style={{ color: "#f57c00" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="max-w-[120px] truncate">{selectedOutlet.name}</span>
              </Link>
            )}

            {selectedOutlet && (
              <Link
                to={`/shop/${businessSlug || selectedOutlet.businessSlug}/o/${outletCode || selectedOutlet.code}/cart`}
                className="relative flex items-center justify-center h-10 w-10 rounded-xl transition-all"
                style={{ background: cartTotalItems > 0 ? "rgba(245,124,0,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(245,124,0,0.25)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" style={{ color: cartTotalItems > 0 ? "#f57c00" : "rgba(255,255,255,0.5)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {cartTotalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center" style={{ background: "#f57c00" }}>
                    {cartTotalItems}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* ── FLOATING CART CTA ── */}
      {showFloatingCart && (
        <div className="fixed bottom-5 right-4 sm:right-6 left-4 sm:left-auto sm:w-80 z-40" style={{ animation: "slideUp 0.3s ease" }}>
          <Link
            to={`/shop/${businessSlug || selectedOutlet.businessSlug}/o/${outletCode || selectedOutlet.code}/cart`}
            className="flex items-center justify-between w-full px-5 py-4 rounded-2xl text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #f57c00, #e65100)", boxShadow: "0 20px 60px -10px rgba(245,124,0,0.5), 0 4px 16px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center space-x-3">
              <div className="relative bg-white/20 p-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 bg-white h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ color: "#f57c00" }}>
                  {cartTotalItems}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-white/70 font-medium leading-none">Keranjang Belanja</p>
                <p className="text-sm font-extrabold mt-0.5 leading-none">{formatCurrency(cartSubtotal)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-xl">
              <span>Lihat</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
