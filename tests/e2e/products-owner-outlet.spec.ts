import { expect, test } from "@playwright/test";
import {
  mockCapabilityEndpoints,
  mockCategories,
  mockOutlets,
  mockProducts,
  ownerSession,
  seedAuthSession,
} from "./fixtures/morrus";

test.describe("Owner products flow", () => {
  test("owner diminta memilih outlet setelah cakupan diubah ke semua outlet", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    await mockCategories(page);
    await mockProducts(page);
    await mockCapabilityEndpoints(page);

    await page.goto("/products");

    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByText("Nasi Goreng")).toBeVisible();
    await expect(page.getByText("SKU-001")).toBeVisible();
    await expect(page.getByText("porsi")).toBeVisible();

    await page.locator("header select").selectOption("");
    await expect(page.getByText("Pilih outlet terlebih dahulu")).toBeVisible();

    await page.locator("header select").selectOption({
      label: "Outlet Utama",
    });
    await expect(page.getByText("Nasi Goreng")).toBeVisible();
  });
});
