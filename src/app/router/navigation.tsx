import type { ReactNode } from "react";
import {
  BoxCubeIcon,
  DocsIcon,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
  PlugInIcon,
  TaskIcon,
} from "../../icons";
import type { AuthSession } from "../../features/auth/types/auth";
import { canAccessByPolicy } from "../../features/auth/utils/access";

export type AppRole =
  | "Owner"
  | "Admin"
  | "Kasir"
  | "Gudang"
  | "Keuangan"
  | "KepalaCabang"
  | string;

export type PermissionCode =
  | "transaction.create"
  | "transaction.void"
  | "product.manage"
  | "stock.manage"
  | "supplier.manage"
  | "supplier_return.manage"
  | "consignment.manage"
  | "channel_settlement.manage"
  | "pricing.manage"
  | "customer.manage"
  | "customer.view"
  | "account.manage"
  | "cashflow.view"
  | "cashflow.create"
  | "report.view"
  | "report.cashflow.view"
  | "report.profitloss_accounting.view"
  | "capability.view"
  | "capability.manage"
  | string;

export type CapabilityCode = string;

export type MenuStatus = "active" | "placeholder";

export type NavSubItem = {
  label: string;
  path: string;
  requiredPermissions?: PermissionCode[];
  fallbackRoles?: AppRole[];
  requiredCapabilities?: CapabilityCode[];
};

export type NavItem = {
  label: string;
  path?: string;
  icon: ReactNode;
  requiredPermissions?: PermissionCode[];
  fallbackRoles?: AppRole[];
  requiredCapabilities?: CapabilityCode[];
  status: MenuStatus;
  subItems?: NavSubItem[];
};

const ownerAdminRoles: AppRole[] = ["Owner", "Admin"];
const transactionCreateRoles: AppRole[] = ["Owner", "Admin", "Kasir", "KepalaCabang"];
const transactionReadRoles: AppRole[] = ["Owner", "Admin", "Kasir", "Keuangan", "KepalaCabang"];
const productRoles: AppRole[] = ["Owner", "Admin", "Gudang", "KepalaCabang"];
const stockRoles: AppRole[] = ["Owner", "Admin", "Gudang", "KepalaCabang"];
const supplierRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const supplierReturnRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const consignmentRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const channelRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const pricingRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const accountingRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const cashFlowRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const customerViewRoles: AppRole[] = ["Owner", "Admin", "Keuangan", "KepalaCabang", "Kasir"];
const dashboardRoles: AppRole[] = ["Owner", "Admin", "Keuangan", "KepalaCabang", "Gudang", "Kasir"];
const reportRoles: AppRole[] = ["Owner", "Admin", "Keuangan", "KepalaCabang"];

export const appNavigation: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <GridIcon />,
    fallbackRoles: dashboardRoles,
    status: "active",
  },
  {
    label: "Penjualan",
    icon: <PlugInIcon />,
    status: "active",
    subItems: [
      {
        label: "Sesi Kasir",
        path: "/cashier/session",
        requiredPermissions: ["transaction.create"],
        fallbackRoles: transactionCreateRoles,
        requiredCapabilities: ["sales.pos"],
      },
      {
        label: "POS Kasir",
        path: "/pos",
        requiredPermissions: ["transaction.create"],
        fallbackRoles: transactionCreateRoles,
        requiredCapabilities: ["sales.pos", "catalog.products"],
      },
      {
        label: "Aktivasi Perangkat",
        path: "/device-activation",
        requiredPermissions: ["transaction.create"],
        fallbackRoles: transactionCreateRoles,
        requiredCapabilities: ["sales.pos"],
      },
      {
        label: "Transaksi",
        path: "/transactions",
        fallbackRoles: transactionReadRoles,
        requiredCapabilities: ["sales.transactions"],
      },
      {
        label: "Customers",
        path: "/customers",
        requiredPermissions: ["customer.view"],
        fallbackRoles: customerViewRoles,
        requiredCapabilities: ["customers"],
      },
    ],
  },
  {
    label: "Produk & Stok",
    icon: <BoxCubeIcon />,
    status: "active",
    subItems: [
      {
        label: "Produk",
        path: "/products",
        requiredPermissions: ["product.manage"],
        fallbackRoles: productRoles,
        requiredCapabilities: ["catalog.products"],
      },
      {
        label: "Kategori",
        path: "/categories",
        requiredPermissions: ["product.manage"],
        fallbackRoles: productRoles,
        requiredCapabilities: ["catalog.products"],
      },
      {
        label: "Brand & Model",
        path: "/product-masters",
        requiredPermissions: ["product.manage"],
        fallbackRoles: productRoles,
        requiredCapabilities: ["catalog.products"],
      },
      {
        label: "Stok",
        path: "/inventory",
        requiredPermissions: ["stock.manage"],
        fallbackRoles: stockRoles,
        requiredCapabilities: ["inventory.stock"],
      },
    ],
  },
  {
    label: "Pembelian & Supplier",
    icon: <TaskIcon />,
    status: "active",
    subItems: [
      {
        label: "Supplier",
        path: "/suppliers",
        requiredPermissions: ["supplier.manage"],
        fallbackRoles: supplierRoles,
        requiredCapabilities: ["procurement.purchasing"],
      },
      {
        label: "Purchase Order",
        path: "/purchase-orders",
        requiredPermissions: ["supplier.manage"],
        fallbackRoles: supplierRoles,
        requiredCapabilities: ["procurement.purchasing"],
      },
      {
        label: "Utang Supplier",
        path: "/supplier-debts",
        requiredPermissions: ["supplier.manage"],
        fallbackRoles: supplierRoles,
        requiredCapabilities: ["procurement.supplier_debt"],
      },
      {
        label: "Supplier Return",
        path: "/supplier-returns",
        requiredPermissions: ["supplier_return.manage"],
        fallbackRoles: supplierReturnRoles,
        requiredCapabilities: ["procurement.supplier_return"],
      },
    ],
  },
  {
    label: "Channel",
    icon: <PlugInIcon />,
    status: "active",
    subItems: [
      {
        label: "Channel Accounts",
        path: "/channel-accounts",
        requiredPermissions: ["channel_settlement.manage"],
        fallbackRoles: channelRoles,
        requiredCapabilities: ["channels.settlement"],
      },
      {
        label: "Channel Settlements",
        path: "/channel-settlements",
        requiredPermissions: ["channel_settlement.manage"],
        fallbackRoles: channelRoles,
        requiredCapabilities: ["channels.settlement"],
      },
      {
        label: "Integrasi GoBiz",
        path: "/gobiz",
        requiredPermissions: ["channel_settlement.manage"],
        fallbackRoles: channelRoles,
        requiredCapabilities: ["channels.gobiz"],
      },
    ],
  },
  {
    label: "Pricing",
    icon: <DocsIcon />,
    status: "active",
    subItems: [
      {
        label: "Tax & Service",
        path: "/pricing/tax-service",
        requiredPermissions: ["pricing.manage"],
        fallbackRoles: pricingRoles,
        requiredCapabilities: ["pricing.tax_service"],
      },
      {
        label: "Promo Campaigns",
        path: "/pricing/promo-campaigns",
        requiredPermissions: ["pricing.manage"],
        fallbackRoles: pricingRoles,
        requiredCapabilities: ["pricing.promotions"],
      },
      {
        label: "Vouchers",
        path: "/pricing/vouchers",
        requiredPermissions: ["pricing.manage"],
        fallbackRoles: pricingRoles,
        requiredCapabilities: ["pricing.vouchers"],
      },
    ],
  },
  {
    label: "Konsinyasi",
    icon: <BoxCubeIcon />,
    status: "active",
    subItems: [
      {
        label: "Daftar Konsinyasi",
        path: "/consignments",
        requiredPermissions: ["consignment.manage"],
        fallbackRoles: consignmentRoles,
        requiredCapabilities: ["consignment"],
      },
    ],
  },
  {
    label: "Keuangan",
    icon: <DollarLineIcon />,
    status: "active",
    subItems: [
      {
        label: "Chart of Accounts",
        path: "/chart-of-accounts",
        requiredPermissions: ["account.manage"],
        fallbackRoles: accountingRoles,
        requiredCapabilities: ["accounting.core"],
      },
      {
        label: "Integrasi Akuntansi",
        path: "/accounting-integrations",
        requiredPermissions: ["account.manage"],
        fallbackRoles: accountingRoles,
        requiredCapabilities: ["accounting.integration"],
      },
      {
        label: "Pendapatan Toko",
        path: "/income-businesses",
        requiredPermissions: ["cashflow.view"],
        fallbackRoles: cashFlowRoles,
        requiredCapabilities: ["accounting.cashflow"],
      },
      {
        label: "Pengeluaran Toko",
        path: "/outcome-businesses",
        requiredPermissions: ["cashflow.view"],
        fallbackRoles: cashFlowRoles,
        requiredCapabilities: ["accounting.cashflow"],
      },
    ],
  },
  {
    label: "Laporan",
    icon: <DocsIcon />,
    status: "active",
    subItems: [
      {
        label: "Arus Kas",
        path: "/reports/cash-flow",
        requiredPermissions: ["report.cashflow.view"],
        requiredCapabilities: ["reports.accounting"],
      },
      {
        label: "Laba Rugi",
        path: "/reports/profit-loss",
        requiredPermissions: ["report.profitloss_accounting.view"],
        fallbackRoles: accountingRoles,
        requiredCapabilities: ["reports.accounting"],
      },
      {
        label: "Buku Besar",
        path: "/reports/general-ledger",
        requiredPermissions: ["report.profitloss_accounting.view"],
        fallbackRoles: accountingRoles,
        requiredCapabilities: ["reports.accounting"],
      },
      {
        label: "Rekap Pembelian",
        path: "/reports/purchases",
        fallbackRoles: reportRoles,
        requiredCapabilities: ["reports.operational"],
      },
      {
        label: "Rekap Penjualan",
        path: "/reports/sales",
        fallbackRoles: reportRoles,
        requiredCapabilities: ["reports.operational"],
      },
      {
        label: "Supplier 360",
        path: "/reports/suppliers",
        requiredPermissions: ["supplier.manage"],
        fallbackRoles: supplierRoles,
        requiredCapabilities: ["reports.operational"],
      },
      {
        label: "Kartu Stok",
        path: "/reports/stock-card",
        requiredPermissions: ["stock.manage"],
        fallbackRoles: stockRoles,
        requiredCapabilities: ["reports.operational"],
      },
    ],
  },
  {
    label: "Pengaturan",
    icon: <GroupIcon />,
    status: "active",
    subItems: [
      {
        label: "Kelola Pengguna",
        path: "/users",
        fallbackRoles: ownerAdminRoles,
      },
      {
        label: "Kelola Cabang",
        path: "/outlets",
        fallbackRoles: ownerAdminRoles,
      },
      {
        label: "Lokasi & Register",
        path: "/settings/locations-registers",
        fallbackRoles: ownerAdminRoles,
      },
      {
        label: "Profil Industri & Fitur",
        path: "/settings/capabilities",
        requiredPermissions: ["capability.view"],
        fallbackRoles: ownerAdminRoles,
      },
    ],
  },
];

export function getVisibleNavigation(
  session: Pick<AuthSession, "role" | "permissions"> | null,
  hasCapability: (code: string) => boolean = () => true,
): NavItem[] {
  if (!session?.role) {
    return [];
  }

  return appNavigation
    .map((item) => {
      if (item.subItems) {
        const visibleSubItems = item.subItems.filter((sub) =>
          canAccessByPolicy(session, {
            requiredPermissions: sub.requiredPermissions,
            fallbackRoles: sub.fallbackRoles,
          }) && (sub.requiredCapabilities?.every(hasCapability) ?? true)
        );
        return { ...item, subItems: visibleSubItems };
      }
      return item;
    })
    .filter((item) => {
      if (item.subItems) {
        return item.subItems.length > 0;
      }
      return canAccessByPolicy(session, {
        requiredPermissions: item.requiredPermissions,
        fallbackRoles: item.fallbackRoles,
      }) && (item.requiredCapabilities?.every(hasCapability) ?? true);
    });
}

export function getNavigationItem(path: string) {
  for (const item of appNavigation) {
    if (item.path === path) {
      return item;
    }
    if (item.subItems) {
      const foundSub = item.subItems.find((sub) => sub.path === path || path.startsWith(`${sub.path}/`));
      if (foundSub) {
        return {
          label: foundSub.label,
          path: foundSub.path,
          icon: item.icon,
          status: "active" as MenuStatus,
          requiredPermissions: foundSub.requiredPermissions,
            fallbackRoles: foundSub.fallbackRoles,
            requiredCapabilities: foundSub.requiredCapabilities,
        };
      }
    }
  }
  return null;
}
