import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import AppLoader from "../../../components/ui/AppLoader";
import { getErrorMessage } from "../../../utils/errors";
import { getCategories } from "../../categories/api/categoriesApi";
import type { CategoryDto } from "../../categories/types/category";
import { getProductById, updateProduct } from "../api/productsApi";
import ProductForm from "../components/ProductForm";
import { validateProductForm } from "../schemas/productSchema";
import type { ProductDto, ProductFormValues } from "../types/product";

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

export default function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPage() {
      if (!id) {
        setSubmitError("ID produk tidak valid.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [categoriesResult, productResult] = await Promise.all([
          getCategories(),
          getProductById(id),
        ]);

        setCategories(categoriesResult);
        setProduct(productResult);
        setValues({
          categoryId: productResult.categoryId,
          sku: productResult.sku,
          name: productResult.name,
          barcode: productResult.barcode ?? "",
          basePrice: String(productResult.basePrice),
          costPrice: String(productResult.costPrice),
          unit: productResult.unit,
          isConsignment: productResult.isConsignment,
          isActive: true,
          imageUrl: productResult.imageUrl ?? "",
          isTaxable:
            productResult.isTaxable == null ? "inherit" : productResult.isTaxable ? "true" : "false",
          isServiceChargeable:
            productResult.isServiceChargeable == null
              ? "inherit"
              : productResult.isServiceChargeable
                ? "true"
                : "false",
          hasVariants: productResult.hasVariants ?? false,
          isRawMaterial: productResult.isRawMaterial ?? false,
          variants: productResult.variants ?? [],
          recipes: (productResult.recipes ?? []).map((r: any) => ({
            rawMaterialProductId: r.rawMaterialProductId,
            quantityRequired: r.quantityRequired,
            productVariantSku: null,
          })),
        });
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat detail produk."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadPage();
  }, [id]);

  function handleChange(key: keyof ProductFormValues, value: any) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id) {
      return;
    }

    const nextErrors = validateProductForm(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProduct(id, {
        categoryId: values.categoryId,
        sku: values.sku.trim(),
        name: values.name.trim(),
        barcode: values.barcode.trim() || null,
        basePrice: Number(values.basePrice),
        costPrice: Number(values.costPrice),
        unit: values.unit.trim(),
        isConsignment: values.isConsignment,
        isActive: values.isActive,
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
        state: { successMessage: `Produk ${values.name.trim()} berhasil diperbarui.` },
      });
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal memperbarui produk."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Edit Produk"
      description={`Perbarui data produk ${product?.name ?? ""} agar tetap konsisten dengan kategori dan aturan harga di backend.`}
    >
      {isLoading ? (
        <AppLoader label="Memuat detail produk..." />
      ) : (
        <ProductForm
          mode="edit"
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
