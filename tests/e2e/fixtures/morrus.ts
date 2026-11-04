import type { Page, Route } from "@playwright/test";
import type { AuthSession } from "../../../src/features/auth/types/auth";
import type {
  CapabilityChangeLog,
  CapabilitySnapshot,
  EffectiveCapability,
  IndustryProfile,
} from "../../../src/features/capabilities/types/capability";

const businessId = "11111111-2222-3333-4444-555555555555";

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
  businessId,
  subscriptionStatus: "Active",
  trialEndDate: "2027-01-01T00:00:00Z",
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
  businessId,
  subscriptionStatus: "Active",
  trialEndDate: "2027-01-01T00:00:00Z",
};

export const industryProfiles: IndustryProfile[] = [
  {
    id: "ca100001-0000-4000-8000-000000000001",
    code: "general",
    name: "General",
    description: "Konfigurasi umum untuk bisnis lintas industri.",
  },
  {
    id: "ca100007-0000-4000-8000-000000000007",
    code: "electronics",
    name: "Elektronik",
    description: "Toko gadget, komputer, aksesori, dan perangkat elektronik.",
  },
  {
    id: "ca100002-0000-4000-8000-000000000002",
    code: "food-beverage",
    name: "F&B",
    description: "Kafe, restoran, bakery, dan usaha kuliner.",
  },
  {
    id: "ca100003-0000-4000-8000-000000000003",
    code: "retail",
    name: "Retail Umum",
    description: "Toko retail dan perdagangan umum.",
  },
];

const capabilityCatalog: Array<Pick<EffectiveCapability, "code" | "name" | "module" | "scope">> = [
  { code: "sales.pos", name: "POS Kasir", module: "Sales", scope: "Outlet" },
  { code: "sales.transactions", name: "Riwayat Transaksi", module: "Sales", scope: "Outlet" },
  { code: "customers", name: "Customer & Member", module: "Sales", scope: "Business" },
  { code: "catalog.products", name: "Produk & Kategori", module: "Catalog", scope: "Business" },
  { code: "catalog.variants", name: "Varian Produk", module: "Catalog", scope: "Business" },
  { code: "catalog.modifiers", name: "Modifier Produk", module: "Catalog", scope: "Business" },
  { code: "catalog.recipes", name: "Resep / BOM", module: "Catalog", scope: "Business" },
  { code: "catalog.batch_expiry", name: "Batch & Kedaluwarsa", module: "Catalog", scope: "Business" },
  { code: "catalog.serial_tracking", name: "Serial / IMEI Produk", module: "Catalog", scope: "Business" },
  { code: "inventory.stock", name: "Manajemen Stok", module: "Inventory", scope: "Outlet" },
  { code: "inventory.buffer_stock", name: "Buffer Stock", module: "Inventory", scope: "Outlet" },
  { code: "inventory.opname", name: "Stock Opname", module: "Inventory", scope: "Outlet" },
  { code: "inventory.transfer", name: "Transfer Stok", module: "Inventory", scope: "Outlet" },
  { code: "procurement.purchasing", name: "Supplier & Pembelian", module: "Procurement", scope: "Outlet" },
  { code: "procurement.supplier_debt", name: "Utang Supplier", module: "Procurement", scope: "Business" },
  { code: "procurement.supplier_return", name: "Retur Supplier", module: "Procurement", scope: "Outlet" },
  { code: "consignment", name: "Konsinyasi", module: "Procurement", scope: "Outlet" },
  { code: "channels.settlement", name: "Channel Settlement", module: "Channels", scope: "Outlet" },
  { code: "channels.gobiz", name: "Integrasi GoBiz", module: "Channels", scope: "Outlet" },
  { code: "pricing.tax_service", name: "Pajak & Service Charge", module: "Pricing", scope: "Outlet" },
  { code: "pricing.promotions", name: "Promo Campaign", module: "Pricing", scope: "Outlet" },
  { code: "pricing.vouchers", name: "Voucher", module: "Pricing", scope: "Outlet" },
  { code: "accounting.core", name: "Akuntansi", module: "Accounting", scope: "Business" },
  { code: "accounting.cashflow", name: "Arus Kas Manual", module: "Accounting", scope: "Business" },
  { code: "accounting.integration", name: "Integrasi Akuntansi", module: "Accounting", scope: "Business" },
  { code: "reports.operational", name: "Laporan Operasional", module: "Reports", scope: "Business" },
  { code: "reports.accounting", name: "Laporan Akuntansi", module: "Reports", scope: "Business" },
  { code: "storefront.public", name: "Public Storefront", module: "Channels", scope: "Outlet" },
];

export const allCapabilityCodes = capabilityCatalog.map((capability) => capability.code);

export function buildCapabilitySnapshot(options?: {
  enabled?: string[];
  profile?: IndustryProfile;
  revision?: number;
  outletId?: string | null;
}): CapabilitySnapshot {
  const enabled = new Set(options?.enabled ?? allCapabilityCodes);
  const profile = options?.profile ?? industryProfiles[3];

  return {
    businessId,
    outletId: options?.outletId ?? null,
    revision: options?.revision ?? 0,
    industryProfile: profile,
    capabilities: capabilityCatalog.map((capability) => ({
      id: `cap-${capability.code}`,
      ...capability,
      enabled: enabled.has(capability.code),
      businessEnabled: enabled.has(capability.code),
      profileDefault: enabled.has(capability.code),
      businessOverride: null,
      outletOverride: null,
      source: "IndustryProfile",
      canOverride: true,
    })),
  };
}

export async function mockCapabilityEndpoints(
  page: Page,
  options?: {
    enabled?: string[];
    snapshot?: CapabilitySnapshot;
    history?: CapabilityChangeLog[];
    profiles?: IndustryProfile[];
  },
) {
  const snapshot = options?.snapshot ?? buildCapabilitySnapshot({ enabled: options?.enabled });
  await mockJson(page, "**/api/public/industry-profiles", options?.profiles ?? industryProfiles);
  await mockJson(page, "**/api/capabilities/effective*", snapshot);
  await mockJson(page, "**/api/capabilities/configuration*", snapshot);
  await mockJson(page, "**/api/capabilities/history*", options?.history ?? []);
  return snapshot;
}

export async function mockIndustryProfileUpdate(page: Page, snapshot: CapabilitySnapshot) {
  await mockJson(page, "**/api/capabilities/industry-profile", snapshot, { method: "PUT" });
}

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
      trackingMode: "quantity",
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
