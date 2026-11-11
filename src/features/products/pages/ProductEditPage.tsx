import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import AppLoader from "../../../components/ui/AppLoader";
import { getErrorMessage } from "../../../utils/errors";
import { getCategories } from "../../categories/api/categoriesApi";
import type { CategoryDto } from "../../categories/types/category";
import { getProductById, updateProduct } from "../api/productsApi";
import { getProductBrands, getProductModels, type ProductBrand, type ProductModel } from "../api/productMastersApi";
import ProductForm from "../components/ProductForm";
import { validateProductForm } from "../schemas/productSchema";
import type { ProductDto, ProductFormValues } from "../types/product";

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

export default function ProductEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [models, setModels] = useState<ProductModel[]>([]);
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
        const [categoriesResult, productResult, brandsResult] = await Promise.all([
          getCategories(),
          getProductById(id),
          getProductBrands(true),
        ]);

        setCategories(categoriesResult);
        setBrands(brandsResult);
        setProduct(productResult);
        setValues({
          categoryId: productResult.categoryId,
          brandId: productResult.brandId ?? "",
          modelId: productResult.modelId ?? "",
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
          trackingMode: productResult.trackingMode ?? "quantity",
        });
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat detail produk."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadPage();
  }, [id]);

  useEffect(() => { void getProductModels(values.brandId || undefined, true).then(setModels).catch(() => setModels([])); }, [values.brandId]);

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
         sku: values.sku.trim().toUpperCase(),
        name: values.name.trim(),
         barcode: values.barcode.trim() || null,
         brandId: values.brandId || null,
         modelId: values.modelId || null,
        basePrice: Number(values.basePrice),
        costPrice: Number(values.costPrice),
        unit: values.unit.trim(),
        isConsignment: values.isConsignment,
        isActive: values.isActive,
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
