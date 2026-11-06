import { expect, test } from "@playwright/test";
import {
  adminSession,
  mockCapabilityEndpoints,
  mockJson,
  seedAuthSession,
} from "./fixtures/morrus";

const outletId = adminSession.outletId!;

test("kasir yang kalah race stok tetap di POS dan melihat error", async ({ page }) => {
  await seedAuthSession(page, adminSession);
  await mockCapabilityEndpoints(page);
  await mockJson(page, "**/api/cashier-sessions/current*", {
    id: "41b2239a-fd66-482f-b3c7-04e9bf70d001",
    outletId,
    outletName: "Outlet Utama",
    userId: adminSession.userId,
    userName: adminSession.name,
    openingTime: "2026-11-06T08:00:00Z",
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
      sku: "LAST-1",
      name: "Unit Terakhir",
      barcode: null,
      basePrice: 10000,
      costPrice: 7000,
      unit: "pcs",
      isConsignment: false,
      qtyOnHand: 1,
      hasVariants: false,
      trackingMode: "quantity",
    },
  ]);
  await mockJson(page, "**/api/transactions/pricing-preview", {
    subtotal: 10000,
    manualDiscountTotal: 0,
    promoDiscountTotal: 0,
    voucherDiscountTotal: 0,
    serviceChargeTotal: 0,
    taxTotal: 0,
    grandTotal: 10000,
    appliedVoucher: null,
    appliedPromo: null,
    lineBreakdowns: [],
  }, { method: "POST" });

  let checkoutRequests = 0;
  await page.route("**/api/transactions/checkout", async (route) => {
    checkoutRequests += 1;
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Stok baru saja habis karena transaksi kasir lain.",
        code: "STOCK_MOVEMENT_INVALID",
      }),
    });
  });

  await page.goto("/pos");
  await page.getByRole("button", { name: /Unit Terakhir/ }).click();
  await page.getByRole("button", { name: /Checkout & Bayar/ }).click();
  await page.locator('input[placeholder="0"]').fill("10000");
  await page.getByRole("button", { name: /Checkout Sekarang/ }).click();

  await expect(page).toHaveURL(/\/pos$/);
  await expect(page.getByText("Stok baru saja habis karena transaksi kasir lain.")).toBeVisible();
  await expect(page.getByText(/Ada checkout tertunda/)).toBeVisible();
  expect(checkoutRequests).toBe(1);
});
