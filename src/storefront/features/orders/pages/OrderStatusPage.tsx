import { useParams, Link } from "react-router";
import { useStorefront } from "../../../context/StorefrontContext";

const STEPS = [
  { label: "Pesanan Diterima", time: "Baru saja", desc: "Pesanan berhasil dikirim ke outlet.", status: "done" },
  { label: "Dikonfirmasi Kasir", time: "1 menit lalu", desc: "Kasir telah menerima & memproses transaksi.", status: "done" },
  { label: "Sedang Diracik Dapur", time: "Sedang berjalan", desc: "Menu sedang disiapkan oleh barista kami.", status: "active" },
  { label: "Siap Diambil", time: "Menunggu", desc: "Silakan ambil pesanan Anda di konter.", status: "pending" },
];

export default function OrderStatusPage() {
  const { businessSlug, orderId, outletCode } = useParams<{ businessSlug: string; orderId: string; outletCode: string }>();
  const { customerInfo, selectedOutlet } = useStorefront();

  const clientName = customerInfo?.name ?? "Pelanggan Morrus";
  const clientPhone = customerInfo?.phone ?? "-";
  const method = customerInfo?.fulfillmentMethod ?? "pickup";
  const outletName = selectedOutlet?.name ?? "Morrus Coffee";
  const outletPhone = selectedOutlet?.phone ?? "081234567890";

  const getWhatsAppLink = () => {
    const text = `Halo Morrus Coffee, saya ingin menanyakan status pesanan *${orderId}* atas nama *${clientName}*.`;
    return `https://wa.me/${outletPhone.replace(/^0/, "62")}?text=${encodeURIComponent(text)}`;
  };

  const methodLabels: Record<string, string> = { "dine-in": "Dine-in", "pickup": "Pickup", "delivery": "Delivery" };
  const methodIcons: Record<string, string> = { "dine-in": "🪑", "pickup": "🏃", "delivery": "🛵" };

  return (
    <div className="flex-1 flex flex-col font-outfit pb-8">
      <div className="max-w-2xl w-full mx-auto space-y-5 pt-4">

        {/* ── Success hero ── */}
        <div className="text-center py-8 px-6 rounded-3xl relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, rgba(245,124,0,0.12), rgba(0,0,0,0.2))", border: "1px solid rgba(245,124,0,0.2)" }}>
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(245,124,0,0.15), transparent 60%)" }} />

          <div className="relative mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-5"
            style={{ background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.3)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-7 h-7" style={{ color: "#4ade80" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h2 className="text-xl font-black text-white">Pesanan Berhasil Dibuat! 🎉</h2>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            Tunjukkan nomor invoice ini kepada kasir saat mengambil pesanan
          </p>

          {/* Invoice ID */}
          <div className="mt-5 flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(245,124,0,0.2)" }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Nomor Invoice</span>
            <span className="text-sm font-extrabold" style={{ color: "#ffa726", letterSpacing: "0.05em" }}>{orderId}</span>
          </div>
        </div>

        {/* ── Timeline status ── */}
        <div className="p-5 rounded-3xl space-y-4"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-sm font-bold text-white pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            ⏳ Status Pengerjaan
          </h3>

          <div className="relative pl-8 space-y-6">
            {/* Vertical connector */}
            <div className="absolute left-3.5 top-2 bottom-2 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

            {STEPS.map((step, idx) => (
              <div key={idx} className="relative flex items-start space-x-4">
                {/* Node */}
                <div
                  className="absolute -left-8 mt-0.5 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={
                    step.status === "done"
                      ? { background: "#f57c00", border: "2px solid #ffa726" }
                      : step.status === "active"
                      ? { background: "rgba(245,124,0,0.15)", border: "2px solid #f57c00", boxShadow: "0 0 12px rgba(245,124,0,0.4)" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }
                  }
                >
                  {step.status === "done" && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {step.status === "active" && (
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#f57c00" }} />
                  )}
                  {step.status === "pending" && (
                    <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-xs font-bold" style={{ color: step.status === "pending" ? "rgba(255,255,255,0.3)" : "white" }}>
                      {step.label}
                    </h4>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{step.time}</span>
                  </div>
                  <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: step.status === "pending" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)" }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Customer detail ── */}
        <div className="p-5 rounded-3xl space-y-3"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-sm font-bold text-white pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            📋 Rincian Pengambilan
          </h3>
          <div className="grid grid-cols-2 gap-y-3 text-xs">
            {[
              { label: "Nama", value: clientName },
              { label: "Telepon", value: clientPhone },
              { label: "Metode", value: `${methodIcons[method]} ${methodLabels[method]}` },
              { label: "Outlet", value: outletName },
            ].map(row => (
              <div key={row.label} className="contents">
                <span style={{ color: "rgba(255,255,255,0.4)" }}>{row.label}</span>
                <span className="text-right font-semibold text-white truncate">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="space-y-3 pt-2">
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2.5 py-4 px-6 rounded-2xl font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #25d366, #128c7e)", boxShadow: "0 10px 40px rgba(37,211,102,0.2)" }}
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.536 0 10.04-4.5 10.04-10.04 0-2.682-1.04-5.2-2.93-7.09-1.89-1.89-4.407-2.93-7.09-2.93-5.54 0-10.04 4.5-10.04 10.04.002 1.558.486 3.08 1.402 4.41l-.995 3.635 3.733-.979zM17.476 14.41c-.299-.149-1.778-.878-2.057-.98-.28-.1-.484-.149-.685.15-.2.3-.778.98-.955 1.18-.178.2-.355.225-.655.075-3.002-1.5-5.05-2.696-6.59-5.35-.405-.7-.101-1.08.199-1.38.271-.27.6-.7.9-1.05.1-.1.15-.225.2-.375.05-.15.025-.275-.012-.35-.038-.075-.325-.785-.45-1.085-.125-.3-.275-.255-.375-.26-.098-.005-.213-.005-.33-.005s-.3.044-.457.213c-.157.17-1.002.98-1.002 2.39 0 1.41 1.028 2.77 1.17 2.96.143.19 2.023 3.1 4.898 4.34 2.096.907 2.9.988 3.93.837.625-.09 1.778-.727 2.027-1.43.248-.7.248-1.3.172-1.43-.076-.13-.279-.23-.579-.38z" />
            </svg>
            <span>Hubungi Kasir via WhatsApp</span>
          </a>

          <Link
            to={`/shop/${businessSlug}/o/${outletCode}/menu`}
            className="w-full flex items-center justify-center py-4 px-6 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
          >
            ← Kembali ke Menu
          </Link>
        </div>

      </div>
    </div>
  );
}
