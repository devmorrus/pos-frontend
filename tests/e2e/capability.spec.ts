import { expect, test } from "@playwright/test";
import {
  adminSession,
  allCapabilityCodes,
  buildCapabilitySnapshot,
  industryProfiles,
  mockCapabilityEndpoints,
  mockIndustryProfileUpdate,
  mockOutlets,
  ownerSession,
  seedAuthSession,
} from "./fixtures/morrus";

test.describe("Capability & industry profile", () => {
  test("onboarding menampilkan profil target dan mengirim kode yang dipilih", async ({ page }) => {
    await mockCapabilityEndpoints(page);
    await page.route("**/api/auth/register-owner", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ownerSession),
      });
    });

    const registerRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/auth/register-owner") &&
        request.method() === "POST",
    );

    await page.goto("/signup");
    await page.getByPlaceholder("Masukkan nama lengkap Anda").fill("Owner Test");
    await page.getByPlaceholder("Contoh: owner@namabisnis.com").fill("owner@example.test");
    await page.getByPlaceholder("Minimal 8 karakter").fill("Password123!");
    await page.getByPlaceholder("Ulangi password Anda").fill("Password123!");
    await page.getByRole("button", { name: "Lanjutkan" }).click();
    await page.getByRole("button", { name: "Lanjutkan" }).click();

    await page.getByPlaceholder("Contoh: Kopi Kenangan").fill("Toko Elektronik");
    const profileSelect = page.locator("select");
    await expect(profileSelect).toContainText("Elektronik");
    await expect(profileSelect).toContainText("F&B");
    await expect(profileSelect).toContainText("Retail Umum");

    await profileSelect.selectOption("electronics");
    await page.getByRole("button", { name: "Lanjutkan" }).click();
    await page.getByPlaceholder("Contoh: Cabang Central Jakarta").fill("Outlet Utama");
    await expect(page.getByPlaceholder("Masukkan kode unik, contoh: PST01")).not.toHaveValue("");
    await page.getByRole("button", { name: "Selesaikan Pendaftaran" }).click();

    const body = (await registerRequest).postDataJSON() as {
      business: { category: string; industryProfileCode: string };
    };
    expect(body.business.industryProfileCode).toBe("electronics");
    expect(body.business.category).toBe("Elektronik");
  });

  test("menu nonaktif hilang dan direct URL menampilkan fitur belum aktif", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    await mockCapabilityEndpoints(page, {
      enabled: allCapabilityCodes.filter((code) => code !== "inventory.buffer_stock"),
    });

    await page.goto("/buffer-stock");
    await expect(page.getByText("Fitur belum aktif")).toBeVisible();

    await expect(page.getByRole("link", { name: "Buffer Stock" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Stok", exact: true })).toBeVisible();
  });

  test("owner dapat mengganti profil setelah konfirmasi", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    const current = buildCapabilitySnapshot({ profile: industryProfiles[3], revision: 0 });
    const next = buildCapabilitySnapshot({ profile: industryProfiles[1], revision: 1 });
    await mockCapabilityEndpoints(page, { snapshot: current });
    await mockIndustryProfileUpdate(page, next);

    const updateRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/capabilities/industry-profile") &&
        request.method() === "PUT",
    );

    await page.goto("/settings/capabilities");
    await expect(page.getByRole("heading", { name: "Profil Industri & Fitur" })).toBeVisible();
    await page.locator("main select").first().selectOption("electronics");
    await expect(page.getByText("Ganti profil ke Elektronik?")).toBeVisible();
    await page.getByRole("button", { name: "Ya, ganti profil" }).click();

    const body = (await updateRequest).postDataJSON() as {
      expectedRevision: number;
      profileCode: string;
    };
    expect(body.profileCode).toBe("electronics");
    expect(body.expectedRevision).toBe(0);
    await expect(
      page.getByText("Toko gadget, komputer, aksesori, dan perangkat elektronik."),
    ).toBeVisible();
  });

  test("konflik revision memuat ulang konfigurasi terbaru", async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    const current = buildCapabilitySnapshot({ profile: industryProfiles[3], revision: 0 });
    const latest = buildCapabilitySnapshot({ profile: industryProfiles[2], revision: 2 });
    await mockCapabilityEndpoints(page, { snapshot: current });

    let configurationCalls = 0;
    await page.route("**/api/capabilities/configuration*", async (route) => {
      configurationCalls += 1;
      const snapshot = configurationCalls === 1 ? current : latest;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(snapshot),
      });
    });
    await page.route("**/api/capabilities/industry-profile", async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Konflik revision",
          code: "CAPABILITY_REVISION_CONFLICT",
        }),
      });
    });

    await page.goto("/settings/capabilities");
    await expect(page.getByRole("heading", { name: "Profil Industri & Fitur" })).toBeVisible();
    await page.locator("main select").first().selectOption("electronics");
    await page.getByRole("button", { name: "Ya, ganti profil" }).click();

    await expect(
      page.getByText(/Konfigurasi telah diubah oleh pengguna lain/),
    ).toBeVisible();
    await expect(page.locator("main select").first()).toHaveValue("food-beverage");
  });

  test("admin dapat melihat halaman tetapi kontrol edit disabled", async ({ page }) => {
    await seedAuthSession(page, adminSession);
    await mockOutlets(page);
    await mockCapabilityEndpoints(page);

    await page.goto("/settings/capabilities");
    await expect(page.getByRole("heading", { name: "Profil Industri & Fitur" })).toBeVisible();
    await expect(page.locator("main select").first()).toBeDisabled();
    await expect(page.getByRole("button", { name: "Inherit" }).first()).toBeDisabled();
  });
});
