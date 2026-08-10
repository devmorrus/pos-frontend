import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getOutlets } from "../../outlets/api/outletsApi";
import { getCategories } from "../../categories/api/categoriesApi";
import { getProducts } from "../../products/api/productsApi";
import type { CategoryDto } from "../../categories/types/category";
import type { ProductDto } from "../../products/types/product";
import type { OutletDto } from "../../outlets/types/outlet";
import { createPromoCampaign, getPromoCampaigns, updatePromoCampaign } from "../api/pricingApi";
import type { PromoCampaignDto } from "../types/pricing";

export default function PromoCampaignsPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [promos, setPromos] = useState<PromoCampaignDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const effectiveOutletId = session?.role === "Owner" ? selectedOutletId : session?.outletId ?? selectedOutletId;

  const [form, setForm] = useState({
    id: "",
    outletId: effectiveOutletId ?? "",
    code: "",
    name: "",
    discountType: "percentage" as "fixed" | "percentage",
    discountValue: "10",
    scopeType: "transaction" as "transaction" | "product" | "category",
    minimumSpend: "0",
    maximumDiscountAmount: "",
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
    selectedProductIds: [] as string[],
    selectedCategoryIds: [] as string[],
  });

  useEffect(() => {
    setForm((current) => ({ ...current, outletId: current.outletId || effectiveOutletId || "" }));
  }, [effectiveOutletId]);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [outletsResult, promosResult, categoriesResult, productsResult] = await Promise.all([
        getOutlets(),
        getPromoCampaigns(form.outletId || undefined),
        getCategories(),
        form.outletId ? getProducts({ outletId: form.outletId }) : Promise.resolve([]),
      ]);
      setOutlets(outletsResult);
      setPromos(promosResult);
      setCategories(categoriesResult);
      setProducts(productsResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat promo campaign."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [form.outletId]);

  const targetCountLabel = useMemo(() => {
    if (form.scopeType === "product") return `${form.selectedProductIds.length} produk dipilih`;
    if (form.scopeType === "category") return `${form.selectedCategoryIds.length} kategori dipilih`;
    return "Berlaku untuk seluruh transaksi";
  }, [form.scopeType, form.selectedCategoryIds.length, form.selectedProductIds.length]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const targets =
        form.scopeType === "product"
          ? form.selectedProductIds.map((productId) => ({ productId, categoryId: null }))
          : form.scopeType === "category"
            ? form.selectedCategoryIds.map((categoryId) => ({ categoryId, productId: null }))
            : [];

      const payload = {
        outletId: form.outletId,
        code: form.code.trim() || null,
        name: form.name.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        scopeType: form.scopeType,
        minimumSpend: Number(form.minimumSpend),
        maximumDiscountAmount: form.maximumDiscountAmount ? Number(form.maximumDiscountAmount) : null,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        isActive: form.isActive,
        targets,
      };

      if (form.id) {
        await updatePromoCampaign(form.id, payload);
      } else {
        await createPromoCampaign(payload);
      }

      setForm((current) => ({
        ...current,
        id: "",
        code: "",
        name: "",
        selectedProductIds: [],
        selectedCategoryIds: [],
      }));
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan promo campaign."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Promo Campaigns"
      description="Atur promo otomatis berbasis transaksi, produk, atau kategori untuk dipakai pricing engine POS."
    >
      <InlineAlert tone="error" message={error} />
      {isLoading ? (
        <AppLoader label="Memuat promo campaign..." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Form Promo</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <select
                value={form.outletId}
                onChange={(event) => setForm((current) => ({ ...current, outletId: event.target.value }))}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Pilih outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Kode promo (opsional)" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nama promo" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              <div className="grid gap-3 md:grid-cols-2">
                <select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as "fixed" | "percentage" }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white">
                  <option value="percentage">Persentase</option>
                  <option value="fixed">Nominal</option>
                </select>
                <input type="number" min="0" step="0.01" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} placeholder="Nilai diskon" className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select value={form.scopeType} onChange={(event) => setForm((current) => ({ ...current, scopeType: event.target.value as "transaction" | "product" | "category", selectedProductIds: [], selectedCategoryIds: [] }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white">
                  <option value="transaction">Transaksi</option>
                  <option value="product">Produk</option>
                  <option value="category">Kategori</option>
                </select>
                <input type="number" min="0" step="0.01" value={form.minimumSpend} onChange={(event) => setForm((current) => ({ ...current, minimumSpend: event.target.value }))} placeholder="Minimum spend" className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              </div>
              <input type="number" min="0" step="0.01" value={form.maximumDiscountAmount} onChange={(event) => setForm((current) => ({ ...current, maximumDiscountAmount: event.target.value }))} placeholder="Maksimum diskon (opsional)" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              <div className="grid gap-3 md:grid-cols-2">
                <input type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
                <input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
              </div>
              {form.scopeType === "product" ? (
                <select
                  multiple
                  value={form.selectedProductIds}
                  onChange={(event) => setForm((current) => ({ ...current, selectedProductIds: Array.from(event.target.selectedOptions, (option) => option.value) }))}
                  className="min-h-36 w-full rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              ) : null}
              {form.scopeType === "category" ? (
                <select
                  multiple
                  value={form.selectedCategoryIds}
                  onChange={(event) => setForm((current) => ({ ...current, selectedCategoryIds: Array.from(event.target.selectedOptions, (option) => option.value) }))}
                  className="min-h-36 w-full rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.parentName ? `${category.parentName} / ${category.name}` : category.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{targetCountLabel}</p>
                  <label className="inline-flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Aktifkan promo ini segera setelah disimpan</span>
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pastikan periode aktif dan target promo sudah sesuai sebelum disimpan.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 items-center justify-center self-start rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {form.id ? "Update promo" : "Tambah promo"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Promo</h2>
            <div className="mt-4 space-y-3">
              {promos.map((promo) => (
                <button
                  key={promo.id}
                  type="button"
                  onClick={() => setForm({
                    id: promo.id,
                    outletId: promo.outletId,
                    code: promo.code ?? "",
                    name: promo.name,
                    discountType: promo.discountType,
                    discountValue: String(promo.discountValue),
                    scopeType: promo.scopeType,
                    minimumSpend: String(promo.minimumSpend),
                    maximumDiscountAmount: promo.maximumDiscountAmount ? String(promo.maximumDiscountAmount) : "",
                    startAt: promo.startAt.slice(0, 16),
                    endAt: promo.endAt.slice(0, 16),
                    isActive: promo.isActive,
                    selectedProductIds: promo.productIds,
                    selectedCategoryIds: promo.categoryIds,
                  })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left dark:border-gray-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{promo.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{promo.scopeType}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {promo.discountType === "percentage" ? `${promo.discountValue}%` : `Rp ${promo.discountValue.toLocaleString("id-ID")}`}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}
