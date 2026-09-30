import type { Page, Route } from "@playwright/test";
import type { AuthSession } from "../../../src/features/auth/types/auth";

export const ownerSession: AuthSession = {
  accessToken: "owner-access-token",
  refreshToken: "owner-refresh-token",
  userId: "a4f78de1-8a9d-4e96-857e-399fa5b5f25a",
  name: "Morrus Owner",
  role: "Owner",
  outletId: null,
  permissions: [
    "transaction.create",
    "transaction.void",
    "product.manage",
    "stock.manage",
    "supplier.manage",
    "consignment.manage",
    "report.view",
  ],
};

export const adminSession: AuthSession = {
  accessToken: "admin-access-token",
  refreshToken: "admin-refresh-token",
  userId: "d54f590a-6e54-4f05-8461-8ff62dfd8d4c",
  name: "Morrus Admin",
  role: "Admin",
  outletId: "8bba5427-017e-40fb-886f-5e4c6c9a3809",
  permissions: [
    "transaction.create",
    "transaction.void",
    "product.manage",
    "stock.manage",
    "supplier.manage",
    "consignment.manage",
    "report.view",
  ],
};

export async function seedAuthSession(page: Page, session: AuthSession) {
  await page.addInitScript(
    ([storageKey, payload]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    ["morruspos.auth", session] as const,
  );
}

export async function mockJson(
  page: Page,
  matcher: string | RegExp,
  responseBody: unknown,
  options?: {
    method?: string;
    status?: number;
  },
) {
  const method = options?.method?.toUpperCase();

  await page.route(matcher, async (route: Route) => {
    if (method && route.request().method().toUpperCase() !== method) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: options?.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    });
  });
}

export async function mockLogin(page: Page, session: AuthSession) {
  await mockJson(page, "**/api/auth/login", session, { method: "POST" });
}

export async function mockRefresh(page: Page, session: AuthSession) {
  await mockJson(page, "**/api/auth/refresh", session, { method: "POST" });
}

export async function mockRevoke(page: Page) {
  await mockJson(page, "**/api/auth/revoke", {}, { method: "POST" });
}

export async function mockOutlets(page: Page) {
  await mockJson(page, "**/api/outlets", [
    {
      id: "8bba5427-017e-40fb-886f-5e4c6c9a3809",
      code: "OUT001",
      name: "Outlet Utama",
      address: "Jl. Utama No. 1",
      phone: "08123456789",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "0d594cfd-989f-47d7-a83e-a2a7f03c934e",
      code: "OUT002",
      name: "Outlet Kedua",
      address: "Jl. Kedua No. 2",
      phone: "08111111111",
      isActive: true,
      createdAt: "2026-01-02T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    },
  ]);
}

export async function mockCategories(page: Page) {
  await mockJson(page, "**/api/categories", [
    {
      id: "c110af34-7383-41b1-9f8b-3fe1b5f1f111",
      name: "Makanan",
      parentId: null,
      parentName: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ]);
}

export async function mockProducts(page: Page) {
  await mockJson(page, /\/api\/products(\?.*)?$/, [
    {
      id: "b5913550-7c9a-4ecf-a571-f7294e5ff111",
      categoryId: "c110af34-7383-41b1-9f8b-3fe1b5f1f111",
      sku: "SKU-001",
      name: "Nasi Goreng",
      barcode: "899001",
      basePrice: 18000,
      unit: "porsi",
      isConsignment: false,
      qtyOnHand: 12,
      isActive: true,
    },
  ]);
}

export async function mockBufferStocks(page: Page) {
  await mockJson(page, /\/api\/bufferstocks(\?.*)?$/, [
    {
      productId: "b5913550-7c9a-4ecf-a571-f7294e5ff111",
      productVariantId: null,
      sku: "SKU-001",
      productName: "Nasi Goreng",
      variantName: null,
      categoryId: "c110af34-7383-41b1-9f8b-3fe1b5f1f111",
      categoryName: "Makanan",
      unit: "porsi",
      qtyOnHand: 10,
      bufferQty: 3,
      availableOnlineQty: 7,
      isOnlineAvailable: true,
      isEnabled: true,
      updatedAt: "2026-01-01T00:00:00Z",
      bufferUpdatedAt: "2026-01-02T00:00:00Z",
    },
    {
      productId: "c5913550-7c9a-4ecf-a571-f7294e5ff222",
      productVariantId: null,
      sku: "SKU-002",
      productName: "Ayam Geprek",
      variantName: null,
      categoryId: "c110af34-7383-41b1-9f8b-3fe1b5f1f111",
      categoryName: "Makanan",
      unit: "pcs",
      qtyOnHand: 3,
      bufferQty: 3,
      availableOnlineQty: 0,
      isOnlineAvailable: false,
      isEnabled: true,
      updatedAt: "2026-01-01T00:00:00Z",
      bufferUpdatedAt: "2026-01-02T00:00:00Z",
    },
  ]);
}
