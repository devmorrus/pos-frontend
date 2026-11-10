import { useEffect, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import { activateVoucher, createVoucher, deactivateVoucher, getVouchers, updateVoucher } from "../api/pricingApi";
import type { VoucherDto } from "../types/pricing";
import { DocsIcon } from "../../../icons";

export default function VouchersPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const effectiveOutletId = session?.role === "Owner" ? selectedOutletId : session?.outletId ?? selectedOutletId;
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: "",
    outletId: effectiveOutletId ?? "",
    code: "",
    name: "",
    discountType: "fixed" as "fixed" | "percentage",
    discountValue: "10000",
    minimumSpend: "0",
    maximumDiscountAmount: "",
    usageLimitTotal: "1",
    usageLimitPerCode: "1",
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  });

  useEffect(() => {
    setForm((current) => ({ ...current, outletId: current.outletId || effectiveOutletId || "" }));
  }, [effectiveOutletId]);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [outletsResult, vouchersResult] = await Promise.all([
        getOutlets(),
        getVouchers(form.outletId || undefined),
      ]);
      setOutlets(outletsResult);
      setVouchers(vouchersResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat voucher."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [form.outletId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        outletId: form.outletId,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumSpend: Number(form.minimumSpend),
        maximumDiscountAmount: form.maximumDiscountAmount ? Number(form.maximumDiscountAmount) : null,
        usageLimitTotal: Number(form.usageLimitTotal),
        usageLimitPerCode: Number(form.usageLimitPerCode),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        isActive: form.isActive,
      };

      if (form.id) {
        await updateVoucher(form.id, payload);
      } else {
        await createVoucher(payload);
      }
      setForm((current) => ({ ...current, id: "", code: "", name: "" }));
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan voucher."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleVoucher(voucher: VoucherDto) {
    setError(null);
    try {
      if (voucher.isActive) {
        await deactivateVoucher(voucher.id);
      } else {
        await activateVoucher(voucher.id);
      }
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengubah status voucher."));
    }
  }

  return (
    <ProtectedPageShell
      title="Vouchers"
      description="Kelola kode voucher, nilai diskon, batas penggunaan, dan masa berlaku untuk pelanggan Anda."
    >
      <InlineAlert tone="error" message={error} />
      <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><DocsIcon className="h-7 w-7" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Voucher pelanggan</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Satu kode, penawaran istimewa</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Siapkan kode voucher dengan diskon dan ketentuan yang jelas untuk digunakan saat pembayaran.</p></div></div>
      </section>
      {isLoading ? (
        <AppLoader label="Memuat voucher..." />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">Pengaturan voucher</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{form.id ? "Edit voucher" : "Buat voucher baru"}</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Outlet<select value={form.outletId} onChange={(event) => setForm((current) => ({ ...current, outletId: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white">
                <option value="">Pilih outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                ))}
              </select></label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Kode voucher<input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Contoh: BELANJAHEMAT" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 font-mono text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nama voucher<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Contoh: Voucher pelanggan baru" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              <h3 className="border-t border-gray-200 pt-5 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">Diskon & ketentuan</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Jenis diskon<select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as "fixed" | "percentage" }))} className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white">
                  <option value="fixed">Nominal</option>
                  <option value="percentage">Persentase</option>
                </select></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nilai diskon ({form.discountType === "percentage" ? "%" : "Rp"})<input type="number" min="0" step="0.01" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} placeholder="Nilai diskon" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Minimum belanja (Rp)<input type="number" min="0" step="0.01" value={form.minimumSpend} onChange={(event) => setForm((current) => ({ ...current, minimumSpend: event.target.value }))} placeholder="Minimum belanja" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Maks. diskon (Rp, opsional)<input type="number" min="0" step="0.01" value={form.maximumDiscountAmount} onChange={(event) => setForm((current) => ({ ...current, maximumDiscountAmount: event.target.value }))} placeholder="Maksimum diskon" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Batas penggunaan total<input type="number" min="1" step="1" value={form.usageLimitTotal} onChange={(event) => setForm((current) => ({ ...current, usageLimitTotal: event.target.value }))} placeholder="Limit total" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Batas penggunaan per kode<input type="number" min="1" step="1" value={form.usageLimitPerCode} onChange={(event) => setForm((current) => ({ ...current, usageLimitPerCode: event.target.value }))} placeholder="Limit per kode" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              </div>
              <h3 className="border-t border-gray-200 pt-5 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">Periode berlaku</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="min-w-0 text-sm font-medium text-gray-700 dark:text-gray-200">Mulai<input type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="mt-2 h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white dark:[color-scheme:dark]" /></label>
                <label className="min-w-0 text-sm font-medium text-gray-700 dark:text-gray-200">Berakhir<input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="mt-2 h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white dark:[color-scheme:dark]" /></label>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                <label className="inline-flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Aktifkan voucher sesuai periode berlaku</span>
                </label>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Periksa kode, batas penggunaan, dan periode sebelum menyimpan.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                  >
                    {isSubmitting ? "Menyimpan..." : form.id ? "Simpan perubahan" : "Tambah voucher"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Voucher</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pilih kode untuk mengedit, atau kelola status voucher.</p>
            <div className="mt-4 space-y-3">
              {vouchers.length === 0 && <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center dark:border-[#293b58]"><DocsIcon className="mx-auto mb-3 h-9 w-9 text-brand-400" aria-hidden="true" /><p className="font-semibold text-gray-900 dark:text-white">Belum ada voucher</p><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">Buat voucher pertama melalui form di halaman ini.</p></div>}
              {vouchers.map((voucher) => (
                <div key={voucher.id} className={`rounded-2xl border p-5 ${form.id === voucher.id ? "border-brand-400 bg-brand-50/50 dark:bg-brand-500/10" : "border-gray-200 bg-gray-50/50 dark:border-[#293b58] dark:bg-[#111b2c]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({
                        id: voucher.id,
                        outletId: voucher.outletId,
                        code: voucher.code,
                        name: voucher.name,
                        discountType: voucher.discountType,
                        discountValue: String(voucher.discountValue),
                        minimumSpend: String(voucher.minimumSpend),
                        maximumDiscountAmount: voucher.maximumDiscountAmount ? String(voucher.maximumDiscountAmount) : "",
                        usageLimitTotal: String(voucher.usageLimitTotal),
                        usageLimitPerCode: String(voucher.usageLimitPerCode),
                        startAt: voucher.startAt.slice(0, 16),
                        endAt: voucher.endAt.slice(0, 16),
                        isActive: voucher.isActive,
                      })}
                      className="min-w-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
                    >
                      <p className="break-all font-mono font-bold tracking-wide text-brand-600 dark:text-brand-300">{voucher.code}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{voucher.name}</p>
                      <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{voucher.discountType === "percentage" ? `${voucher.discountValue}%` : `Rp ${voucher.discountValue.toLocaleString("id-ID")}`}</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Terpakai {voucher.usedCount} / {voucher.usageLimitTotal} · {voucher.isActive ? "Diaktifkan" : "Nonaktif"}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleVoucher(voucher)}
                      className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-400 dark:border-gray-700 dark:text-gray-200"
                    >
                      {voucher.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </div>
                  <p className="mt-4 border-t border-dashed border-gray-200 pt-3 text-xs leading-5 text-gray-500 dark:border-gray-700 dark:text-gray-400">Minimum belanja Rp {voucher.minimumSpend.toLocaleString("id-ID")}<br />{new Date(voucher.startAt).toLocaleString("id-ID")} — {new Date(voucher.endAt).toLocaleString("id-ID")}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}
