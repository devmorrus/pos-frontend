import { useEffect, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import InlineAlert from "../../../components/ui/InlineAlert";
import { getProductBrands, getProductModels, type ProductBrand, type ProductModel } from "../api/productMastersApi";

export default function ProductMastersPage() {
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([getProductBrands(true), getProductModels(undefined, true)]).then(([b, m]) => { setBrands(b); setModels(m); }).catch(() => setError("Gagal memuat master brand dan model."));
  }, []);
  const term = search.trim().toLowerCase();
  const visible = brands.filter((b) => !term || b.name.toLowerCase().includes(term) || models.some((m) => m.brandId === b.id && m.name.toLowerCase().includes(term)));
  return <ProtectedPageShell title="Brand & Model" description="Kelola klasifikasi produk tanpa mengubah SKU atau barcode.">
    <div className="space-y-5"><InlineAlert tone="error" message={error} />
      <input aria-label="Cari brand atau model" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari brand atau model..." className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white" />
      <div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p className="text-sm text-gray-500">Brand aktif</p><p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{brands.filter((x) => x.isActive).length}</p></div><div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><p className="text-sm text-gray-500">Model aktif</p><p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{models.filter((x) => x.isActive).length}</p></div></div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"><div className="divide-y divide-gray-100 dark:divide-gray-800">{visible.map((brand) => <section key={brand.id} className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-gray-900 dark:text-white">{brand.name} {!brand.isActive && <span className="text-xs text-warning-600">Nonaktif</span>}</h2><p className="text-sm text-gray-500">{brand.modelCount} model · {brand.productCount} produk</p></div></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{models.filter((m) => m.brandId === brand.id && (!term || m.name.toLowerCase().includes(term) || brand.name.toLowerCase().includes(term))).map((model) => <div key={model.id} className="rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800/70">{model.name}{!model.isActive && <span className="ml-2 text-xs text-warning-600">Nonaktif</span>}</div>)}</div></section>)}{visible.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Tidak ada brand atau model yang sesuai.</p>}</div></div>
    </div>
  </ProtectedPageShell>;
}
