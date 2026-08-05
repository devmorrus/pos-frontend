import type { PurchaseOrderFormValues } from "../types/purchaseOrder";

export function validatePurchaseOrderForm(values: PurchaseOrderFormValues) {
  const errors: Record<string, string> = {};

  if (!values.supplierId) {
    errors.supplierId = "Supplier wajib dipilih.";
  }

  if (values.paymentType === "tempo") {
    if (!values.dueDate) {
      errors.dueDate = "Tanggal jatuh tempo wajib diisi untuk PO tempo.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(values.dueDate);
      selected.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.dueDate = "Tanggal jatuh tempo tidak boleh di masa lalu.";
      }
    }
  }

  if (values.items.length === 0) {
    errors.items = "Minimal satu item wajib diisi.";
    return errors;
  }

  const usedProductIds = new Set<string>();

  values.items.forEach((item, index) => {
    if (!item.productId) {
      errors[`items.${index}.productId`] = "Produk wajib dipilih.";
    } else if (usedProductIds.has(item.productId)) {
      errors[`items.${index}.productId`] = "Produk tidak boleh duplikat.";
    } else {
      usedProductIds.add(item.productId);
    }

    if (!item.qty || Number(item.qty) <= 0) {
      errors[`items.${index}.qty`] = "Qty harus lebih dari 0.";
    } else if (Number(item.qty) > 99999999.99) {
      errors[`items.${index}.qty`] = "Qty tidak boleh melebihi 99.999.999,99.";
    } else if (String(item.qty).includes(".")) {
      const decimals = String(item.qty).split(".")[1];
      if (decimals && decimals.length > 2) {
        errors[`items.${index}.qty`] = "Qty maksimal 2 digit desimal.";
      }
    }

    if (!item.unitCost || Number(item.unitCost) <= 0) {
      errors[`items.${index}.unitCost`] = "Unit cost harus lebih dari 0.";
    } else if (Number(item.unitCost) > 99999999999.99) {
      errors[`items.${index}.unitCost`] = "Unit cost tidak boleh melebihi 99.999.999.999,99.";
    } else if (String(item.unitCost).includes(".")) {
      const decimals = String(item.unitCost).split(".")[1];
      if (decimals && decimals.length > 2) {
        errors[`items.${index}.unitCost`] = "Unit cost maksimal 2 digit desimal.";
      }
    }
  });

  return errors;
}
