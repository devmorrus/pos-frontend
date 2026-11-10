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
import { ShootingStarIcon } from "../../../icons";

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
      description="Kelola penawaran otomatis untuk transaksi, produk, dan kategori pilihan di outlet Anda."
    >
      <InlineAlert tone="error" message={error} />
      <section className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><ShootingStarIcon className="h-7 w-7" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Penawaran pelanggan</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Promo tepat, belanja makin menarik</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Tentukan diskon, sasaran, dan periode penawaran. Promo diterapkan otomatis pada transaksi yang memenuhi ketentuan.</p></div></div>
      </section>
      {isLoading ? (
        <AppLoader label="Memuat promo campaign..." />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">Pengaturan campaign</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{form.id ? "Edit promo" : "Buat promo baru"}</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <label htmlFor="promo-outlet" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Outlet</label>
              <select
                id="promo-outlet"
                value={form.outletId}
                onChange={(event) => setForm((current) => ({ ...current, outletId: event.target.value }))}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              >
                <option value="">Pilih outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Kode promo <span className="font-normal text-gray-400">(opsional)</span><input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Contoh: HEMAT10" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 font-mono text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Nama promo<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Contoh: Promo akhir pekan" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              <h3 className="border-t border-gray-200 pt-5 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">Diskon & ketentuan</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Jenis diskon<select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as "fixed" | "percentage" }))} className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white">
                  <option value="percentage">Persentase</option>
                  <option value="fixed">Nominal</option>
                </select></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nilai diskon ({form.discountType === "percentage" ? "%" : "Rp"})<input type="number" min="0" step="0.01" value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} placeholder="Nilai diskon" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Sasaran promo<select value={form.scopeType} onChange={(event) => setForm((current) => ({ ...current, scopeType: event.target.value as "transaction" | "product" | "category", selectedProductIds: [], selectedCategoryIds: [] }))} className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white">
                  <option value="transaction">Transaksi</option>
                  <option value="product">Produk</option>
                  <option value="category">Kategori</option>
                </select></label>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Minimum belanja (Rp)<input type="number" min="0" step="0.01" value={form.minimumSpend} onChange={(event) => setForm((current) => ({ ...current, minimumSpend: event.target.value }))} placeholder="Minimum belanja" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              </div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Maksimum diskon (Rp, opsional)<input type="number" min="0" step="0.01" value={form.maximumDiscountAmount} onChange={(event) => setForm((current) => ({ ...current, maximumDiscountAmount: event.target.value }))} placeholder="Maksimum diskon" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white" /></label>
              <h3 className="border-t border-gray-200 pt-5 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">Periode berlaku</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="min-w-0 text-sm font-medium text-gray-700 dark:text-gray-200">Mulai<input type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="mt-2 h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white dark:[color-scheme:dark]" /></label>
                <label className="min-w-0 text-sm font-medium text-gray-700 dark:text-gray-200">Berakhir<input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="mt-2 h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white dark:[color-scheme:dark]" /></label>
              </div>
              {form.scopeType === "product" ? (
                <select
                  multiple
                  aria-label="Pilih produk sasaran promo"
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
                  aria-label="Pilih kategori sasaran promo"
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
                    <span className="text-sm text-gray-700 dark:text-gray-200">Aktifkan promo sesuai periode berlaku</span>
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pastikan periode aktif dan target promo sudah sesuai sebelum disimpan.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center self-start rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                  >
                    {isSubmitting ? "Menyimpan..." : form.id ? "Simpan perubahan" : "Tambah promo"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Promo</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pilih promo untuk melihat dan mengubah pengaturannya.</p>
            <div className="mt-4 space-y-3">
              {promos.length === 0 && <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center dark:border-[#293b58]"><ShootingStarIcon className="mx-auto mb-3 h-9 w-9 text-brand-400" aria-hidden="true" /><p className="font-semibold text-gray-900 dark:text-white">Belum ada promo</p><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">Mulai buat penawaran melalui form promo di halaman ini.</p></div>}
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
                  className={`w-full rounded-2xl border p-5 text-left transition hover:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${form.id === promo.id ? "border-brand-400 bg-brand-50/50 dark:bg-brand-500/10" : "border-gray-200 bg-gray-50/50 dark:border-[#293b58] dark:bg-[#111b2c]"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">{promo.name}</span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">{promo.isActive ? "Diaktifkan" : "Nonaktif"}</span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-brand-600 dark:text-brand-300">
                    {promo.discountType === "percentage" ? `${promo.discountValue}%` : `Rp ${promo.discountValue.toLocaleString("id-ID")}`}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Minimum belanja Rp {promo.minimumSpend.toLocaleString("id-ID")} · {promo.scopeType === "transaction" ? "Transaksi" : promo.scopeType === "product" ? "Produk" : "Kategori"}</p>
                  <p className="mt-3 border-t border-gray-200 pt-3 text-xs leading-5 text-gray-500 dark:border-gray-700 dark:text-gray-400">{new Date(promo.startAt).toLocaleString("id-ID")} — {new Date(promo.endAt).toLocaleString("id-ID")}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}
