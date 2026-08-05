import type { ReactNode } from "react";
import {
  BoxCubeIcon,
  DocsIcon,
  GridIcon,
  GroupIcon,
  ListIcon,
  PlugInIcon,
  TableIcon,
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

export type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
  requiredPermissions?: PermissionCode[];
  fallbackRoles?: AppRole[];
  status: MenuStatus;
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
    label: "Sesi Kasir",
    path: "/cashier/session",
    icon: <TaskIcon />,
    requiredPermissions: ["transaction.create"],
    fallbackRoles: transactionCreateRoles,
    status: "active",
  },
  {
    label: "POS Kasir",
    path: "/pos",
    icon: <PlugInIcon />,
    requiredPermissions: ["transaction.create"],
    fallbackRoles: transactionCreateRoles,
    status: "active",
  },
  {
    label: "Transaksi",
    path: "/transactions",
    icon: <DocsIcon />,
    fallbackRoles: transactionReadRoles,
    status: "active",
  },
  {
    label: "Produk",
    path: "/products",
    icon: <BoxCubeIcon />,
    requiredPermissions: ["product.manage"],
    fallbackRoles: productRoles,
    status: "active",
  },
  {
    label: "Kategori",
    path: "/categories",
    icon: <ListIcon />,
    requiredPermissions: ["product.manage"],
    fallbackRoles: productRoles,
    status: "active",
  },
  {
    label: "Stok",
    path: "/inventory",
    icon: <TableIcon />,
    requiredPermissions: ["stock.manage"],
    fallbackRoles: stockRoles,
    status: "active",
  },
  {
    label: "Transfer Stok",
    path: "/stock-transfers/outgoing",
    icon: <DocsIcon />,
    requiredPermissions: ["stock.manage"],
    fallbackRoles: stockRoles,
    status: "active",
  },
  {
    label: "Supplier",
    path: "/suppliers",
    icon: <GroupIcon />,
    requiredPermissions: ["supplier.manage"],
    fallbackRoles: supplierRoles,
    status: "active",
  },
  {
    label: "Purchase Order",
    path: "/purchase-orders",
    icon: <TaskIcon />,
    requiredPermissions: ["supplier.manage"],
    fallbackRoles: supplierRoles,
    status: "active",
  },
  {
    label: "Utang Supplier",
    path: "/supplier-debts",
    icon: <DocsIcon />,
    requiredPermissions: ["supplier.manage"],
    fallbackRoles: supplierRoles,
    status: "active",
  },
  {
    label: "Konsinyasi",
    path: "/consignments",
    icon: <BoxCubeIcon />,
    requiredPermissions: ["consignment.manage"],
    fallbackRoles: consignmentRoles,
    status: "active",
  },
  {
    label: "Pengguna",
    path: "/users",
    icon: <GroupIcon />,
    fallbackRoles: ownerAdminRoles,
    status: "active",
  },
  {
    label: "Cabang",
    path: "/outlets",
    icon: <DocsIcon />,
    fallbackRoles: ownerAdminRoles,
    status: "active",
  },
  {
    label: "Laba Rugi",
    path: "/reports/profit-loss",
    icon: <DocsIcon />,
    fallbackRoles: reportRoles,
    status: "active",
  },
  {
    label: "Rekap Pembelian",
    path: "/reports/purchases",
    icon: <DocsIcon />,
    fallbackRoles: reportRoles,
    status: "active",
  },
  {
    label: "Rekap Penjualan",
    path: "/reports/sales",
    icon: <DocsIcon />,
    fallbackRoles: reportRoles,
    status: "active",
  },
];

export function getVisibleNavigation(
  session: Pick<AuthSession, "role" | "permissions"> | null,
): NavItem[] {
  if (!session?.role) {
    return [];
  }

  return appNavigation.filter((item) => {
    return canAccessByPolicy(session, {
      requiredPermissions: item.requiredPermissions,
      fallbackRoles: item.fallbackRoles,
    });
  });
}

export function getNavigationItem(path: string) {
  return appNavigation.find((item) => item.path === path) ?? null;
}
