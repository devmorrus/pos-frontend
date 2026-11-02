import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useStorefront } from "../../../context/StorefrontContext";
import { useCatalog } from "../hooks/useCatalog";
import { getCategoryEmoji } from "../utils/catalogUtils";

export default function ProductDetailPage() {
  const { businessSlug, outletCode, productId } = useParams<{ businessSlug: string; outletCode: string; productId: string }>();
  const navigate = useNavigate();
  const { addToCart, cart } = useStorefront();
  const { products, isLoading, error } = useCatalog(businessSlug, outletCode);

  const product = products.find((p) => p.id === productId);
  const inCartQty = cart.find((item) => item.product.id === productId)?.qty ?? 0;
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  // Reset qty saat produk berubah
  useEffect(() => {
    setQty(1);
  }, [productId]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4">
        <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(245,124,0,0.3)", borderTopColor: "#f57c00" }} />
        <p className="text-sm font-outfit" style={{ color: "rgba(255,255,255,0.4)" }}>Memuat detail produk...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center font-outfit space-y-4">
        <div className="text-5xl">⚠️</div>
        <h3 className="text-base font-bold text-white">Gagal Memuat Menu</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{error}</p>
        <Link to={`/shop/${businessSlug}/o/${outletCode}/menu`}
          className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "rgba(245,124,0,0.2)", border: "1px solid rgba(245,124,0,0.3)" }}>
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  // Not found
  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center font-outfit">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-lg font-bold text-white">Produk Tidak Ditemukan</h3>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Menu yang Anda cari tidak tersedia di outlet ini.</p>
        <Link to={`/shop/${businessSlug}/o/${outletCode}/menu`}
          className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "rgba(245,124,0,0.2)", border: "1px solid rgba(245,124,0,0.3)" }}>
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  const isOos = product.qtyOnHand === 0;
  const maxAvailable = product.qtyOnHand - inCartQty;
  const isCartFull = maxAvailable <= 0;
  const emoji = getCategoryEmoji(product.categoryName);

  const handleIncrement = () => { if (qty < maxAvailable) setQty((prev) => prev + 1); };
  const handleDecrement = () => { if (qty > 1) setQty((prev) => prev - 1); };

  const handleAddToCart = () => {
    if (isOos || isCartFull) return;
    addToCart({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.basePrice,
      unit: product.unit,
      qtyOnHand: product.qtyOnHand,
      categoryName: product.categoryName ?? undefined,
      imageUrl: emoji,
    }, qty, notes);
    navigate(`/shop/${businessSlug}/o/${outletCode}/menu`);
  };

  return (
    <div className="flex-1 flex flex-col font-outfit pb-8">

      {/* Back button */}
      <div className="mb-5">
        <Link
          to={`/shop/${businessSlug}/o/${outletCode}/menu`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>Kembali ke Menu</span>
        </Link>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">

        {/* Left: Product Visual */}
        <div className="w-full aspect-square rounded-3xl flex items-center justify-center text-[120px] relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, rgba(245,124,0,0.12) 0%, rgba(0,0,0,0.2) 100%)", border: "1px solid rgba(245,124,0,0.15)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at center, rgba(245,124,0,0.15), transparent 70%)" }} />
          <span className="relative select-none" style={{ filter: "drop-shadow(0 10px 40px rgba(245,124,0,0.3))" }}>{emoji}</span>
          {isOos && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
              <span className="text-lg font-black text-white/80">Stok Habis</span>
            </div>
          )}
        </div>

        {/* Right: Info + Actions */}
        <div className="space-y-5">

          {/* Category + Name + Price */}
          <div>
            {product.categoryName && (
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: "rgba(245,124,0,0.15)", color: "#ffa726", border: "1px solid rgba(245,124,0,0.2)" }}>
                {product.categoryName}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">
              {product.name}
            </h2>
            <p className="text-2xl font-extrabold mt-2" style={{ color: "#f57c00" }}>
              {formatCurrency(product.basePrice)}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              per {product.unit}
            </p>

            {/* Availability badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {isOos ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                  Stok Habis
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>
                  ✓ Tersedia ({product.qtyOnHand} {product.unit})
                </span>
              )}
              {inCartQty > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(245,124,0,0.1)", color: "#ffa726", border: "1px solid rgba(245,124,0,0.2)" }}>
                  🛒 {inCartQty} di Keranjang
                </span>
              )}
            </div>
          </div>

          {/* SKU */}
          <div className="py-3 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h4 className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Kode Produk</h4>
            <p className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{product.sku}</p>
          </div>

          {/* Notes input */}
          {!isOos && (
            <div className="space-y-2">
              <label htmlFor="notes-detail" className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                Catatan Pesanan (Opsional)
              </label>
              <textarea
                id="notes-detail"
                placeholder="Contoh: Kurang manis, es dipisah, ekstra shot..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full p-3.5 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none resize-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", caretColor: "#f57c00" }}
              />
            </div>
          )}

          {/* Qty picker + Add to Cart */}
          <div className="space-y-4">
            {!isOos && !isCartFull && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Jumlah Pesanan:</span>
                <div className="flex items-center space-x-4 p-1.5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <button onClick={handleDecrement} disabled={qty <= 1}
                    className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-lg transition-all active:scale-90"
                    style={{ background: qty <= 1 ? "transparent" : "rgba(255,255,255,0.08)", color: qty <= 1 ? "rgba(255,255,255,0.2)" : "white" }}>
                    −
                  </button>
                  <span className="text-base font-black text-white w-6 text-center">{qty}</span>
                  <button onClick={handleIncrement} disabled={qty >= maxAvailable}
                    className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-lg transition-all active:scale-90"
                    style={{ background: qty >= maxAvailable ? "transparent" : "rgba(245,124,0,0.2)", color: qty >= maxAvailable ? "rgba(255,255,255,0.2)" : "#f57c00" }}>
                    +
                  </button>
                </div>
              </div>
            )}

            {/* CTA */}
            {isOos ? (
              <button disabled className="w-full py-4 px-6 rounded-2xl font-bold text-base cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
                Stok Habis
              </button>
            ) : isCartFull ? (
              <div className="space-y-3">
                <p className="text-xs text-center font-semibold py-2.5 px-4 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.15)" }}>
                  Semua stok sudah ditambahkan ke keranjang.
                </p>
                <Link to={`/shop/${businessSlug}/o/${outletCode}/cart`}
                  className="block w-full text-center py-4 px-6 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 20px 60px -10px rgba(245,124,0,0.4)" }}>
                  Lihat Keranjang Belanja →
                </Link>
              </div>
            ) : (
              <button onClick={handleAddToCart}
                className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white transition-all active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 20px 60px -10px rgba(245,124,0,0.4)" }}>
                Tambah ke Keranjang • {formatCurrency(product.basePrice * qty)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
