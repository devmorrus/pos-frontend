import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import AppLoader from "../../../components/ui/AppLoader";
import { getErrorMessage } from "../../../utils/errors";
import { getCategories } from "../../categories/api/categoriesApi";
import type { CategoryDto } from "../../categories/types/category";
import { createProduct } from "../api/productsApi";
import { getProductBrands, getProductModels, type ProductBrand, type ProductModel } from "../api/productMastersApi";
import ProductForm from "../components/ProductForm";
import { validateProductForm } from "../schemas/productSchema";
import type { ProductFormValues } from "../types/product";

const initialValues: ProductFormValues = {
  categoryId: "",
  brandId: "",
  modelId: "",
  sku: "",
  name: "",
  barcode: "",
  basePrice: "",
  costPrice: "",
  unit: "",
  isConsignment: false,
  isActive: true,
  imageUrl: "",
  isTaxable: "inherit",
  isServiceChargeable: "inherit",
  hasVariants: false,
  isRawMaterial: false,
  variants: [],
  trackingMode: "quantity",
};

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true);

      try {
        const [result, brandResult] = await Promise.all([getCategories(), getProductBrands()]);
        setCategories(result); setBrands(brandResult);
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat kategori produk."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadCategories();
  }, []);

  useEffect(() => { void getProductModels(values.brandId || undefined).then(setModels).catch(() => setModels([])); }, [values.brandId]);

  function handleChange(key: keyof ProductFormValues, value: any) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "brandId" ? { modelId: "" } : {}),
      ...(key === "trackingMode" && value === "none" ? { isConsignment: false, isRawMaterial: false } : {}),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateProductForm(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createProduct({
        categoryId: values.categoryId,
         sku: values.sku.trim().toUpperCase(),
        name: values.name.trim(),
         barcode: values.barcode.trim() || null,
         brandId: values.brandId || null,
         modelId: values.modelId || null,
        basePrice: Number(values.basePrice),
        costPrice: Number(values.costPrice),
        unit: values.unit.trim(),
        isConsignment: values.isConsignment,
        imageUrl: values.imageUrl.trim() || null,
        isTaxable: values.isTaxable === "inherit" ? null : values.isTaxable === "true",
        isServiceChargeable: values.isServiceChargeable === "inherit" ? null : values.isServiceChargeable === "true",
        hasVariants: false,
        isRawMaterial: false,
        variants: [],
        recipes: [],
        trackingMode: values.trackingMode,
      });

      navigate("/products", {
        replace: true,
        state: { successMessage: `Produk ${values.name.trim()} berhasil dibuat.` },
      });
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal membuat produk."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Tambah Produk"
      description="Tambahkan master produk baru agar siap dipakai oleh modul kasir, stok, dan pembelian."
    >
      {isLoading ? (
        <AppLoader label="Memuat form produk..." />
      ) : (
        <ProductForm
          mode="create"
          values={values}
          errors={errors}
            categories={categories}
            brands={brands}
            models={models}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      )}
    </ProtectedPageShell>
  );
}
