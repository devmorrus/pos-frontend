import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useStorefront } from "../../../context/StorefrontContext";
import { useCatalog } from "../hooks/useCatalog";
import { getStockStatus } from "../types";
import type { PublicProduct } from "../types";
import { fetchOutletByCode } from "../../outlets/api/outletApi";
import { getCategoryEmoji } from "../utils/catalogUtils";

function toStorefrontProduct(p: PublicProduct) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.basePrice,
    unit: p.unit,
    qtyOnHand: p.qtyOnHand,
    categoryName: p.categoryName ?? undefined,
    imageUrl: getCategoryEmoji(p.categoryName),
  };
}

export default function MenuPage() {
  const { businessSlug, outletCode } = useParams<{ businessSlug: string; outletCode: string }>();
  const { selectedOutlet, setSelectedOutlet, addToCart, cart, syncCartWithCatalog } = useStorefront();
  const { products, categories, isLoading, error, refetch } = useCatalog(businessSlug, outletCode);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  // Restore outlet context dari URL jika hilang (misal saat page reload)
  useEffect(() => {
    if (!businessSlug || !outletCode) return;
    if (selectedOutlet?.businessSlug === businessSlug && selectedOutlet.code === outletCode) return;

    fetchOutletByCode(businessSlug, outletCode)
      .then((outlet) => {
        setSelectedOutlet({
          id: outlet.id,
          businessSlug: outlet.businessSlug,
          code: outlet.code,
          name: outlet.name,
          address: outlet.address ?? undefined,
          phone: outlet.phone ?? undefined,
        });
      })
      .catch(() => {
        // Abaikan error — halaman masih bisa jalan tanpa outlet context
      });
  }, [businessSlug, outletCode, selectedOutlet, setSelectedOutlet]);

  // Sinkronisasi cart dengan stok terbaru dari backend setelah catalog dimuat
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      syncCartWithCatalog(products);
    }
  }, [isLoading, products, syncCartWithCatalog]);

  // Filter produk client-side
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !activeCategory || p.categoryId === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

  const handleAddToCart = (product: PublicProduct) => {
    addToCart(toStorefrontProduct(product), 1);
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="flex-1 flex flex-col font-outfit pb-24">

      {/* Search + Filter */}
      <div className="sticky top-[64px] z-20 pt-4 pb-3 space-y-3"
        style={{ background: "rgba(15,8,3,0.92)", backdropFilter: "blur(16px)" }}>
        
        {/* Search input */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            placeholder="Cari menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", caretColor: "#f57c00" }}
          />
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={
                activeCategory === null
                  ? { background: "linear-gradient(135deg, #ffa726, #f57c00)", color: "white" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                style={
                  activeCategory === cat.id
                    ? { background: "linear-gradient(135deg, #ffa726, #f57c00)", color: "white" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-16">
          <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(245,124,0,0.3)", borderTopColor: "#f57c00" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Memuat menu...</p>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h3 className="text-base font-bold text-white">Gagal Memuat Menu</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{error}</p>
          <button onClick={refetch}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 8px 30px rgba(245,124,0,0.3)" }}>
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty catalog (outlet has no products in DB) */}
      {!isLoading && !error && products.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
          <div className="text-6xl mb-2" style={{ filter: "drop-shadow(0 10px 30px rgba(245,124,0,0.2))" }}>☕</div>
          <h3 className="text-lg font-extrabold text-white">Belum Ada Menu Tersedia</h3>
          <p className="text-sm max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            Outlet ini belum memiliki daftar menu yang dapat dipesan. Silakan pilih outlet lain.
          </p>
          <Link
            to="/shop/outlets"
            className="mt-4 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 10px 35px rgba(245,124,0,0.3)" }}
          >
            🏪 Pilih Outlet Lain
          </Link>
        </div>
      )}

      {/* Empty search result */}
      {!isLoading && !error && products.length > 0 && filteredProducts.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-sm font-bold text-white">Tidak ada menu yang cocok</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Coba kata kunci atau kategori lain</p>
        </div>
      )}

      {/* Product grid */}
      {!isLoading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.qtyOnHand);
            const isOos = stockStatus === "out_of_stock";
            const isLow = stockStatus === "low";
            const inCart = cart.find((i) => i.product.id === product.id)?.qty ?? 0;
            const justAdded = addedIds.has(product.id);

            return (
              <div
                key={product.id}
                className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  opacity: isOos ? 0.6 : 1,
                }}
              >
                {/* Image area */}
                <Link to={`/shop/${businessSlug}/o/${outletCode}/products/${product.id}`} className="block">
                  <div className="aspect-square flex items-center justify-center text-4xl relative"
                    style={{ background: "linear-gradient(145deg, rgba(245,124,0,0.1), rgba(0,0,0,0.15))" }}>
                    <span className="select-none" style={{ filter: isOos ? "grayscale(0.7)" : "none" }}>
                      {getCategoryEmoji(product.categoryName)}
                    </span>

                    {/* Stock badge */}
                    <div className="absolute top-2 right-2">
                      {isOos && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                          Habis
                        </span>
                      )}
                      {isLow && !isOos && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.2)" }}>
                          Sisa {product.qtyOnHand}
                        </span>
                      )}
                    </div>

                    {/* In cart indicator */}
                    {inCart > 0 && (
                      <div className="absolute top-2 left-2 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white"
                        style={{ background: "#f57c00" }}>
                        {inCart}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex flex-col flex-1 p-3 space-y-2">
                  <Link to={`/shop/${businessSlug}/o/${outletCode}/products/${product.id}`}>
                    <p className="text-xs font-bold text-white leading-tight line-clamp-2 group-hover:text-amber-300 transition-colors">
                      {product.name}
                    </p>
                  </Link>
                  <p className="text-xs font-extrabold" style={{ color: "#ffa726" }}>
                    {formatCurrency(product.basePrice)}
                  </p>

                  {/* Add button */}
                  <button
                    onClick={() => !isOos && handleAddToCart(product)}
                    disabled={isOos}
                    className="mt-auto w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.97]"
                    style={
                      isOos
                        ? { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)", cursor: "not-allowed" }
                        : justAdded
                        ? { background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }
                        : { background: "linear-gradient(135deg, rgba(255,167,38,0.2), rgba(245,124,0,0.1))", color: "#ffa726", border: "1px solid rgba(245,124,0,0.25)" }
                    }
                  >
                    {isOos ? "Stok Habis" : justAdded ? "✓ Ditambahkan" : "+ Tambah"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating cart CTA */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 w-full max-w-md">
          <Link
            to={`/shop/${businessSlug}/o/${outletCode}/cart`}
            className="flex items-center justify-between w-full px-5 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 20px 60px -10px rgba(245,124,0,0.5)" }}
          >
            <div className="flex items-center space-x-2">
              <span className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                {cartCount}
              </span>
              <span>Lihat Keranjang</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
