import { expect, test } from "@playwright/test";
import {
  mockLogin,
  mockOutlets,
  mockRefresh,
  mockRevoke,
  ownerSession,
} from "./fixtures/morrus";

test.describe("Sign in flow", () => {
  test("login berhasil dan user masuk ke dashboard shell", async ({ page }) => {
    await mockLogin(page, ownerSession);
    await mockRefresh(page, ownerSession);
    await mockRevoke(page);
    await mockOutlets(page);

    await page.goto("/signin");

    await page.getByLabel("Email").fill("owner@morruspos.com");
    await page.getByPlaceholder("Masukkan password").fill("owner123");
    await page.getByRole("button", { name: "Masuk ke MorrusPOS" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard Operasional", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dashboard Bisnis", exact: true })).toBeVisible();
    await expect(page.getByText("Morrus Owner", { exact: true })).toBeVisible();
    await expect(page.getByText("Owner · Semua outlet", { exact: true })).toBeVisible();

    const storedSession = await page.evaluate(() =>
      window.localStorage.getItem("morruspos.auth"),
    );
    expect(storedSession).toContain("Morrus Owner");
  });
});
