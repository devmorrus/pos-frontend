import { expect, test } from "@playwright/test";
import { mockCapabilityEndpoints, mockJson, ownerSession, seedAuthSession } from "./fixtures/morrus";

test("penerima mencatat qty aktual dan alasan selisih", async ({ page }) => {
  await seedAuthSession(page, ownerSession);
  await mockCapabilityEndpoints(page);
  const sourceId = "10000000-0000-4000-8000-000000000001";
  const targetId = "20000000-0000-4000-8000-000000000002";
  await mockJson(page, "**/api/stock-locations*", [
    { id: targetId, type: "outlet", code: "DST", name: "Outlet Tujuan", outletId: targetId, outletName: "Outlet Tujuan", isActive: true },
  ]);
  let status = "in_transit";
  const transfer = () => ({
    id: "30000000-0000-4000-8000-000000000003",
    fromStockLocationId: sourceId, fromStockLocationName: "Gudang Pusat", fromStockLocationType: "warehouse", fromOutletId: null,
    toStockLocationId: targetId, toStockLocationName: "Outlet Tujuan", toStockLocationType: "outlet", toOutletId: targetId,
    transferNumber: "TRF-TEST-001", status, requestedBy: "user-1", requestedByName: "Owner Test",
    approvedBy: null, approvedByName: null, createdAt: "2026-11-11T00:00:00Z", receivedAt: null,
    receiptNote: null, hasVariance: status === "received_with_variance", totalSentQty: 10,
    totalReceivedQty: status === "received_with_variance" ? 8 : null, totalDifferenceQty: status === "received_with_variance" ? -2 : null,
    items: [{ id: "40000000-0000-4000-8000-000000000004", productId: "product-1", productName: "Kopi", sku: "KOPI-1", qty: 10, sentQty: 10, receivedQty: status === "received_with_variance" ? 8 : null, differenceQty: status === "received_with_variance" ? -2 : null, varianceReasonCode: status === "received_with_variance" ? "short_shipped" : null, varianceNote: status === "received_with_variance" ? "Dua unit tidak ada." : null, unitCostSnapshot: 5000, varianceValue: status === "received_with_variance" ? -10000 : null }],
  });
  await page.route(/\/api\/stocktransfers\/incoming(\?.*)?$/, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([transfer()]) }));
  await page.route("**/api/stocktransfers/*/receive", async (route) => {
    const body = route.request().postDataJSON() as { requestId: string; items: { receivedQty: number; varianceReasonCode: string }[] };
    expect(route.request().headers()["idempotency-key"]).toBe(body.requestId);
    expect(body.items[0]).toMatchObject({ receivedQty: 8, varianceReasonCode: "short_shipped" });
    status = "received_with_variance";
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(transfer()) });
  });

  await page.goto("/stock-transfers/incoming");
  await expect(page.getByText("TRF-TEST-001")).toBeVisible();
  await page.getByRole("button", { name: /Terima transfer TRF-TEST-001/ }).click();
  await page.getByLabel("Qty diterima").fill("8");
  await page.getByLabel("Alasan").selectOption("short_shipped");
  await page.getByPlaceholder("Jelaskan kondisi selisih...").fill("Dua unit tidak ada.");
  await page.getByRole("button", { name: "Selesaikan penerimaan" }).click();
  await expect(page.getByText(/berhasil diterima dengan selisih/)).toBeVisible();
});
