import { expect, test } from "@playwright/test";
import {
  mockCapabilityEndpoints,
  mockJson,
  mockOutlets,
  ownerSession,
  seedAuthSession,
} from "./fixtures/morrus";

test("owner memilih outlet dan membuka sesi kasir dengan kas awal", async ({ page }) => {
  await seedAuthSession(page, ownerSession);
  await mockOutlets(page);
  await mockCapabilityEndpoints(page);
  await mockJson(page, "**/api/cashier-sessions/current*", null);
  await mockJson(page, /\/api\/products(\?.*)?$/, []);

  let openPayload: { openingCash: number; outletId?: string } | null = null;
  await page.route("**/api/cashier-sessions/open", async (route) => {
    openPayload = route.request().postDataJSON() as typeof openPayload;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "41b2239a-fd66-482f-b3c7-04e9bf70d001",
        outletId: "8bba5427-017e-40fb-886f-5e4c6c9a3809",
        outletName: "Outlet Utama",
        userId: ownerSession.userId,
        userName: ownerSession.name,
        openingTime: "2026-11-05T08:00:00Z",
        closingTime: null,
        openingCash: 200000,
        expectedCash: 200000,
        actualCash: null,
        variance: null,
        status: "open",
        totalCashReceived: 0,
        totalPettyCashExpenses: 0,
        paymentsSummary: {},
      }),
    });
  });

  await page.goto("/cashier/session");
  await page.locator("main select").first().selectOption("8bba5427-017e-40fb-886f-5e4c6c9a3809");
  await page.locator('main input[type="number"]').first().fill("200000");
  await page.getByRole("button", { name: "Buka sesi kasir" }).click();

  await expect(page).toHaveURL(/\/pos$/);
  expect(openPayload).toEqual({
    openingCash: 200000,
    outletId: "8bba5427-017e-40fb-886f-5e4c6c9a3809",
  });
});
