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
      description="Kelola aturan pajak exclusive dan service charge per outlet untuk pricing engine checkout."
    >
      <InlineAlert tone="error" message={error} />

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <label className="block max-w-md">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Outlet</span>
          <select
            value={selectedRuleOutletId ?? ""}
            onChange={(event) => setSelectedRuleOutletId(event.target.value)}
            className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tax Rule</h2>
            <form className="mt-4 space-y-4" onSubmit={handleTaxSubmit}>
              <input
                value={taxForm.name}
                onChange={(event) => setTaxForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nama rule pajak"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={taxForm.rate}
                onChange={(event) => setTaxForm((current) => ({ ...current, rate: event.target.value }))}
                placeholder="Rate pajak (%)"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
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
                    <span className="text-sm text-gray-700 dark:text-gray-200">Aktifkan rule pajak ini</span>
                  </label>
                  <label className="inline-flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={taxForm.appliesBeforeServiceCharge}
                      onChange={(event) => setTaxForm((current) => ({ ...current, appliesBeforeServiceCharge: event.target.checked }))}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Hitung tax sebelum service charge</span>
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Simpan setelah outlet, nama, dan rate sudah benar.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 items-center justify-center self-start rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {taxForm.id ? "Update tax rule" : "Tambah tax rule"}
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-6 space-y-3">
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
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left dark:border-gray-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{rule.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{rule.rate}%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{rule.isActive ? "Aktif" : "Nonaktif"}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Service Charge Rule</h2>
            <form className="mt-4 space-y-4" onSubmit={handleServiceSubmit}>
              <input
                value={serviceForm.name}
                onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nama rule service charge"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.rate}
                onChange={(event) => setServiceForm((current) => ({ ...current, rate: event.target.value }))}
                placeholder="Rate service charge (%)"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                <label className="inline-flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={serviceForm.isActive}
                    onChange={(event) => setServiceForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">Aktifkan rule service charge ini</span>
                </label>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gunakan satu rule aktif utama per outlet agar hasil pricing konsisten.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 items-center justify-center self-start rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {serviceForm.id ? "Update service rule" : "Tambah service rule"}
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-6 space-y-3">
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
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left dark:border-gray-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{rule.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{rule.rate}%</span>
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
