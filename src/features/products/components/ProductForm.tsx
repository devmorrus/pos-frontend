import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { FieldErrorText, FormCard } from "../../../components/forms";
import InlineAlert from "../../../components/ui/InlineAlert";
import type { CategoryDto } from "../../categories/types/category";
import type { ProductFieldErrors } from "../schemas/productSchema";
import type { ProductFormValues } from "../types/product";
import { uploadProductImage } from "../api/productsApi";
import { API_BASE_URL } from "../../../api/client/config";
import { getErrorMessage } from "../../../utils/errors";

type ProductFormProps = {
  mode: "create" | "edit";
  values: ProductFormValues;
  errors: ProductFieldErrors;
  categories: CategoryDto[];
  isSubmitting: boolean;
  submitError?: string | null;
  onChange: (key: keyof ProductFormValues, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ProductForm({
  mode,
  values,
  errors,
  categories,
  isSubmitting,
  submitError,
  onChange,
  onSubmit,
}: ProductFormProps) {
  const isEditMode = mode === "edit";
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadProductImage(file);
      onChange("imageUrl", res.url);
    } catch (err) {
      setUploadError(getErrorMessage(err, "Gagal mengunggah foto."));
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveImage() {
    onChange("imageUrl", "");
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Produk" : "Tambah Produk"} />

      <FormCard
        title={isEditMode ? "Edit produk" : "Tambah produk"}
        description="Simpan master produk MorrusPOS dengan kategori, harga, unit, dan tipe penjualan yang konsisten."
      >
        <form className="space-y-5" onSubmit={onSubmit}>
          <InlineAlert tone="error" message={submitError} />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kategori <span className="text-error-500">*</span>
              </span>
              <select
                value={values.categoryId}
                onChange={(event) => onChange("categoryId", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parentName ? `${category.parentName} / ${category.name}` : category.name}
                  </option>
                ))}
              </select>
              <FieldErrorText message={errors.categoryId} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                SKU <span className="text-error-500">*</span>
              </span>
              <input
                value={values.sku}
                onChange={(event) => onChange("sku", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Min. 3 karakter. Hanya huruf, angka, strip (-), dan underscore (_).</p>
              <FieldErrorText message={errors.sku} />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Nama produk <span className="text-error-500">*</span>
              </span>
              <input
                value={values.name}
                onChange={(event) => onChange("name", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Min. 3 karakter.</p>
              <FieldErrorText message={errors.name} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Barcode
              </span>
              <input
                value={values.barcode}
                onChange={(event) => onChange("barcode", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">
                Opsional. Masukkan nomor barcode (8-18 angka).
              </p>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Satuan <span className="text-error-500">*</span>
              </span>
              <input
                value={values.unit}
                onChange={(event) => onChange("unit", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Contoh: pcs, kg, box.</p>
              <FieldErrorText message={errors.unit} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Harga jual <span className="text-error-500">*</span>
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.basePrice}
                onChange={(event) => onChange("basePrice", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Harus lebih besar dari Harga Modal.</p>
              <FieldErrorText message={errors.basePrice} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Harga modal <span className="text-error-500">*</span>
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={values.costPrice}
                onChange={(event) => onChange("costPrice", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-400">Harga modal harus lebih rendah dari harga jual.</p>
              <FieldErrorText message={errors.costPrice} />
              {isEditMode ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Backend fase ini belum mengirim harga modal saat detail produk dibuka, jadi isi
                  kembali nilainya saat memperbarui produk.
                </p>
              ) : null}
            </label>

            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                checked={values.isConsignment}
                onChange={(event) => onChange("isConsignment", event.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Produk konsinyasi
              </span>
            </label>

            {isEditMode ? (
              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) => onChange("isActive", event.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Produk aktif
                </span>
              </label>
            ) : null}

            <div className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Foto Produk
              </span>
              <InlineAlert tone="error" message={uploadError} />
              
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {values.imageUrl ? (
                  <div className="relative group overflow-hidden w-24 h-24 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <img
                      src={`${API_BASE_URL}${values.imageUrl}`}
                      alt="Pratonton"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white font-semibold text-xs rounded-2xl"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-800 flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="product-image-file"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="product-image-file"
                    className="inline-flex items-center cursor-pointer rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    {isUploading ? "Mengunggah..." : values.imageUrl ? "Ganti Foto" : "Unggah Foto"}
                  </label>
                  <p className="mt-2 text-xs text-gray-400">
                    Format PNG, JPG, JPEG, atau WEBP. Maksimal 2MB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              to="/products"
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Kembali
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? "Menyimpan..."
                : isEditMode
                  ? "Perbarui produk"
                  : "Simpan produk"}
            </button>
          </div>
        </form>
      </FormCard>
    </div>
  );
}
