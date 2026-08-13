import type { ProductFormValues } from "../types/product";

export type ProductFieldErrors = Partial<Record<keyof ProductFormValues, string>>;

function isValidNumber(value: string) {
  if (!value.trim()) {
    return false;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed);
}

const skuPattern = /^[a-zA-Z0-9\-_]+$/;
const barcodePattern = /^\d{8,18}$/;

export function validateProductForm(values: ProductFormValues) {
  const errors: ProductFieldErrors = {};

  if (!values.categoryId) {
    errors.categoryId = "Kategori wajib dipilih.";
  }

  if (!values.sku.trim()) {
    errors.sku = "SKU wajib diisi.";
  } else if (values.sku.length < 3 || values.sku.length > 50) {
    errors.sku = "SKU harus berkisar antara 3 sampai 50 karakter.";
  } else if (!skuPattern.test(values.sku)) {
    errors.sku = "SKU hanya boleh berisi huruf, angka, strip (-), dan underscore (_).";
  }

  if (!values.name.trim()) {
    errors.name = "Nama produk wajib diisi.";
  } else if (values.name.length < 3 || values.name.length > 150) {
    errors.name = "Nama produk harus berkisar antara 3 sampai 150 karakter.";
  }

  if (values.barcode && values.barcode.trim()) {
    if (!barcodePattern.test(values.barcode)) {
      errors.barcode = "Barcode harus berupa angka dengan panjang 8 sampai 18 digit.";
    }
  }

  if (!values.hasVariants) {
    const basePriceValid = isValidNumber(values.basePrice);
    const costPriceValid = isValidNumber(values.costPrice);

    if (!basePriceValid) {
      errors.basePrice = "Harga jual wajib diisi dengan angka.";
    } else {
      const baseVal = Number(values.basePrice);
      if (baseVal <= 0) {
        errors.basePrice = "Harga jual harus lebih besar dari 0.";
      }
    }

    if (!costPriceValid) {
      errors.costPrice = "Harga modal wajib diisi dengan angka.";
    } else {
      const costVal = Number(values.costPrice);
      if (costVal < 0) {
        errors.costPrice = "Harga modal harus lebih besar atau sama dengan 0.";
      }
    }

    if (basePriceValid && costPriceValid) {
      const baseVal = Number(values.basePrice);
      const costVal = Number(values.costPrice);
      if (costVal >= baseVal) {
        errors.costPrice = "Harga modal harus lebih rendah dari harga jual.";
      }
    }
  }

  if (!values.unit.trim()) {
    errors.unit = "Satuan wajib diisi.";
  } else if (values.unit.length > 20) {
    errors.unit = "Satuan maksimal 20 karakter.";
  }

  return errors;
}
