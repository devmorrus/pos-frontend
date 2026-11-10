import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import {
  createServiceChargeRule,
  createTaxRule,
  getServiceChargeRules,
  getTaxRules,
  updateServiceChargeRule,
  updateTaxRule,
} from "../api/pricingApi";
import type { ServiceChargeRuleDto, TaxRuleDto } from "../types/pricing";
import { DocsIcon, DollarLineIcon } from "../../../icons";

function resolveDefaultOutletId(role: string | undefined, selectedOutletId: string | null, sessionOutletId: string | null | undefined) {
  if (role === "Owner") {
    return selectedOutletId;
  }

  return sessionOutletId ?? selectedOutletId;
}

export default function PricingRulesPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRuleDto[]>([]);
  const [serviceRules, setServiceRules] = useState<ServiceChargeRuleDto[]>([]);
  const [selectedRuleOutletId, setSelectedRuleOutletId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [taxForm, setTaxForm] = useState({
    id: "",
    name: "",
    rate: "11",
    isActive: true,
    appliesBeforeServiceCharge: true,
  });
  const [serviceForm, setServiceForm] = useState({
    id: "",
    name: "",
    rate: "5",
    isActive: true,
  });

  const effectiveOutletId = useMemo(
    () => resolveDefaultOutletId(session?.role, selectedOutletId, session?.outletId),
    [selectedOutletId, session?.outletId, session?.role],
  );

  useEffect(() => {
    setSelectedRuleOutletId((current) => current ?? effectiveOutletId);
  }, [effectiveOutletId]);

  async function loadData() {
    if (!effectiveOutletId && session?.role === "Owner") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [outletsResult, taxRulesResult, serviceRulesResult] = await Promise.all([
        getOutlets(),
        getTaxRules(selectedRuleOutletId ?? effectiveOutletId ?? undefined),
        getServiceChargeRules(selectedRuleOutletId ?? effectiveOutletId ?? undefined),
      ]);
      setOutlets(outletsResult);
      setTaxRules(taxRulesResult);
      setServiceRules(serviceRulesResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat aturan pricing."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [selectedRuleOutletId, effectiveOutletId]);

  async function handleTaxSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRuleOutletId) {
      setError("Pilih outlet terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (taxForm.id) {
        await updateTaxRule(taxForm.id, {
          outletId: selectedRuleOutletId,
          name: taxForm.name,
          rate: Number(taxForm.rate),
          isActive: taxForm.isActive,
          appliesBeforeServiceCharge: taxForm.appliesBeforeServiceCharge,
        });
      } else {
        await createTaxRule({
          outletId: selectedRuleOutletId,
          name: taxForm.name,
          rate: Number(taxForm.rate),
          isActive: taxForm.isActive,
          appliesBeforeServiceCharge: taxForm.appliesBeforeServiceCharge,
        });
      }
      setTaxForm({ id: "", name: "", rate: "11", isActive: true, appliesBeforeServiceCharge: true });
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan tax rule."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleServiceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRuleOutletId) {
      setError("Pilih outlet terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (serviceForm.id) {
        await updateServiceChargeRule(serviceForm.id, {
          outletId: selectedRuleOutletId,
          name: serviceForm.name,
          rate: Number(serviceForm.rate),
          isActive: serviceForm.isActive,
        });
      } else {
        await createServiceChargeRule({
          outletId: selectedRuleOutletId,
          name: serviceForm.name,
          rate: Number(serviceForm.rate),
          isActive: serviceForm.isActive,
        });
      }
      setServiceForm({ id: "", name: "", rate: "5", isActive: true });
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan service charge rule."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Tax & Service"
      description="Atur pajak dan biaya layanan per outlet agar perhitungan transaksi sesuai kebutuhan bisnis Anda."
    >
      <InlineAlert tone="error" message={error} />

      <section className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><DollarLineIcon className="h-7 w-7" aria-hidden="true" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Pajak & biaya layanan</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Pengaturan tarif yang lebih terarah</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Pilih outlet, tentukan tarif, lalu kelola aturan yang digunakan saat pembayaran. Pajak diatur secara eksklusif, di luar harga produk.</p></div>
        </div>
      </section>

      <div className="flex flex-col gap-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold text-gray-900 dark:text-white">Outlet pengaturan</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Aturan yang ditampilkan dan disimpan mengikuti outlet pilihan.</p></div>
        <label className="block max-w-md">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Outlet</span>
          <select
            value={selectedRuleOutletId ?? ""}
            onChange={(event) => setSelectedRuleOutletId(event.target.value)}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white sm:min-w-64"
          >
            <option value="">Pilih outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <AppLoader label="Memuat aturan pricing..." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><DocsIcon className="h-5 w-5" aria-hidden="true" /></div><div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aturan pajak</h2><p className="text-xs text-gray-500 dark:text-gray-400">Tarif pajak dan urutan perhitungan</p></div></div>
            <form className="mt-4 space-y-4" onSubmit={handleTaxSubmit}>
              <label htmlFor="tax-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nama aturan</label>
              <input
                id="tax-name"
                value={taxForm.name}
                onChange={(event) => setTaxForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Contoh: PPN"
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
              <label htmlFor="tax-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tarif pajak (%)</label>
              <input
                id="tax-rate"
                type="number"
                min="0"
                step="0.01"
                value={taxForm.rate}
                onChange={(event) => setTaxForm((current) => ({ ...current, rate: event.target.value }))}
                placeholder="Rate pajak (%)"
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-lg font-semibold text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                <div className="flex flex-col gap-3">
                  <label className="inline-flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={taxForm.isActive}
                      onChange={(event) => setTaxForm((current) => ({ ...current, isActive: event.target.checked }))}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Aktifkan aturan pajak</span>
                  </label>
                  <label className="inline-flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={taxForm.appliesBeforeServiceCharge}
                      onChange={(event) => setTaxForm((current) => ({ ...current, appliesBeforeServiceCharge: event.target.checked }))}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Hitung pajak sebelum biaya layanan</span>
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Periksa outlet, nama, dan tarif sebelum menyimpan.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {taxForm.id ? "Simpan perubahan" : "Tambah aturan pajak"}
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-6 space-y-3">
              <div className="border-t border-gray-200 pt-5 dark:border-gray-800"><h3 className="text-sm font-semibold text-gray-900 dark:text-white">Daftar aturan pajak</h3><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pilih aturan untuk mengubah pengaturannya.</p></div>
              {taxRules.length === 0 && <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Belum ada aturan pajak untuk outlet ini.</p>}
              {taxRules.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setTaxForm({
                    id: rule.id,
                    name: rule.name,
                    rate: String(rule.rate),
                    isActive: rule.isActive,
                    appliesBeforeServiceCharge: rule.appliesBeforeServiceCharge,
                  })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left transition hover:border-brand-400 hover:bg-brand-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-[#293b58] dark:bg-[#111b2c] dark:hover:bg-brand-500/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{rule.name}</span>
                    <span className="rounded-xl bg-brand-50 px-3 py-1 text-lg font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">{rule.rate}%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{rule.isActive ? "Aktif" : "Nonaktif"}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300"><DollarLineIcon className="h-5 w-5" aria-hidden="true" /></div><div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Biaya layanan</h2><p className="text-xs text-gray-500 dark:text-gray-400">Tarif layanan tambahan per transaksi</p></div></div>
            <form className="mt-4 space-y-4" onSubmit={handleServiceSubmit}>
              <label htmlFor="service-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nama aturan</label>
              <input
                id="service-name"
                value={serviceForm.name}
                onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Contoh: Biaya layanan restoran"
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
              <label htmlFor="service-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tarif biaya layanan (%)</label>
              <input
                id="service-rate"
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.rate}
                onChange={(event) => setServiceForm((current) => ({ ...current, rate: event.target.value }))}
                placeholder="Rate service charge (%)"
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-lg font-semibold text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                <label className="inline-flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={serviceForm.isActive}
                    onChange={(event) => setServiceForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Aktifkan aturan biaya layanan</span>
                </label>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gunakan satu aturan aktif utama per outlet agar perhitungan konsisten.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {serviceForm.id ? "Simpan perubahan" : "Tambah biaya layanan"}
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-6 space-y-3">
              <div className="border-t border-gray-200 pt-5 dark:border-gray-800"><h3 className="text-sm font-semibold text-gray-900 dark:text-white">Daftar aturan biaya layanan</h3><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pilih aturan untuk mengubah pengaturannya.</p></div>
              {serviceRules.length === 0 && <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">Belum ada aturan biaya layanan untuk outlet ini.</p>}
              {serviceRules.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setServiceForm({
                    id: rule.id,
                    name: rule.name,
                    rate: String(rule.rate),
                    isActive: rule.isActive,
                  })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left transition hover:border-brand-400 hover:bg-brand-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-[#293b58] dark:bg-[#111b2c] dark:hover:bg-brand-500/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{rule.name}</span>
                    <span className="rounded-xl bg-warning-50 px-3 py-1 text-lg font-bold text-warning-600 dark:bg-warning-500/10 dark:text-warning-300">{rule.rate}%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{rule.isActive ? "Aktif" : "Nonaktif"}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}
