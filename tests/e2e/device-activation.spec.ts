import { expect, test } from "@playwright/test";
import {
  mockCapabilityEndpoints,
  mockOutlets,
  ownerSession,
  seedAuthSession,
} from "./fixtures/morrus";

for (const response of [
  {
    contentType: "text/plain",
    body: "Kode pairing tidak valid atau sudah kedaluwarsa.",
    message: "Kode pairing tidak valid atau sudah kedaluwarsa.",
  },
  {
    contentType: "application/json",
    body: JSON.stringify({ message: "Kode pairing sudah digunakan." }),
    message: "Kode pairing sudah digunakan.",
  },
  {
    contentType: "text/plain",
    body: "",
    message: "Terjadi kesalahan saat memproses permintaan.",
  },
]) {
  test(`activation displays API error: ${response.message}`, async ({ page }) => {
    await seedAuthSession(page, ownerSession);
    await mockOutlets(page);
    await mockCapabilityEndpoints(page);
    await page.route("**/api/pos-devices/pair", (route) => route.fulfill({
      status: 400,
      contentType: response.contentType,
      body: response.body,
    }));

    await page.goto("/device-activation");
    await page.getByLabel("Kode pairing").fill("3UU39232");
    await page.getByLabel("Nama perangkat").fill("MacBook");
    await page.getByRole("button", { name: "Aktifkan perangkat", exact: true }).click();

    await expect(page.getByText(response.message, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aktifkan perangkat", exact: true })).toBeEnabled();
  });
}
