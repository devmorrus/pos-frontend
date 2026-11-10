import { expect, test } from "@playwright/test";

test("landing reveals sections and preserves navigation and theme controls", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Mulai Uji Coba Gratis 30 Hari/ })).toHaveAttribute("href", "/signup");

  await page.getByRole("button", { name: "Ⅱ Jeda animasi latar" }).click();
  await expect(page.locator(".saas-landing")).toHaveAttribute("data-motion-paused", "true");
  await page.getByRole("button", { name: "▶ Lanjutkan animasi latar" }).click();
  await expect(page.locator(".saas-landing")).toHaveAttribute("data-motion-paused", "false");

  const themeToggle = page.getByRole("button", { name: /Aktifkan tema/ });
  const previousLabel = await themeToggle.getAttribute("aria-label");
  await themeToggle.click();
  await expect(themeToggle).not.toHaveAttribute("aria-label", previousLabel!);

  const feature = page.locator(".feature-card").first();
  await feature.scrollIntoViewIfNeeded();
  await expect(feature).toHaveAttribute("data-revealed", "true");
  await expect(feature).toBeVisible();
  const pricing = page.locator(".pricing-card").first();
  await pricing.scrollIntoViewIfNeeded();
  await expect(pricing).toHaveAttribute("data-revealed", "true");
  await expect(pricing.getByRole("link")).toHaveAttribute("href", "/signup?package=Free%20Trial");
});

test("mobile reduced motion keeps content visible without animation or horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveCSS("animation-name", "none");
  await expect(page.locator(".motion-toggle")).toBeHidden();
  await expect(page.locator(".landing-aurora span").first()).toHaveCSS("animation-name", "none");

  const feature = page.locator(".feature-card").first();
  await feature.scrollIntoViewIfNeeded();
  await expect(feature).toHaveAttribute("data-revealed", "true");
  expect(await feature.evaluate((element) => element.getAnimations().length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
