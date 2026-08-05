import type { ReactNode } from "react";
import {
  BoxCubeIcon,
  DocsIcon,
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
  | "consignment.manage"
  | "report.view"
  | string;

export type MenuStatus = "active" | "placeholder";

export type NavSubItem = {
  label: string;
  path: string;
  requiredPermissions?: PermissionCode[];
  fallbackRoles?: AppRole[];
};

export type NavItem = {
  label: string;
  path?: string;
  icon: ReactNode;
  requiredPermissions?: PermissionCode[];
  fallbackRoles?: AppRole[];
  status: MenuStatus;
  subItems?: NavSubItem[];
};

const ownerAdminRoles: AppRole[] = ["Owner", "Admin"];
const transactionCreateRoles: AppRole[] = ["Owner", "Admin", "Kasir", "KepalaCabang"];
const transactionReadRoles: AppRole[] = ["Owner", "Admin", "Kasir", "Keuangan", "KepalaCabang"];
const productRoles: AppRole[] = ["Owner", "Admin", "Gudang", "KepalaCabang"];
const stockRoles: AppRole[] = ["Owner", "Admin", "Gudang", "KepalaCabang"];
const supplierRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const consignmentRoles: AppRole[] = ["Owner", "Admin", "Keuangan"];
const dashboardRoles: AppRole[] = ["Owner", "Admin", "Keuangan", "KepalaCabang"];
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
      },
      {
        label: "POS Kasir",
        path: "/pos",
        requiredPermissions: ["transaction.create"],
        fallbackRoles: transactionCreateRoles,
      },
      {
        label: "Transaksi",
        path: "/transactions",
        fallbackRoles: transactionReadRoles,
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
      },
      {
        label: "Kategori",
        path: "/categories",
        requiredPermissions: ["product.manage"],
        fallbackRoles: productRoles,
      },
      {
        label: "Stok",
        path: "/inventory",
        requiredPermissions: ["stock.manage"],
        fallbackRoles: stockRoles,
      },
      {
        label: "Transfer Stok",
        path: "/stock-transfers/outgoing",
        requiredPermissions: ["stock.manage"],
        fallbackRoles: stockRoles,
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
      },
      {
        label: "Purchase Order",
        path: "/purchase-orders",
        requiredPermissions: ["supplier.manage"],
        fallbackRoles: supplierRoles,
      },
      {
        label: "Utang Supplier",
        path: "/supplier-debts",
        requiredPermissions: ["supplier.manage"],
        fallbackRoles: supplierRoles,
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
      },
    ],
  },
  {
    label: "Laporan",
    icon: <DocsIcon />,
    status: "active",
    subItems: [
      {
        label: "Laba Rugi",
        path: "/reports/profit-loss",
        fallbackRoles: reportRoles,
      },
      {
        label: "Rekap Pembelian",
        path: "/reports/purchases",
        fallbackRoles: reportRoles,
      },
      {
        label: "Rekap Penjualan",
        path: "/reports/sales",
        fallbackRoles: reportRoles,
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
    ],
  },
];

export function getVisibleNavigation(
  session: Pick<AuthSession, "role" | "permissions"> | null,
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
          })
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
      });
    });
}

export function getNavigationItem(path: string) {
  for (const item of appNavigation) {
    if (item.path === path) {
      return item;
    }
    if (item.subItems) {
      const foundSub = item.subItems.find((sub) => sub.path === path);
      if (foundSub) {
        return {
          label: foundSub.label,
          path: foundSub.path,
          icon: item.icon,
          status: "active" as MenuStatus,
        };
      }
    }
  }
  return null;
}
