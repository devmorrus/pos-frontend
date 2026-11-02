import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useStorefront, type CustomerInfo } from "../../../context/StorefrontContext";

const FULFILLMENT_OPTIONS = [
  { key: "pickup" as const, label: "Pickup", icon: "🏃", desc: "Ambil langsung di konter" },
  { key: "dine-in" as const, label: "Dine-In", icon: "🪑", desc: "Makan di tempat, infokan nomor meja" },
  { key: "delivery" as const, label: "Delivery", icon: "🛵", desc: "Antar ke lokasi Anda" },
];

export default function CheckoutPage() {
  const { businessSlug, outletCode } = useParams<{ businessSlug: string; outletCode: string }>();
  const navigate = useNavigate();
  const { cart, cartSubtotal, cartTotalItems, customerInfo, setCustomerInfo, clearCart } = useStorefront();

  const [name, setName] = useState(customerInfo?.name ?? "");
  const [phone, setPhone] = useState(customerInfo?.phone ?? "");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"dine-in" | "pickup" | "delivery">(customerInfo?.fulfillmentMethod ?? "pickup");
  const [notes, setNotes] = useState(customerInfo?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Nama lengkap harus diisi.";
    if (!phone.trim()) nextErrors.phone = "Nomor telepon harus diisi.";
    else if (!/^[0-9+\-\s]{8,15}$/.test(phone)) nextErrors.phone = "Nomor telepon tidak valid.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !validateForm()) return;
    setIsSubmitting(true);
    setCustomerInfo({ name, phone, fulfillmentMethod, notes } as CustomerInfo);
    setTimeout(() => {
      setIsSubmitting(false);
      clearCart();
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      navigate(`/shop/${businessSlug}/o/${outletCode}/orders/INV-${datePart}-${randomPart}`);
    }, 1500);
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center font-outfit">
        <div className="text-5xl mb-4">🛒</div>
        <h3 className="text-lg font-bold text-white">Keranjang Kosong</h3>
        <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Tambahkan produk sebelum checkout.</p>
        <Link to={`/shop/${businessSlug}/o/${outletCode}/menu`} className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "rgba(245,124,0,0.2)", border: "1px solid rgba(245,124,0,0.3)" }}>
          Lihat Menu
        </Link>
      </div>
    );
  }

  const inputClass = () =>
    `w-full p-3.5 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all`;
  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    background: hasError ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${hasError ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
    caretColor: "#f57c00",
  });

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col font-outfit pb-8">

      {/* Page title */}
      <div className="py-5">
        <h2 className="text-xl font-black text-white">Checkout</h2>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Lengkapi data diri & metode pemesanan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

        {/* Left: Form */}
        <div className="md:col-span-2 space-y-4">

          {/* Customer data */}
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="text-sm font-bold text-white pb-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              👤 Data Diri Pelanggan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name-input" className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Nama Lengkap
                </label>
                <input
                  id="name-input" type="text" placeholder="Contoh: Budi Santoso"
                  value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting}
                  className={inputClass()} style={inputStyle(!!errors.name)}
                />
                {errors.name && <p className="text-[10px] font-bold" style={{ color: "#f87171" }}>{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone-input" className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  id="phone-input" type="tel" placeholder="Contoh: 081234567890"
                  value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSubmitting}
                  className={inputClass()} style={inputStyle(!!errors.phone)}
                />
                {errors.phone && <p className="text-[10px] font-bold" style={{ color: "#f87171" }}>{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Fulfillment method */}
          <div className="p-5 rounded-2xl space-y-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="text-sm font-bold text-white pb-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              🚀 Metode Pemesanan
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {FULFILLMENT_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFulfillmentMethod(opt.key)}
                  disabled={isSubmitting}
                  className="flex flex-col items-center py-4 px-2 rounded-2xl transition-all duration-200 space-y-1"
                  style={
                    fulfillmentMethod === opt.key
                      ? { background: "linear-gradient(135deg, rgba(255,167,38,0.2), rgba(245,124,0,0.1))", border: "1px solid rgba(245,124,0,0.4)", color: "#ffa726" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span className="text-[9px] leading-tight text-center opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="p-5 rounded-2xl space-y-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <label htmlFor="checkout-notes" className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              📝 Catatan Tambahan (Opsional)
            </label>
            <textarea
              id="checkout-notes"
              placeholder="Instruksi tambahan untuk kasir atau dapur..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              className="w-full p-3.5 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none resize-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", caretColor: "#f57c00" }}
            />
          </div>
        </div>

        {/* Right: Summary + Submit */}
        <div className="rounded-2xl p-5 space-y-5 sticky top-20"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,124,0,0.15)" }}>
          <h3 className="text-sm font-bold text-white pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            Detail Pesanan
          </h3>

          {/* Item list */}
          <div className="space-y-0 divide-y max-h-52 overflow-y-auto pr-1" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between py-2.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                <span className="flex-1 truncate pr-2">{item.product.name}</span>
                <span className="w-8 text-center">×{item.qty}</span>
                <span className="w-16 text-right font-semibold text-white">{formatCurrency(item.product.price * item.qty)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2.5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              <span>Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white">
              <span>Total ({cartTotalItems} item)</span>
              <span style={{ color: "#f57c00" }}>{formatCurrency(cartSubtotal)}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white flex items-center justify-center space-x-2.5 transition-all active:scale-[0.98] disabled:opacity-80"
            style={{ background: "linear-gradient(135deg, #ffa726, #f57c00)", boxShadow: "0 20px 60px -10px rgba(245,124,0,0.4)" }}
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Pesan Sekarang • {formatCurrency(cartSubtotal)}</span>
            )}
          </button>
        </div>

      </div>
    </form>
  );
}
