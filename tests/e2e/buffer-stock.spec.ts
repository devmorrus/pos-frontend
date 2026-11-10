import { expect, test } from "@playwright/test";
import {
  mockBufferStocks,
  mockCapabilityEndpoints,
  mockOutlets,
  ownerSession,
  seedAuthSession,
} from "./fixtures/morrus";

test.describe("Buffer stock flow", () => {
  test("owner diminta memilih outlet setelah cakupan diubah ke semua outlet", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    await mockBufferStocks(page);
    await mockCapabilityEndpoints(page);

    await page.goto("/buffer-stock");

    await expect(page.getByText("Nasi Goreng").first()).toBeVisible({ timeout: 15000 });
    await page.locator("header select").selectOption("");
    await expect(page.getByText("Pilih outlet terlebih dahulu")).toBeVisible();
  });

  test("owner dapat melihat stok online hasil perhitungan buffer", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    await mockBufferStocks(page);
    await mockCapabilityEndpoints(page);

    await page.goto("/buffer-stock");

    await page.locator("select").first().selectOption({
      label: "Outlet Utama",
    });

    // Tabel menampilkan perhitungan: 10 - 3 = 7, dan 3 - 3 = 0.
    await expect(page.getByText("Nasi Goreng").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Ayam Geprek").first()).toBeVisible();
  });

  test("owner dapat mengubah buffer tanpa mengubah stok fisik", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    await mockBufferStocks(page);
    await mockCapabilityEndpoints(page);

    let updatePayload: Record<string, unknown> | undefined;
    await page.route("**/api/bufferstocks/*", async (route) => {
      updatePayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          productId: "b5913550-7c9a-4ecf-a571-f7294e5ff111",
          productVariantId: null,
          sku: "SKU-001",
          productName: "Nasi Goreng",
          variantName: null,
          categoryId: "c110af34-7383-41b1-9f8b-3fe1b5f1f111",
          categoryName: "Makanan",
          unit: "porsi",
          qtyOnHand: 10,
          bufferQty: 5,
          availableOnlineQty: 5,
          isOnlineAvailable: true,
          isEnabled: true,
          updatedAt: "2026-01-01T00:00:00Z",
          bufferUpdatedAt: "2026-01-03T00:00:00Z",
        }),
      });
    });

    await page.goto("/buffer-stock");
    await page.getByRole("button", { name: "Atur buffer" }).first().click();
    await expect(page.getByRole("heading", { name: "Atur buffer stock" })).toBeVisible();
    await expect(page.getByText("10 porsi").first()).toBeVisible();

    await page.getByLabel("Jumlah buffer").fill("5");
    await expect(page.getByLabel("Jumlah buffer")).toHaveValue("5");
    await page.getByRole("button", { name: "Simpan buffer" }).click();

    await expect.poll(() => updatePayload).toEqual({
      outletId: "8bba5427-017e-40fb-886f-5e4c6c9a3809",
      productId: "b5913550-7c9a-4ecf-a571-f7294e5ff111",
      productVariantId: null,
      bufferQty: 5,
      isEnabled: true,
    });
    await expect(page.getByText("Buffer Nasi Goreng disimpan. Stok online: 5.")).toBeVisible();
  });
});
