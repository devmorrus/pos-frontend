import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router";
import { ScrollToTop } from "../../components/common/ScrollToTop";

// Storefront Imports
import { StorefrontProvider } from "../../storefront/context/StorefrontContext";
import StorefrontLayout from "../../storefront/layouts/StorefrontLayout";
import CheckoutLayout from "../../storefront/layouts/CheckoutLayout";
import OrderStatusLayout from "../../storefront/layouts/OrderStatusLayout";
import LandingPage from "../../storefront/features/landing/pages/LandingPage";
import StorefrontOutletsPage from "../../storefront/features/outlets/pages/OutletsPage";
import MenuPage from "../../storefront/features/catalog/pages/MenuPage";
import ProductDetailPage from "../../storefront/features/catalog/pages/ProductDetailPage";
import CartPage from "../../storefront/features/cart/pages/CartPage";
import CheckoutPage from "../../storefront/features/checkout/pages/CheckoutPage";
import OrderStatusPage from "../../storefront/features/orders/pages/OrderStatusPage";
import AppErrorState from "../../components/ui/AppErrorState";
import AuthGuard from "../guards/AuthGuard";
import GuestGuard from "../guards/GuestGuard";
import PermissionGuard from "../guards/PermissionGuard";
import AuthLayout from "../../components/layout/AuthLayout";
import DashboardLayout from "../../components/layout/DashboardLayout";
import SignInPage from "../../features/auth/pages/SignInPage";
import CategoriesPage from "../../features/categories/pages/CategoriesPage";
import ConsignmentsPage from "../../features/consignments/pages/ConsignmentsPage";
import ConsignmentCreatePage from "../../features/consignments/pages/ConsignmentCreatePage";
import ConsignmentDetailPage from "../../features/consignments/pages/ConsignmentDetailPage";
import ConsignmentSettlementsPage from "../../features/consignments/pages/ConsignmentSettlementsPage";
import ConsignmentSettlementDetailPage from "../../features/consignments/pages/ConsignmentSettlementDetailPage";
import ConsignmentReturnsPage from "../../features/consignments/pages/ConsignmentReturnsPage";
import ConsignmentReturnCreatePage from "../../features/consignments/pages/ConsignmentReturnCreatePage";
import ConsignmentReturnDetailPage from "../../features/consignments/pages/ConsignmentReturnDetailPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import ProfitLossReportPage from "../../features/reports/pages/ProfitLossReportPage";
import PurchaseRecapReportPage from "../../features/reports/pages/PurchaseRecapReportPage";
import SalesRecapReportPage from "../../features/reports/pages/SalesRecapReportPage";
import SupplierDebtsPage from "../../features/debts/pages/SupplierDebtsPage";
import SupplierDebtPaymentsPage from "../../features/debts/pages/SupplierDebtPaymentsPage";
import InventoryPage from "../../features/inventory/pages/InventoryPage";
import StockOpnameCreatePage from "../../features/inventory/pages/StockOpnameCreatePage";
import StockOpnameDetailPage from "../../features/inventory/pages/StockOpnameDetailPage";
import StockOpnamesPage from "../../features/inventory/pages/StockOpnamesPage";
import StockTransferDetailPage from "../../features/inventory/pages/StockTransferDetailPage";
import StockTransfersIncomingPage from "../../features/inventory/pages/StockTransfersIncomingPage";
import StockTransfersOutgoingPage from "../../features/inventory/pages/StockTransfersOutgoingPage";
import OutletsPage from "../../features/outlets/pages/OutletsPage";
import PosPage from "../../features/pos/pages/PosPage";
import ProductCreatePage from "../../features/products/pages/ProductCreatePage";
import ProductEditPage from "../../features/products/pages/ProductEditPage";
import ProductsPage from "../../features/products/pages/ProductsPage";
import PurchaseOrdersPage from "../../features/purchase-orders/pages/PurchaseOrdersPage";
import PurchaseOrderCreatePage from "../../features/purchase-orders/pages/PurchaseOrderCreatePage";
import PurchaseOrderDetailPage from "../../features/purchase-orders/pages/PurchaseOrderDetailPage";
import SuppliersPage from "../../features/suppliers/pages/SuppliersPage";
import ChangePasswordPage from "../../features/users/pages/ChangePasswordPage";
import UserCreatePage from "../../features/users/pages/UserCreatePage";
import UserEditPage from "../../features/users/pages/UserEditPage";
import UsersPage from "../../features/users/pages/UsersPage";
import CashierSessionPage from "../../features/pos/pages/CashierSessionPage";
import TransactionDetailPage from "../../features/transactions/pages/TransactionDetailPage";
import TransactionsPage from "../../features/transactions/pages/TransactionsPage";
import { getNavigationItem } from "./navigation";

const cashierSessionPolicy = getNavigationItem("/cashier/session");
const posPolicy = getNavigationItem("/pos");
const transactionsPolicy = getNavigationItem("/transactions");
const productsPolicy = getNavigationItem("/products");
const categoriesPolicy = getNavigationItem("/categories");
const inventoryPolicy = getNavigationItem("/inventory");
const stockTransfersPolicy = getNavigationItem("/stock-transfers/outgoing");
const suppliersPolicy = getNavigationItem("/suppliers");
const purchaseOrdersPolicy = getNavigationItem("/purchase-orders");
const supplierDebtsPolicy = getNavigationItem("/supplier-debts");
const consignmentsPolicy = getNavigationItem("/consignments");
const usersPolicy = getNavigationItem("/users");
const outletsPolicy = getNavigationItem("/outlets");
const dashboardPolicy = getNavigationItem("/dashboard");
const reportPolicy = getNavigationItem("/reports/profit-loss");
const purchaseRecapPolicy = getNavigationItem("/reports/purchases");
const salesRecapPolicy = getNavigationItem("/reports/sales");

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/signin"
          element={
            <GuestGuard>
              <AuthLayout />
            </GuestGuard>
          }
        >
          <Route index element={<SignInPage />} />
        </Route>

        <Route
          path="/"
          element={
            <AuthGuard>
              <DashboardLayout />
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <PermissionGuard
                requiredPermissions={dashboardPolicy?.requiredPermissions}
                fallbackRoles={dashboardPolicy?.fallbackRoles}
              >
                <DashboardPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/profit-loss"
            element={
              <PermissionGuard
                requiredPermissions={reportPolicy?.requiredPermissions}
                fallbackRoles={reportPolicy?.fallbackRoles}
              >
                <ProfitLossReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchases"
            element={
              <PermissionGuard
                requiredPermissions={purchaseRecapPolicy?.requiredPermissions}
                fallbackRoles={purchaseRecapPolicy?.fallbackRoles}
              >
                <PurchaseRecapReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/sales"
            element={
              <PermissionGuard
                requiredPermissions={salesRecapPolicy?.requiredPermissions}
                fallbackRoles={salesRecapPolicy?.fallbackRoles}
              >
                <SalesRecapReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="cashier/session"
            element={
              <PermissionGuard
                requiredPermissions={cashierSessionPolicy?.requiredPermissions}
                fallbackRoles={cashierSessionPolicy?.fallbackRoles}
              >
                <CashierSessionPage />
              </PermissionGuard>
            }
          />
          <Route
            path="products"
            element={
              <PermissionGuard
                requiredPermissions={productsPolicy?.requiredPermissions}
                fallbackRoles={productsPolicy?.fallbackRoles}
              >
                <ProductsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="products/create"
            element={
              <PermissionGuard
                requiredPermissions={productsPolicy?.requiredPermissions}
                fallbackRoles={productsPolicy?.fallbackRoles}
              >
                <ProductCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <PermissionGuard
                requiredPermissions={productsPolicy?.requiredPermissions}
                fallbackRoles={productsPolicy?.fallbackRoles}
              >
                <ProductEditPage />
              </PermissionGuard>
            }
          />
          <Route
            path="categories"
            element={
              <PermissionGuard
                requiredPermissions={categoriesPolicy?.requiredPermissions}
                fallbackRoles={categoriesPolicy?.fallbackRoles}
              >
                <CategoriesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="inventory"
            element={
              <PermissionGuard
                requiredPermissions={inventoryPolicy?.requiredPermissions}
                fallbackRoles={inventoryPolicy?.fallbackRoles}
              >
                <InventoryPage />
              </PermissionGuard>
            }
          />
          <Route
            path="stock-transfers"
            element={
              <Navigate to="/stock-transfers/outgoing" replace />
            }
          />
          <Route
            path="stock-opnames"
            element={
              <PermissionGuard
                requiredPermissions={inventoryPolicy?.requiredPermissions}
                fallbackRoles={inventoryPolicy?.fallbackRoles}
              >
                <StockOpnamesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="stock-opnames/create"
            element={
              <PermissionGuard
                requiredPermissions={inventoryPolicy?.requiredPermissions}
                fallbackRoles={inventoryPolicy?.fallbackRoles}
              >
                <StockOpnameCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="stock-opnames/:id"
            element={
              <PermissionGuard
                requiredPermissions={inventoryPolicy?.requiredPermissions}
                fallbackRoles={inventoryPolicy?.fallbackRoles}
              >
                <StockOpnameDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="stock-transfers/outgoing"
            element={
              <PermissionGuard
                requiredPermissions={stockTransfersPolicy?.requiredPermissions}
                fallbackRoles={stockTransfersPolicy?.fallbackRoles}
              >
                <StockTransfersOutgoingPage />
              </PermissionGuard>
            }
          />
          <Route
            path="stock-transfers/incoming"
            element={
              <PermissionGuard
                requiredPermissions={stockTransfersPolicy?.requiredPermissions}
                fallbackRoles={stockTransfersPolicy?.fallbackRoles}
              >
                <StockTransfersIncomingPage />
              </PermissionGuard>
            }
          />
          <Route
            path="stock-transfers/:id"
            element={
              <PermissionGuard
                requiredPermissions={stockTransfersPolicy?.requiredPermissions}
                fallbackRoles={stockTransfersPolicy?.fallbackRoles}
              >
                <StockTransferDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="suppliers"
            element={
              <PermissionGuard
                requiredPermissions={suppliersPolicy?.requiredPermissions}
                fallbackRoles={suppliersPolicy?.fallbackRoles}
              >
                <SuppliersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase-orders"
            element={
              <PermissionGuard
                requiredPermissions={purchaseOrdersPolicy?.requiredPermissions}
                fallbackRoles={purchaseOrdersPolicy?.fallbackRoles}
              >
                <PurchaseOrdersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase-orders/create"
            element={
              <PermissionGuard
                requiredPermissions={purchaseOrdersPolicy?.requiredPermissions}
                fallbackRoles={purchaseOrdersPolicy?.fallbackRoles}
              >
                <PurchaseOrderCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase-orders/:id"
            element={
              <PermissionGuard
                requiredPermissions={purchaseOrdersPolicy?.requiredPermissions}
                fallbackRoles={purchaseOrdersPolicy?.fallbackRoles}
              >
                <PurchaseOrderDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="supplier-debts"
            element={
              <PermissionGuard
                requiredPermissions={supplierDebtsPolicy?.requiredPermissions}
                fallbackRoles={supplierDebtsPolicy?.fallbackRoles}
              >
                <SupplierDebtsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="supplier-debts/payments"
            element={
              <PermissionGuard
                requiredPermissions={supplierDebtsPolicy?.requiredPermissions}
                fallbackRoles={supplierDebtsPolicy?.fallbackRoles}
              >
                <SupplierDebtPaymentsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
              >
                <ConsignmentsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments/create"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
              >
                <ConsignmentCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments/:id"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
              >
                <ConsignmentDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments/returns"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
              >
                <ConsignmentReturnsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments/returns/create"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
              >
                <ConsignmentReturnCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments/returns/:id"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
              >
                <ConsignmentReturnDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignment-settlements"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
              >
                <ConsignmentSettlementsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignment-settlements/:id"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
              >
                <ConsignmentSettlementDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="users"
            element={
              <PermissionGuard
                requiredPermissions={usersPolicy?.requiredPermissions}
                fallbackRoles={usersPolicy?.fallbackRoles}
              >
                <UsersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="users/create"
            element={
              <PermissionGuard
                requiredPermissions={usersPolicy?.requiredPermissions}
                fallbackRoles={usersPolicy?.fallbackRoles}
              >
                <UserCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="users/:id/edit"
            element={
              <PermissionGuard
                requiredPermissions={usersPolicy?.requiredPermissions}
                fallbackRoles={usersPolicy?.fallbackRoles}
              >
                <UserEditPage />
              </PermissionGuard>
            }
          />
          <Route path="profile/change-password" element={<ChangePasswordPage />} />
          <Route
            path="outlets"
            element={
              <PermissionGuard
                requiredPermissions={outletsPolicy?.requiredPermissions}
                fallbackRoles={outletsPolicy?.fallbackRoles}
              >
                <OutletsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="transactions"
            element={
              <PermissionGuard
                requiredPermissions={transactionsPolicy?.requiredPermissions}
                fallbackRoles={transactionsPolicy?.fallbackRoles}
              >
                <TransactionsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="transactions/:id"
            element={
              <PermissionGuard
                requiredPermissions={transactionsPolicy?.requiredPermissions}
                fallbackRoles={transactionsPolicy?.fallbackRoles}
              >
                <TransactionDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="pos"
            element={
              <PermissionGuard
                requiredPermissions={posPolicy?.requiredPermissions}
                fallbackRoles={posPolicy?.fallbackRoles}
              >
                <PosPage />
              </PermissionGuard>
            }
          />
        </Route>

        {/* PUBLIC STOREFRONT SHELL */}
        <Route
          path="/shop"
          element={
            <StorefrontProvider>
              <Outlet />
            </StorefrontProvider>
          }
        >
          <Route element={<StorefrontLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="outlets" element={<StorefrontOutletsPage />} />
            <Route path="o/:outletCode/menu" element={<MenuPage />} />
            <Route path="o/:outletCode/products/:productId" element={<ProductDetailPage />} />
            <Route path="o/:outletCode/cart" element={<CartPage />} />
          </Route>
          
          <Route path="o/:outletCode/checkout" element={<CheckoutLayout />}>
            <Route index element={<CheckoutPage />} />
          </Route>

          <Route path="o/:outletCode/orders/:orderId" element={<OrderStatusLayout />}>
            <Route index element={<OrderStatusPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <AppErrorState
              title="Halaman tidak ditemukan"
              description="Rute yang Anda buka belum tersedia di shell MorrusPOS."
              actionLabel="Kembali ke dashboard"
              actionHref="/dashboard"
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
