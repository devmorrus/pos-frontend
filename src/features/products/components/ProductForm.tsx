import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import { FieldErrorText, FormCard } from "../../../components/forms";
import InlineAlert from "../../../components/ui/InlineAlert";
import type { CategoryDto } from "../../categories/types/category";
import type { ProductFieldErrors } from "../schemas/productSchema";
import type { ProductFormValues, ProductRecipeRequest, ProductDto } from "../types/product";
import { uploadProductImage, getProducts } from "../api/productsApi";
import { API_BASE_URL } from "../../../api/client/config";
import { getErrorMessage } from "../../../utils/errors";

type ProductFormProps = {
  mode: "create" | "edit";
  values: ProductFormValues;
  errors: ProductFieldErrors;
  categories: CategoryDto[];
  isSubmitting: boolean;
  submitError?: string | null;
  onChange: (key: keyof ProductFormValues, value: any) => void;
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

  // Variant Image Uploader Refs & States
  const variantFileRef = useRef<HTMLInputElement | null>(null);
  const [activeVariantUploadIdx, setActiveVariantUploadIdx] = useState<number | null>(null);

  // Varian & Atribut local state
  const [attributes, setAttributes] = useState<{ name: string; values: string }[]>([]);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);

  // Recipe / BOM state
  const [rawMaterials, setRawMaterials] = useState<ProductDto[]>([]);
  const [localRecipes, setLocalRecipes] = useState<ProductRecipeRequest[]>(values.recipes ?? []);

  useEffect(() => {
    if (values.variants && values.variants.length > 0) {
      if (generatedVariants.length === 0) {
        setGeneratedVariants(values.variants);
      }

      // Reconstruct attributes state from existing variants
      const tempAttrs: Record<string, Set<string>> = {};
      values.variants.forEach((v: any) => {
        v.attributeValues?.forEach((av: any) => {
          if (!tempAttrs[av.attributeName]) {
            tempAttrs[av.attributeName] = new Set<string>();
          }
          tempAttrs[av.attributeName].add(av.value);
        });
      });

      const extracted = Object.keys(tempAttrs).map((name) => ({
        name,
        values: Array.from(tempAttrs[name]).join(", "),
      }));

      if (extracted.length > 0 && attributes.length === 0) {
        setAttributes(extracted);
      }
    } else if (attributes.length === 0) {
      setAttributes([{ name: "Ukuran", values: "Kecil, Besar" }]);
    }
  }, [values.variants]);

  // Load raw materials for recipe builder
  useEffect(() => {
    async function loadRawMaterials() {
      try {
        const result = await getProducts({ isRawMaterial: true } as any);
        const list: ProductDto[] = Array.isArray(result) ? result : (result as any).items ?? [];
        setRawMaterials(list);
      } catch {
        // silently ignore
      }
    }
    void loadRawMaterials();
  }, []);

  // Sync external recipes value into local state (for edit mode pre-fill)
  useEffect(() => {
    if (values.recipes && values.recipes.length > 0 && localRecipes.length === 0) {
      setLocalRecipes(values.recipes);
    }
  }, [values.recipes]);

  function addRecipeRow() {
    const updated = [...localRecipes, { rawMaterialProductId: "", quantityRequired: 1, productVariantSku: null }];
    setLocalRecipes(updated);
    onChange("recipes", updated);
  }

  function removeRecipeRow(index: number) {
    const updated = localRecipes.filter((_, i) => i !== index);
    setLocalRecipes(updated);
    onChange("recipes", updated);
  }

  function updateRecipeRow(index: number, field: keyof ProductRecipeRequest, val: any) {
    const updated = localRecipes.map((row, i) =>
      i === index ? { ...row, [field]: val } : row
    );
    setLocalRecipes(updated);
    onChange("recipes", updated);
  }

  const addAttribute = () => setAttributes([...attributes, { name: "", values: "" }]);
  const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));
  const updateAttribute = (index: number, key: "name" | "values", val: string) => {
    const updated = [...attributes];
    updated[index][key] = val;
    setAttributes(updated);
  };

  const handleGenerateVariants = () => {
    const activeAttrs = attributes.filter((a) => a.name.trim() && a.values.trim());
    if (activeAttrs.length === 0) return;

    const combos = activeAttrs.reduce<any[][]>((acc, attr) => {
      const valuesList = attr.values.split(",").map((v) => v.trim()).filter(Boolean);
      if (acc.length === 0) {
        return valuesList.map((v) => [{ attributeName: attr.name, value: v }]);
      }
      return acc.flatMap((combo) =>
        valuesList.map((v) => [...combo, { attributeName: attr.name, value: v }]),
      );
    }, []);

    const parentSku = values.sku ? values.sku.trim() : "SKU";
    const parentPrice = values.basePrice ? Number(values.basePrice) : 0;
    const parentCost = values.costPrice ? Number(values.costPrice) : 0;

    const newVariants = combos.map((combo: any) => {
      const suffix = combo.map((c: any) => c.value.replace(/\s+/g, "").toUpperCase()).join("-");
      return {
        sku: `${parentSku}-${suffix}`,
        barcode: "",
        basePrice: parentPrice,
        costPrice: parentCost,
        imageUrl: "",
        attributeValues: combo.map((c: any) => ({
          attributeName: c.attributeName,
          value: c.value,
        })),
        isActive: true,
      };
    });

    setGeneratedVariants(newVariants);
    onChange("variants", newVariants);
  };

  const handleVariantChange = (idx: number, field: string, val: any) => {
    const updated = [...generatedVariants];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    setGeneratedVariants(updated);
    onChange("variants", updated);
  };

  const handleVariantImageClick = (idx: number) => {
    setActiveVariantUploadIdx(idx);
    variantFileRef.current?.click();
  };

  const handleVariantFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || activeVariantUploadIdx === null) return;
    const file = files[0];
    try {
      const res = await uploadProductImage(file);
      handleVariantChange(activeVariantUploadIdx, "imageUrl", res.url);
    } catch (err) {
      alert("Gagal mengunggah foto varian.");
    } finally {
      event.target.value = "";
      setActiveVariantUploadIdx(null);
    }
  };

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

            <div className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Barcode
              </span>
              <div className="relative flex items-center">
                <input
                  value={values.barcode}
                  onChange={(event) => onChange("barcode", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-4 pr-24 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
                    onChange("barcode", "899" + randomDigits);
                  }}
                  className="absolute right-2 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Generate
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Opsional. Masukkan nomor barcode (8-18 angka).
              </p>
            </div>

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

            {!values.hasVariants && (
              <>
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
                </label>
              </>
            )}

            <div className="flex flex-col gap-3 md:col-span-2">
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

              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={values.hasVariants}
                  onChange={(event) => onChange("hasVariants", event.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 font-semibold">
                  Produk memiliki variasi (Rasa, Ukuran, dll.)
                </span>
              </label>

              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={values.isRawMaterial}
                  onChange={(event) => onChange("isRawMaterial", event.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Merupakan Bahan Baku / Raw Material (BOM)
                </span>
              </label>
            </div>

            {values.hasVariants && (
              <div className="md:col-span-2 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 bg-gray-50 dark:bg-gray-900/50 space-y-5">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  🛠️ Pengaturan Varian Produk
                </h4>
                <p className="text-xs text-gray-400">
                  Definisikan opsi variasi Anda seperti "Ukuran" (Kecil, Besar) atau "Rasa" (Cokelat, Keju). Pisahkan nilai dengan koma.
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">Atribut Produk</span>
                    <button
                      type="button"
                      onClick={addAttribute}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      + Tambah Atribut
                    </button>
                  </div>

                  {attributes.map((attr, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-955 p-4 rounded-2xl border border-gray-100 dark:border-gray-900 space-y-2">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-gray-400">Nama Atribut</span>
                          <input
                            placeholder="Contoh: Ukuran, Warna, Rasa"
                            value={attr.name}
                            onChange={(e) => updateAttribute(idx, "name", e.target.value)}
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-gray-400">Pilihan Nilai (Pisahkan dengan koma)</span>
                          <input
                            placeholder="Contoh: Kecil, Sedang, Besar"
                            value={attr.values}
                            onChange={(e) => updateAttribute(idx, "values", e.target.value)}
                            className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                          />
                        </label>
                      </div>
                      {attributes.length > 1 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeAttribute(idx)}
                            className="text-xs font-semibold text-error-600 hover:text-error-700"
                          >
                            Hapus Atribut
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateVariants}
                    className="w-full bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
                  >
                    Generate Varian dari Atribut
                  </button>
                </div>

                {generatedVariants.length > 0 && (
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 border-b border-gray-200 dark:border-gray-800 font-semibold">
                          <th className="p-3 w-16">Foto</th>
                          <th className="p-3">Nama Varian</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Harga Jual</th>
                          <th className="p-3">Harga Modal</th>
                          <th className="p-3">Barcode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedVariants.map((variant, idx) => {
                          const variantName = variant.attributeValues.map((av: any) => av.value).join(" - ");
                          return (
                            <tr key={idx} className="border-b border-gray-100 dark:border-gray-900 text-gray-700 dark:text-gray-300">
                              <td className="p-2">
                                <div
                                  onClick={() => handleVariantImageClick(idx)}
                                  className="relative w-10 h-10 rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center cursor-pointer hover:border-brand-500 hover:text-brand-500 transition-colors overflow-hidden"
                                >
                                  {variant.imageUrl ? (
                                    <img src={`${API_BASE_URL}${variant.imageUrl}`} className="w-full h-full object-cover rounded-xl" />
                                  ) : (
                                    <span className="text-sm">📸</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 font-semibold text-gray-900 dark:text-white">{variantName}</td>
                              <td className="p-2">
                                <input
                                  className="h-9 w-full rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900 px-2 text-xs"
                                  value={variant.sku}
                                  onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  className="h-9 w-24 rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900 px-2 text-xs"
                                  value={variant.basePrice}
                                  onChange={(e) => handleVariantChange(idx, "basePrice", Number(e.target.value))}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  className="h-9 w-24 rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900 px-2 text-xs"
                                  value={variant.costPrice}
                                  onChange={(e) => handleVariantChange(idx, "costPrice", Number(e.target.value))}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  className="h-9 w-full rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-900 px-2 text-xs"
                                  value={variant.barcode || ""}
                                  onChange={(e) => handleVariantChange(idx, "barcode", e.target.value)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  ref={variantFileRef}
                  onChange={handleVariantFileChange}
                  className="hidden"
                />
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Override pajak
              </span>
              <select
                value={values.isTaxable}
                onChange={(event) => onChange("isTaxable", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                <option value="inherit">Ikut default outlet</option>
                <option value="true">Kena pajak</option>
                <option value="false">Bebas pajak</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Override service charge
              </span>
              <select
                value={values.isServiceChargeable}
                onChange={(event) => onChange("isServiceChargeable", event.target.value)}
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                <option value="inherit">Ikut default outlet</option>
                <option value="true">Kena service charge</option>
                <option value="false">Bebas service charge</option>
              </select>
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

          {/* ─────────── RESEP / BOM BUILDER ─────────── */}
          {!values.isRawMaterial && (
            <div className="mt-2 rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    🧪 Resep / Bill of Materials (BOM)
                  </h4>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-500">
                    Daftarkan bahan baku yang dibutuhkan untuk membuat 1 unit produk ini. Stok bahan baku akan otomatis dikurangi saat transaksi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRecipeRow}
                  className="shrink-0 ml-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-2 text-xs font-bold text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Tambah Bahan
                </button>
              </div>

              {localRecipes.length === 0 ? (
                <p className="text-center py-4 text-xs text-amber-600 dark:text-amber-500 italic">
                  Belum ada bahan baku. Klik "Tambah Bahan" untuk mulai mengonfigurasi resep.
                </p>
              ) : (
                <div className="space-y-3">
                  {localRecipes.map((row, idx) => {
                    return (
                      <div
                        key={idx}
                        className="grid gap-3 sm:grid-cols-[1fr_120px_180px_auto] items-end bg-white dark:bg-gray-900/60 rounded-2xl border border-amber-100 dark:border-amber-900/40 p-3"
                      >
                        {/* Pilih bahan baku */}
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Bahan Baku</span>
                          <select
                            value={row.rawMaterialProductId}
                            onChange={(e) => updateRecipeRow(idx, "rawMaterialProductId", e.target.value)}
                            className="h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          >
                            <option value="">— Pilih bahan —</option>
                            {rawMaterials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.sku})
                              </option>
                            ))}
                          </select>
                        </label>

                        {/* Jumlah */}
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Jumlah</span>
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={row.quantityRequired}
                            onChange={(e) => updateRecipeRow(idx, "quantityRequired", Number(e.target.value))}
                            className="h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          />
                        </label>

                        {/* Varian spesifik (opsional, hanya jika produk punya variant) */}
                        {values.hasVariants && (
                          <label className="block">
                            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Berlaku untuk varian (opsional)</span>
                            <select
                              value={row.productVariantSku ?? ""}
                              onChange={(e) => updateRecipeRow(idx, "productVariantSku", e.target.value || null)}
                              className="h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            >
                              <option value="">Semua varian</option>
                              {(values.variants ?? []).map((v: any) => (
                                <option key={v.sku} value={v.sku}>
                                  {v.attributeValues?.map((av: any) => av.value).join(" - ") ?? v.sku}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        {/* Hapus baris */}
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeRecipeRow(idx)}
                            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-error-200 dark:border-error-900/50 text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors"
                            title="Hapus baris"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
