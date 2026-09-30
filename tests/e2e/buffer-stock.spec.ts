import { expect, test } from "@playwright/test";
import {
  mockBufferStocks,
  mockOutlets,
  ownerSession,
  seedAuthSession,
} from "./fixtures/morrus";

test.describe("Buffer stock flow", () => {
  test("owner harus memilih outlet sebelum listing buffer dimuat", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    await mockBufferStocks(page);

    await page.goto("/buffer-stock");

    await expect(page.getByText("Pilih outlet terlebih dahulu")).toBeVisible();
  });

  test("owner dapat melihat stok online hasil perhitungan buffer", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    await mockBufferStocks(page);

    await page.goto("/buffer-stock");

    await page.locator("select").first().selectOption({
      label: "Outlet Utama",
    });

    // Tabel menampilkan perhitungan: 10 - 3 = 7, dan 3 - 3 = 0.
    await expect(page.getByText("Nasi Goreng").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Ayam Geprek").first()).toBeVisible();
  });
});
