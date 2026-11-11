import { expect, test } from "@playwright/test";
import { adminSession, mockCapabilityEndpoints, mockJson, seedAuthSession } from "./fixtures/morrus";

test("inventory menampilkan stok fisik, dipesan, tersedia, dan terjual", async ({ page }) => {
  await seedAuthSession(page, adminSession);
  await mockCapabilityEndpoints(page);
  await mockJson(page, /\/api\/inventory(\?.*)?$/, [{
    productId: "10000000-0000-4000-8000-000000000001",
    productVariantId: null,
    sku: "RES-1",
    productName: "Produk Reservasi",
    categoryId: "20000000-0000-4000-8000-000000000001",
    categoryName: "Produk",
    barcode: null,
    unit: "pcs",
    isConsignment: false,
    qtyOnHand: 10,
    qtyReserved: 3,
    qtyAvailable: 7,
    qtySold: 12,
    minStockAlert: 2,
    isLowStock: false,
    costPrice: 7000,
    basePrice: 10000,
    updatedAt: "2026-11-11T03:00:00Z",
    trackingMode: "quantity",
    trackedItemCount: 0,
  }]);
  await mockJson(page, /\/api\/stock-reservations(\?.*)?$/, [{
    id: "30000000-0000-4000-8000-000000000001",
    stockLocationId: adminSession.outletId,
    stockLocationName: "Outlet Utama",
    cashierSessionId: "40000000-0000-4000-8000-000000000001",
    createdBy: adminSession.userId,
    createdByName: adminSession.name,
    sourceType: "pos",
    status: "active",
    expiresAt: "2026-11-11T12:00:00Z",
    resolvedAt: null,
    releaseReason: null,
    createdAt: "2026-11-11T11:30:00Z",
    items: [{
      id: "50000000-0000-4000-8000-000000000001",
      productId: "10000000-0000-4000-8000-000000000001",
      productVariantId: null,
      productName: "Produk Reservasi",
      sku: "RES-1",
      qty: 3,
      trackingMode: "quantity",
      productBatchId: null,
      batchNumber: null,
      productSerialId: null,
      serialNumber: null,
      status: "active",
    }],
  }]);

  await page.goto("/inventory");
  await expect(page.getByText("Stok tersedia")).toBeVisible();
  await expect(page.getByText("Terjual bersih", { exact: true })).toBeVisible();
  await expect(page.getByText("Fisik 10 · Min. 2")).toBeVisible();
  await page.getByRole("button", { name: "Dipesan 3" }).click();
  await expect(page.getByText(/Kasir Morrus Admin/)).toBeVisible();
  await expect(page.getByText("3 pcs", { exact: true })).toBeVisible();
});
