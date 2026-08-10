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
      description="Kelola voucher single-use dengan kode, minimum spend, limit penggunaan, dan masa berlaku."
    >
      <InlineAlert tone="error" message={error} />
      {isLoading ? (
        <AppLoader label="Memuat voucher..." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Form Voucher</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <select value={form.outletId} onChange={(event) => setForm((current) => ({ ...current, outletId: event.target.value }))} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white">
                <option value="">Pilih outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                ))}
              </select>
              <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Kode voucher" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nama voucher" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              <div className="grid gap-3 md:grid-cols-2">
                <select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as "fixed" | "percentage" }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white">
                  <option value="fixed">Nominal</option>
                  <option value="percentage">Persentase</option>
                </select>
                <input type="number" min="0" step="0.01" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} placeholder="Nilai diskon" className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="number" min="0" step="0.01" value={form.minimumSpend} onChange={(event) => setForm((current) => ({ ...current, minimumSpend: event.target.value }))} placeholder="Minimum spend" className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
                <input type="number" min="0" step="0.01" value={form.maximumDiscountAmount} onChange={(event) => setForm((current) => ({ ...current, maximumDiscountAmount: event.target.value }))} placeholder="Maksimum diskon" className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="number" min="1" step="1" value={form.usageLimitTotal} onChange={(event) => setForm((current) => ({ ...current, usageLimitTotal: event.target.value }))} placeholder="Limit total" className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
                <input type="number" min="1" step="1" value={form.usageLimitPerCode} onChange={(event) => setForm((current) => ({ ...current, usageLimitPerCode: event.target.value }))} placeholder="Limit per kode" className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
                <input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                <label className="inline-flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Aktifkan voucher ini setelah disimpan</span>
                </label>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Kode voucher akan dipakai kasir apa adanya, jadi cek ejaan dan periodenya.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 items-center justify-center self-start rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {form.id ? "Update voucher" : "Tambah voucher"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Voucher</h2>
            <div className="mt-4 space-y-3">
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
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
                      className="text-left"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{voucher.code}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{voucher.name}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Used {voucher.usedCount} / {voucher.usageLimitTotal}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleVoucher(voucher)}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                    >
                      {voucher.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}
