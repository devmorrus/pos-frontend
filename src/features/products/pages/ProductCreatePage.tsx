import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import AppLoader from "../../../components/ui/AppLoader";
import { getErrorMessage } from "../../../utils/errors";
import { getCategories } from "../../categories/api/categoriesApi";
import type { CategoryDto } from "../../categories/types/category";
import { createProduct } from "../api/productsApi";
import ProductForm from "../components/ProductForm";
import { validateProductForm } from "../schemas/productSchema";
import type { ProductFormValues } from "../types/product";

function generateBarcode(): string {
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return "899" + randomDigits;
}

const initialValues: ProductFormValues = {
  categoryId: "",
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
};

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<ProductFormValues>(() => ({
    ...initialValues,
    barcode: generateBarcode(),
  }));
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true);

      try {
        const result = await getCategories();
        setCategories(result);
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat kategori produk."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadCategories();
  }, []);

  function handleChange(key: keyof ProductFormValues, value: any) {
    setValues((current) => ({
      ...current,
      [key]: value,
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
        sku: values.sku.trim(),
        name: values.name.trim(),
        barcode: values.barcode.trim() || null,
        basePrice: Number(values.basePrice),
        costPrice: Number(values.costPrice),
        unit: values.unit.trim(),
        isConsignment: values.isConsignment,
        imageUrl: values.imageUrl.trim() || null,
        isTaxable: values.isTaxable === "inherit" ? null : values.isTaxable === "true",
        isServiceChargeable: values.isServiceChargeable === "inherit" ? null : values.isServiceChargeable === "true",
        hasVariants: values.hasVariants,
        isRawMaterial: values.isRawMaterial,
        variants: values.hasVariants ? values.variants : [],
        recipes: values.isRawMaterial ? [] : (values.recipes ?? []),
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
          isSubmitting={isSubmitting}
          submitError={submitError}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      )}
    </ProtectedPageShell>
  );
}
