import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useStorefront } from "../../../context/StorefrontContext";
import { useCatalog } from "../../catalog/hooks/useCatalog";

export default function CartPage() {
  const { businessSlug, outletCode } = useParams<{ businessSlug: string; outletCode: string }>();
  const navigate = useNavigate();
  const { cart, updateCartQty, removeFromCart, cartSubtotal, cartTotalItems, syncCartWithCatalog } = useStorefront();
  const { products, isLoading } = useCatalog(businessSlug, outletCode);

  // Sync cart with backend stock when page opens / catalog loads
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      syncCartWithCatalog(products);
    }
  }, [isLoading, products, syncCartWithCatalog]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center font-outfit px-6">
        <div className="text-6xl mb-6" style={{ filter: "grayscale(0.2)" }}>🛒</div>
        <h3 className="text-xl font-black text-white">Keranjang Masih Kosong</h3>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          Yuk, tambahkan menu-menu lezat Morrus Coffee ke keranjang!
        </p>
        <button
          onClick={() => navigate(`/shop/${businessSlug}/o/${outletCode}/menu`)}
          className="mt-8 px-6 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 10px 40px rgba(245,124,0,0.3)" }}
        >
          Lihat Menu ☕
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col font-outfit pb-8">

      {/* Page title + back */}
      <div className="flex items-center justify-between py-5">
        <div>
          <h2 className="text-xl font-black text-white leading-tight">Keranjang Belanja</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{cartTotalItems} item dipilih</p>
        </div>
        <Link
          to={`/shop/${businessSlug}/o/${outletCode}/menu`}
          className="flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Tambah Menu</span>
        </Link>
      </div>

      {/* Responsive grid: items + summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

        {/* Left: Cart items */}
        <div className="md:col-span-2 space-y-3">
          {cart.map((item) => {
            const isMaxStockReached = item.qty >= item.product.qtyOnHand;

            return (
              <div
                key={item.product.id}
                className="flex items-center space-x-4 p-4 rounded-2xl transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Emoji visual */}
                <div className="h-14 w-14 flex-shrink-0 rounded-xl flex items-center justify-center text-3xl"
                  style={{ background: "linear-gradient(145deg, rgba(245,124,0,0.15), rgba(0,0,0,0.1))" }}>
                  {item.product.imageUrl ?? "☕"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{item.product.name}</h4>
                  <p className="text-xs font-bold mt-0.5" style={{ color: "#ffa726" }}>
                    {formatCurrency(item.product.price)}
                  </p>
                  {item.notes && (
                    <p className="text-[10px] mt-1 italic truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                      "{item.notes}"
                    </p>
                  )}
                  {item.product.qtyOnHand <= 5 && (
                    <p className="text-[10px] font-semibold mt-1" style={{ color: "#fbbf24" }}>
                      ⚠️ Stok tersisa {item.product.qtyOnHand} {item.product.unit}
                    </p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex flex-col items-end space-y-2.5">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>

                  {/* Qty stepper */}
                  <div className="flex items-center space-x-2 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-sm transition-all active:scale-90"
                      style={{ background: "rgba(255,255,255,0.08)", color: "white" }}
                    >
                      −
                    </button>
                    <span className="text-xs font-extrabold text-white w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                      disabled={isMaxStockReached}
                      className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-sm transition-all active:scale-90"
                      style={{
                        background: isMaxStockReached ? "transparent" : "rgba(245,124,0,0.2)",
                        color: isMaxStockReached ? "rgba(255,255,255,0.2)" : "#f57c00"
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Summary */}
        <div className="rounded-2xl p-5 space-y-5 sticky top-20"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,124,0,0.15)" }}>
          <h3 className="text-sm font-bold text-white pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            Ringkasan Belanja
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span>Subtotal ({cartTotalItems} item)</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span>Biaya Penanganan</span>
              <span style={{ color: "#4ade80" }}>Gratis</span>
            </div>
            <div className="flex justify-between" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span>Pajak & Servis</span>
              <span>Rp 0</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white pt-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <span>Total Pembayaran</span>
              <span style={{ color: "#f57c00" }}>{formatCurrency(cartSubtotal)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate(`/shop/${businessSlug}/o/${outletCode}/checkout`)}
            className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 20px 60px -10px rgba(245,124,0,0.4)" }}
          >
            Lanjut ke Checkout →
          </button>
        </div>

      </div>
    </div>
  );
}
