import { expect, test } from "@playwright/test";
import {
  adminSession,
  mockCapabilityEndpoints,
  mockJson,
  seedAuthSession,
} from "./fixtures/morrus";

const outletId = adminSession.outletId!;
type CapturedCheckout = {
  id: string;
  payments: Array<{ id: string; method: string; amount: number }>;
  items: Array<{
    productId: string;
    qty: number;
    batchAllocations?: Array<{ productBatchId: string; qty: number }>;
    serialIds?: string[];
  }>;
};

test("POS mengirim alokasi batch, multi-serial, dan menjual produk non-stok", async ({ page }) => {
  await seedAuthSession(page, adminSession);
  await mockCapabilityEndpoints(page);
  await mockJson(page, "**/api/cashier-sessions/current*", {
    id: "41b2239a-fd66-482f-b3c7-04e9bf70d001",
    outletId,
    outletName: "Outlet Utama",
    userId: adminSession.userId,
    userName: adminSession.name,
    openingTime: "2026-11-04T08:00:00Z",
    closingTime: null,
    openingCash: 100000,
    expectedCash: 100000,
    actualCash: null,
    variance: null,
    status: "open",
    totalCashReceived: 0,
    totalPettyCashExpenses: 0,
    paymentsSummary: {},
  });
  await mockJson(page, /\/api\/products(\?.*)?$/, [
    {
      id: "10000000-0000-4000-8000-000000000001",
      categoryId: "20000000-0000-4000-8000-000000000001",
      sku: "BATCH-1",
      name: "Susu Batch",
      barcode: null,
      basePrice: 10000,
      costPrice: 7000,
      unit: "pcs",
      isConsignment: false,
      qtyOnHand: 10,
      qtyReserved: 0,
      qtyAvailable: 10,
      hasVariants: false,
      trackingMode: "batch",
    },
    {
      id: "10000000-0000-4000-8000-000000000002",
      categoryId: "20000000-0000-4000-8000-000000000001",
      sku: "SERIAL-1",
      name: "Ponsel Serial",
      barcode: null,
      basePrice: 10000,
      costPrice: 7000,
      unit: "pcs",
      isConsignment: false,
      qtyOnHand: 2,
      qtyReserved: 0,
      qtyAvailable: 2,
      hasVariants: false,
      trackingMode: "serial",
    },
    {
      id: "10000000-0000-4000-8000-000000000003",
      categoryId: "20000000-0000-4000-8000-000000000001",
      sku: "SERVICE-1",
      name: "Jasa Instalasi",
      barcode: null,
      basePrice: 10000,
      costPrice: 0,
      unit: "jasa",
      isConsignment: false,
      qtyOnHand: 0,
      qtyReserved: 0,
      qtyAvailable: 0,
      hasVariants: false,
      trackingMode: "none",
    },
  ]);
  await mockJson(page, "**/api/products/10000000-0000-4000-8000-000000000001/stock-tracking*", {
    trackingMode: "batch",
    qtyOnHand: 10,
    qtyReserved: 0,
    qtyAvailable: 10,
    batches: [
      { id: "30000000-0000-4000-8000-000000000001", batchNumber: "LOT-A", expiryDate: "2026-12-01T00:00:00Z", qtyRemaining: 3, qtyReserved: 0, qtyAvailable: 3 },
      { id: "30000000-0000-4000-8000-000000000002", batchNumber: "LOT-B", expiryDate: "2027-01-01T00:00:00Z", qtyRemaining: 7, qtyReserved: 0, qtyAvailable: 7 },
    ],
    serials: [],
  });
  await mockJson(page, "**/api/products/10000000-0000-4000-8000-000000000002/stock-tracking*", {
    trackingMode: "serial",
    qtyOnHand: 2,
    qtyReserved: 0,
    qtyAvailable: 2,
    batches: [],
    serials: [
      { id: "40000000-0000-4000-8000-000000000001", serialNumber: "IMEI-001", status: "available" },
      { id: "40000000-0000-4000-8000-000000000002", serialNumber: "IMEI-002", status: "available" },
    ],
  });
  await mockJson(page, "**/api/transactions/pricing-preview", {
    subtotal: 40000,
    manualDiscountTotal: 0,
    promoDiscountTotal: 0,
    voucherDiscountTotal: 0,
    serviceChargeTotal: 0,
    taxTotal: 0,
    grandTotal: 40000,
    appliedVoucher: null,
    appliedPromo: null,
    lineBreakdowns: [],
  }, { method: "POST" });
  let reservationId: string | null = null;
  await page.route("**/api/stock-reservations", async (route) => {
    const payload = route.request().postDataJSON() as { id: string };
    reservationId = payload.id;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ id: payload.id, status: "active", expiresAt: "2026-11-11T12:00:00Z", items: [] }),
    });
  });

  let checkoutPayload: CapturedCheckout | null = null;
  let idempotencyHeader: string | undefined;
  let checkoutRequests = 0;
  await page.route("**/api/transactions/checkout", async (route) => {
    checkoutRequests += 1;
    checkoutPayload = route.request().postDataJSON() as CapturedCheckout;
    idempotencyHeader = route.request().headers()["idempotency-key"];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "50000000-0000-4000-8000-000000000001" }),
    });
  });

  await page.goto("/pos");
  await expect(page.getByText("Susu Batch")).toBeVisible();
  await page.getByRole("button", { name: /Susu Batch/ }).click();
  await page.getByRole("button", { name: /Ponsel Serial/ }).click();
  await page.getByRole("button", { name: /Ponsel Serial/ }).click();
  await page.getByRole("button", { name: /Jasa Instalasi/ }).click();
  await page.getByRole("button", { name: /Checkout & Bayar/ }).click();

  await page.getByRole("button", { name: "Pilih batch" }).click();
  await expect(page.getByLabel("Qty batch LOT-A")).toHaveValue("1");
  await page.getByRole("button", { name: "Simpan alokasi" }).click();

  await page.getByRole("button", { name: "Pilih serial / IMEI" }).click();
  await page.getByText("IMEI-001", { exact: true }).click();
  await page.getByText("IMEI-002", { exact: true }).click();
  await page.getByRole("button", { name: "Simpan alokasi" }).click();

  await page.locator('input[placeholder="0"]').fill("40000");
  await page.getByRole("button", { name: /Checkout Sekarang/ }).evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect.poll(() => checkoutPayload).not.toBeNull();
  expect(checkoutRequests).toBe(1);

  const items = checkoutPayload!.items;
  expect(idempotencyHeader).toBe(checkoutPayload!.id);
  expect(reservationId).toBe(checkoutPayload!.id);
  expect(checkoutPayload!.payments[0].id).toMatch(/^[0-9a-f-]{36}$/);
  expect(items.find((item) => item.productId.endsWith("0001"))?.batchAllocations).toEqual([
    { productBatchId: "30000000-0000-4000-8000-000000000001", qty: 1 },
  ]);
  expect(items.find((item) => item.productId.endsWith("0002"))?.serialIds).toEqual([
    "40000000-0000-4000-8000-000000000001",
    "40000000-0000-4000-8000-000000000002",
  ]);
  expect(items.find((item) => item.productId.endsWith("0003"))?.qty).toBe(1);
});
