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
import SubscriptionGuard from "../guards/SubscriptionGuard";
import SubscriptionExpiredPage from "../../features/dashboard/pages/SubscriptionExpiredPage";
import SaaSLandingPage from "../../pages/LandingPage";
import OnboardingWizardPage from "../../pages/OnboardingWizardPage";
import { useAuth } from "../../features/auth/hooks/useAuth";

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <SaaSLandingPage />;
}
import AuthLayout from "../../components/layout/AuthLayout";
import DashboardLayout from "../../components/layout/DashboardLayout";
import SignInPage from "../../features/auth/pages/SignInPage";
import CategoriesPage from "../../features/categories/pages/CategoriesPage";
import ProductMastersPage from "../../features/products/pages/ProductMastersPage";
import ConsignmentsPage from "../../features/consignments/pages/ConsignmentsPage";
import ConsignmentCreatePage from "../../features/consignments/pages/ConsignmentCreatePage";
import ConsignmentDetailPage from "../../features/consignments/pages/ConsignmentDetailPage";
import ConsignmentSettlementsPage from "../../features/consignments/pages/ConsignmentSettlementsPage";
import ConsignmentSettlementDetailPage from "../../features/consignments/pages/ConsignmentSettlementDetailPage";
import ConsignmentReturnCreatePage from "../../features/consignments/pages/ConsignmentReturnCreatePage";
import ConsignmentReturnDetailPage from "../../features/consignments/pages/ConsignmentReturnDetailPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import ChartOfAccountsPage from "../../features/accounting/pages/ChartOfAccountsPage";
import AccountingIntegrationsPage from "../../features/accounting-integrations/pages/AccountingIntegrationsPage";
import GoBizIntegrationPage from "../../features/gobiz/pages/GoBizIntegrationPage";
import CashFlowDetailPage from "../../features/cash-flows/pages/CashFlowDetailPage";
import IncomeBusinessesPage from "../../features/cash-flows/pages/IncomeBusinessesPage";
import OutcomeBusinessesPage from "../../features/cash-flows/pages/OutcomeBusinessesPage";
import CashFlowFormPage from "../../features/cash-flows/components/CashFlowFormPage";
import CashFlowReportPage from "../../features/reports/pages/CashFlowReportPage";
import ProfitLossReportPage from "../../features/reports/pages/ProfitLossReportPage";
import GeneralLedgerReportPage from "../../features/reports/pages/GeneralLedgerReportPage";
import PurchaseRecapReportPage from "../../features/reports/pages/PurchaseRecapReportPage";
import SalesRecapReportPage from "../../features/reports/pages/SalesRecapReportPage";
import SupplierReportPage from "../../features/reports/pages/SupplierReportPage";
import StockCardReportPage from "../../features/reports/pages/StockCardReportPage";
import SupplierDebtsPage from "../../features/debts/pages/SupplierDebtsPage";
import SupplierDebtPaymentsPage from "../../features/debts/pages/SupplierDebtPaymentsPage";
import ChannelAccountsPage from "../../features/channels/pages/ChannelAccountsPage";
import ChannelSettlementsPage from "../../features/channels/pages/ChannelSettlementsPage";
import ChannelSettlementDetailPage from "../../features/channels/pages/ChannelSettlementDetailPage";
import ChannelSettlementFormPage from "../../features/channels/pages/ChannelSettlementFormPage";
import InventoryPage from "../../features/inventory/pages/InventoryPage";
import BufferStockPage from "../../features/inventory/pages/BufferStockPage";
import StockOpnameCreatePage from "../../features/inventory/pages/StockOpnameCreatePage";
import StockOpnameDetailPage from "../../features/inventory/pages/StockOpnameDetailPage";
import StockOpnamesPage from "../../features/inventory/pages/StockOpnamesPage";
import StockTransferDetailPage from "../../features/inventory/pages/StockTransferDetailPage";
import StockTransfersIncomingPage from "../../features/inventory/pages/StockTransfersIncomingPage";
import StockTransfersOutgoingPage from "../../features/inventory/pages/StockTransfersOutgoingPage";
import OutletsPage from "../../features/outlets/pages/OutletsPage";
import PosPage from "../../features/pos/pages/PosPage";
import PricingRulesPage from "../../features/pricing/pages/PricingRulesPage";
import PromoCampaignsPage from "../../features/pricing/pages/PromoCampaignsPage";
import VouchersPage from "../../features/pricing/pages/VouchersPage";
import ProductCreatePage from "../../features/products/pages/ProductCreatePage";
import ProductEditPage from "../../features/products/pages/ProductEditPage";
import ProductsPage from "../../features/products/pages/ProductsPage";
import PurchaseOrdersPage from "../../features/purchase-orders/pages/PurchaseOrdersPage";
import PurchaseOrderCreatePage from "../../features/purchase-orders/pages/PurchaseOrderCreatePage";
import PurchaseOrderDetailPage from "../../features/purchase-orders/pages/PurchaseOrderDetailPage";
import PurchaseOrderReceivePage from "../../features/purchase-orders/pages/PurchaseOrderReceivePage";
import SuppliersPage from "../../features/suppliers/pages/SuppliersPage";
import SupplierReturnsPage from "../../features/supplier-returns/pages/SupplierReturnsPage";
import SupplierReturnDetailPage from "../../features/supplier-returns/pages/SupplierReturnDetailPage";
import SupplierReturnFormPage from "../../features/supplier-returns/pages/SupplierReturnFormPage";
import ChangePasswordPage from "../../features/users/pages/ChangePasswordPage";
import UserCreatePage from "../../features/users/pages/UserCreatePage";
import UserEditPage from "../../features/users/pages/UserEditPage";
import UsersPage from "../../features/users/pages/UsersPage";
import CashierSessionPage from "../../features/pos/pages/CashierSessionPage";
import CustomerCreatePage from "../../features/customers/pages/CustomerCreatePage";
import CustomerDetailPage from "../../features/customers/pages/CustomerDetailPage";
import CustomerEditPage from "../../features/customers/pages/CustomerEditPage";
import CustomersPage from "../../features/customers/pages/CustomersPage";
import TransactionDetailPage from "../../features/transactions/pages/TransactionDetailPage";
import TransactionsPage from "../../features/transactions/pages/TransactionsPage";
import CapabilitySettingsPage from "../../features/capabilities/pages/CapabilitySettingsPage";
import DeviceActivationPage from "../../features/stock-locations/DeviceActivationPage";
import LocationsRegistersPage from "../../features/stock-locations/LocationsRegistersPage";
import { getNavigationItem } from "./navigation";

const cashierSessionPolicy = getNavigationItem("/cashier/session");
const posPolicy = getNavigationItem("/pos");
const transactionsPolicy = getNavigationItem("/transactions");
const customersPolicy = getNavigationItem("/customers");
const productsPolicy = getNavigationItem("/products");
const categoriesPolicy = getNavigationItem("/categories");
const inventoryPolicy = getNavigationItem("/inventory");
const bufferStockPolicy = {
  requiredPermissions: inventoryPolicy?.requiredPermissions,
  fallbackRoles: inventoryPolicy?.fallbackRoles,
  requiredCapabilities: ["inventory.buffer_stock"],
};
const stockOpnamesPolicy = {
  requiredPermissions: inventoryPolicy?.requiredPermissions,
  fallbackRoles: inventoryPolicy?.fallbackRoles,
  requiredCapabilities: ["inventory.opname"],
};
const stockTransfersPolicy = {
  requiredPermissions: inventoryPolicy?.requiredPermissions,
  fallbackRoles: inventoryPolicy?.fallbackRoles,
  requiredCapabilities: ["inventory.transfer"],
};
const suppliersPolicy = getNavigationItem("/suppliers");
const purchaseOrdersPolicy = getNavigationItem("/purchase-orders");
const supplierDebtsPolicy = getNavigationItem("/supplier-debts");
const supplierReturnsPolicy = getNavigationItem("/supplier-returns");
const channelAccountsPolicy = getNavigationItem("/channel-accounts");
const channelSettlementsPolicy = getNavigationItem("/channel-settlements");
const pricingRulesPolicy = getNavigationItem("/pricing/tax-service");
const promoCampaignsPolicy = getNavigationItem("/pricing/promo-campaigns");
const vouchersPolicy = getNavigationItem("/pricing/vouchers");
const consignmentsPolicy = getNavigationItem("/consignments");
const usersPolicy = getNavigationItem("/users");
const outletsPolicy = getNavigationItem("/outlets");
const dashboardPolicy = getNavigationItem("/dashboard");
const chartOfAccountsPolicy = getNavigationItem("/chart-of-accounts");
const accountingIntegrationsPolicy = getNavigationItem("/accounting-integrations");
const gobizPolicy = getNavigationItem("/gobiz");
const incomeBusinessesPolicy = getNavigationItem("/income-businesses");
const outcomeBusinessesPolicy = getNavigationItem("/outcome-businesses");
const cashFlowReportPolicy = getNavigationItem("/reports/cash-flow");
const reportPolicy = getNavigationItem("/reports/profit-loss");
const generalLedgerPolicy = getNavigationItem("/reports/general-ledger");
const purchaseRecapPolicy = getNavigationItem("/reports/purchases");
const salesRecapPolicy = getNavigationItem("/reports/sales");
const supplierReportPolicy = getNavigationItem("/reports/suppliers");
const stockCardReportPolicy = getNavigationItem("/reports/stock-card");
const capabilitySettingsPolicy = getNavigationItem("/settings/capabilities");
const deviceActivationPolicy = getNavigationItem("/device-activation");
const locationsRegistersPolicy = getNavigationItem("/settings/locations-registers");

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/signup"
          element={
            <GuestGuard>
              <OnboardingWizardPage />
            </GuestGuard>
          }
        />

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
          path="/subscription-expired"
          element={
            <AuthGuard>
              <SubscriptionExpiredPage />
            </AuthGuard>
          }
        />

        <Route
          element={
            <AuthGuard>
              <SubscriptionGuard>
                <DashboardLayout />
              </SubscriptionGuard>
            </AuthGuard>
          }
        >
          <Route
            path="dashboard"
            element={
              <PermissionGuard
                requiredPermissions={dashboardPolicy?.requiredPermissions}
                fallbackRoles={dashboardPolicy?.fallbackRoles}
                requiredCapabilities={dashboardPolicy?.requiredCapabilities}
              >
                <DashboardPage />
              </PermissionGuard>
            }
          />
          <Route
            path="chart-of-accounts"
            element={
              <PermissionGuard
                requiredPermissions={chartOfAccountsPolicy?.requiredPermissions}
                fallbackRoles={chartOfAccountsPolicy?.fallbackRoles}
                requiredCapabilities={chartOfAccountsPolicy?.requiredCapabilities}
              >
                <ChartOfAccountsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="accounting-integrations"
            element={
              <PermissionGuard
                requiredPermissions={accountingIntegrationsPolicy?.requiredPermissions}
                fallbackRoles={accountingIntegrationsPolicy?.fallbackRoles}
                requiredCapabilities={accountingIntegrationsPolicy?.requiredCapabilities}
              >
                <AccountingIntegrationsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="gobiz"
            element={
              <PermissionGuard
                requiredPermissions={gobizPolicy?.requiredPermissions}
                fallbackRoles={gobizPolicy?.fallbackRoles}
                requiredCapabilities={gobizPolicy?.requiredCapabilities}
              >
                <GoBizIntegrationPage />
              </PermissionGuard>
            }
          />
          <Route
            path="income-businesses"
            element={
              <PermissionGuard
                requiredPermissions={incomeBusinessesPolicy?.requiredPermissions}
                fallbackRoles={incomeBusinessesPolicy?.fallbackRoles}
                requiredCapabilities={incomeBusinessesPolicy?.requiredCapabilities}
              >
                <IncomeBusinessesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="income-businesses/create"
            element={
              <PermissionGuard
                requiredPermissions={["cashflow.create"]}
                fallbackRoles={incomeBusinessesPolicy?.fallbackRoles}
                requiredCapabilities={incomeBusinessesPolicy?.requiredCapabilities}
              >
                <CashFlowFormPage trxType="in" />
              </PermissionGuard>
            }
          />
          <Route
            path="income-businesses/:id"
            element={
              <PermissionGuard
                requiredPermissions={incomeBusinessesPolicy?.requiredPermissions}
                fallbackRoles={incomeBusinessesPolicy?.fallbackRoles}
                requiredCapabilities={incomeBusinessesPolicy?.requiredCapabilities}
              >
                <CashFlowDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="outcome-businesses"
            element={
              <PermissionGuard
                requiredPermissions={outcomeBusinessesPolicy?.requiredPermissions}
                fallbackRoles={outcomeBusinessesPolicy?.fallbackRoles}
                requiredCapabilities={outcomeBusinessesPolicy?.requiredCapabilities}
              >
                <OutcomeBusinessesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="outcome-businesses/create"
            element={
              <PermissionGuard
                requiredPermissions={["cashflow.create"]}
                fallbackRoles={outcomeBusinessesPolicy?.fallbackRoles}
                requiredCapabilities={outcomeBusinessesPolicy?.requiredCapabilities}
              >
                <CashFlowFormPage trxType="out" />
              </PermissionGuard>
            }
          />
          <Route
            path="outcome-businesses/:id"
            element={
              <PermissionGuard
                requiredPermissions={outcomeBusinessesPolicy?.requiredPermissions}
                fallbackRoles={outcomeBusinessesPolicy?.fallbackRoles}
                requiredCapabilities={outcomeBusinessesPolicy?.requiredCapabilities}
              >
                <CashFlowDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/cash-flow"
            element={
              <PermissionGuard
                requiredPermissions={cashFlowReportPolicy?.requiredPermissions}
                fallbackRoles={cashFlowReportPolicy?.fallbackRoles}
                requiredCapabilities={cashFlowReportPolicy?.requiredCapabilities}
              >
                <CashFlowReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/profit-loss"
            element={
              <PermissionGuard
                requiredPermissions={reportPolicy?.requiredPermissions}
                fallbackRoles={reportPolicy?.fallbackRoles}
                requiredCapabilities={reportPolicy?.requiredCapabilities}
              >
                <ProfitLossReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/general-ledger"
            element={
              <PermissionGuard
                requiredPermissions={generalLedgerPolicy?.requiredPermissions}
                fallbackRoles={generalLedgerPolicy?.fallbackRoles}
                requiredCapabilities={generalLedgerPolicy?.requiredCapabilities}
              >
                <GeneralLedgerReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchases"
            element={
              <PermissionGuard
                requiredPermissions={purchaseRecapPolicy?.requiredPermissions}
                fallbackRoles={purchaseRecapPolicy?.fallbackRoles}
                requiredCapabilities={purchaseRecapPolicy?.requiredCapabilities}
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
                requiredCapabilities={salesRecapPolicy?.requiredCapabilities}
              >
                <SalesRecapReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/suppliers"
            element={
              <PermissionGuard
                requiredPermissions={supplierReportPolicy?.requiredPermissions}
                fallbackRoles={supplierReportPolicy?.fallbackRoles}
                requiredCapabilities={supplierReportPolicy?.requiredCapabilities}
              >
                <SupplierReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/stock-card"
            element={
              <PermissionGuard
                requiredPermissions={stockCardReportPolicy?.requiredPermissions}
                fallbackRoles={stockCardReportPolicy?.fallbackRoles}
                requiredCapabilities={stockCardReportPolicy?.requiredCapabilities}
              >
                <StockCardReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="cashier/session"
            element={
              <PermissionGuard
                requiredPermissions={cashierSessionPolicy?.requiredPermissions}
                fallbackRoles={cashierSessionPolicy?.fallbackRoles}
                requiredCapabilities={cashierSessionPolicy?.requiredCapabilities}
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
                requiredCapabilities={productsPolicy?.requiredCapabilities}
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
                requiredCapabilities={productsPolicy?.requiredCapabilities}
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
                requiredCapabilities={productsPolicy?.requiredCapabilities}
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
                requiredCapabilities={categoriesPolicy?.requiredCapabilities}
              >
                <CategoriesPage />
              </PermissionGuard>
            }
          />
          <Route path="product-masters" element={<PermissionGuard requiredPermissions={productsPolicy?.requiredPermissions} fallbackRoles={productsPolicy?.fallbackRoles} requiredCapabilities={productsPolicy?.requiredCapabilities}><ProductMastersPage /></PermissionGuard>} />
          <Route
            path="inventory"
            element={
              <PermissionGuard
                requiredPermissions={inventoryPolicy?.requiredPermissions}
                fallbackRoles={inventoryPolicy?.fallbackRoles}
                requiredCapabilities={inventoryPolicy?.requiredCapabilities}
              >
                <InventoryPage />
              </PermissionGuard>
            }
          />
          <Route
            path="buffer-stock"
            element={
              <PermissionGuard
                requiredPermissions={bufferStockPolicy?.requiredPermissions}
                fallbackRoles={bufferStockPolicy?.fallbackRoles}
                requiredCapabilities={bufferStockPolicy?.requiredCapabilities}
              >
                <BufferStockPage />
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
                requiredPermissions={stockOpnamesPolicy?.requiredPermissions}
                fallbackRoles={stockOpnamesPolicy?.fallbackRoles}
                requiredCapabilities={stockOpnamesPolicy?.requiredCapabilities}
              >
                <StockOpnamesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="stock-opnames/create"
            element={
              <PermissionGuard
                requiredPermissions={stockOpnamesPolicy?.requiredPermissions}
                fallbackRoles={stockOpnamesPolicy?.fallbackRoles}
                requiredCapabilities={stockOpnamesPolicy?.requiredCapabilities}
              >
                <StockOpnameCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="stock-opnames/:id"
            element={
              <PermissionGuard
                requiredPermissions={stockOpnamesPolicy?.requiredPermissions}
                fallbackRoles={stockOpnamesPolicy?.fallbackRoles}
                requiredCapabilities={stockOpnamesPolicy?.requiredCapabilities}
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
                requiredCapabilities={stockTransfersPolicy?.requiredCapabilities}
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
                requiredCapabilities={stockTransfersPolicy?.requiredCapabilities}
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
                requiredCapabilities={stockTransfersPolicy?.requiredCapabilities}
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
                requiredCapabilities={suppliersPolicy?.requiredCapabilities}
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
                requiredCapabilities={purchaseOrdersPolicy?.requiredCapabilities}
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
                requiredCapabilities={purchaseOrdersPolicy?.requiredCapabilities}
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
                requiredCapabilities={purchaseOrdersPolicy?.requiredCapabilities}
              >
                <PurchaseOrderDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase-orders/:id/receive"
            element={
              <PermissionGuard
                requiredPermissions={purchaseOrdersPolicy?.requiredPermissions}
                fallbackRoles={purchaseOrdersPolicy?.fallbackRoles}
                requiredCapabilities={purchaseOrdersPolicy?.requiredCapabilities}
              >
                <PurchaseOrderReceivePage />
              </PermissionGuard>
            }
          />
          <Route
            path="supplier-debts"
            element={
              <PermissionGuard
                requiredPermissions={supplierDebtsPolicy?.requiredPermissions}
                fallbackRoles={supplierDebtsPolicy?.fallbackRoles}
                requiredCapabilities={supplierDebtsPolicy?.requiredCapabilities}
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
                requiredCapabilities={supplierDebtsPolicy?.requiredCapabilities}
              >
                <SupplierDebtPaymentsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="supplier-returns"
            element={
              <PermissionGuard
                requiredPermissions={supplierReturnsPolicy?.requiredPermissions}
                fallbackRoles={supplierReturnsPolicy?.fallbackRoles}
                requiredCapabilities={supplierReturnsPolicy?.requiredCapabilities}
              >
                <SupplierReturnsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="supplier-returns/create"
            element={
              <PermissionGuard
                requiredPermissions={supplierReturnsPolicy?.requiredPermissions}
                fallbackRoles={supplierReturnsPolicy?.fallbackRoles}
                requiredCapabilities={supplierReturnsPolicy?.requiredCapabilities}
              >
                <SupplierReturnFormPage />
              </PermissionGuard>
            }
          />
          <Route
            path="supplier-returns/:id/edit"
            element={
              <PermissionGuard
                requiredPermissions={supplierReturnsPolicy?.requiredPermissions}
                fallbackRoles={supplierReturnsPolicy?.fallbackRoles}
                requiredCapabilities={supplierReturnsPolicy?.requiredCapabilities}
              >
                <SupplierReturnFormPage />
              </PermissionGuard>
            }
          />
          <Route
            path="supplier-returns/:id"
            element={
              <PermissionGuard
                requiredPermissions={supplierReturnsPolicy?.requiredPermissions}
                fallbackRoles={supplierReturnsPolicy?.fallbackRoles}
                requiredCapabilities={supplierReturnsPolicy?.requiredCapabilities}
              >
                <SupplierReturnDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="channel-accounts"
            element={
              <PermissionGuard
                requiredPermissions={channelAccountsPolicy?.requiredPermissions}
                fallbackRoles={channelAccountsPolicy?.fallbackRoles}
                requiredCapabilities={channelAccountsPolicy?.requiredCapabilities}
              >
                <ChannelAccountsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="channel-settlements"
            element={
              <PermissionGuard
                requiredPermissions={channelSettlementsPolicy?.requiredPermissions}
                fallbackRoles={channelSettlementsPolicy?.fallbackRoles}
                requiredCapabilities={channelSettlementsPolicy?.requiredCapabilities}
              >
                <ChannelSettlementsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="channel-settlements/create"
            element={
              <PermissionGuard
                requiredPermissions={channelSettlementsPolicy?.requiredPermissions}
                fallbackRoles={channelSettlementsPolicy?.fallbackRoles}
                requiredCapabilities={channelSettlementsPolicy?.requiredCapabilities}
              >
                <ChannelSettlementFormPage />
              </PermissionGuard>
            }
          />
          <Route
            path="channel-settlements/:id/edit"
            element={
              <PermissionGuard
                requiredPermissions={channelSettlementsPolicy?.requiredPermissions}
                fallbackRoles={channelSettlementsPolicy?.fallbackRoles}
                requiredCapabilities={channelSettlementsPolicy?.requiredCapabilities}
              >
                <ChannelSettlementFormPage />
              </PermissionGuard>
            }
          />
          <Route
            path="channel-settlements/:id"
            element={
              <PermissionGuard
                requiredPermissions={channelSettlementsPolicy?.requiredPermissions}
                fallbackRoles={channelSettlementsPolicy?.fallbackRoles}
                requiredCapabilities={channelSettlementsPolicy?.requiredCapabilities}
              >
                <ChannelSettlementDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="pricing/tax-service"
            element={
              <PermissionGuard
                requiredPermissions={pricingRulesPolicy?.requiredPermissions}
                fallbackRoles={pricingRulesPolicy?.fallbackRoles}
                requiredCapabilities={pricingRulesPolicy?.requiredCapabilities}
              >
                <PricingRulesPage />
              </PermissionGuard>
            }
          />
          <Route
            path="pricing/promo-campaigns"
            element={
              <PermissionGuard
                requiredPermissions={promoCampaignsPolicy?.requiredPermissions}
                fallbackRoles={promoCampaignsPolicy?.fallbackRoles}
                requiredCapabilities={promoCampaignsPolicy?.requiredCapabilities}
              >
                <PromoCampaignsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="pricing/vouchers"
            element={
              <PermissionGuard
                requiredPermissions={vouchersPolicy?.requiredPermissions}
                fallbackRoles={vouchersPolicy?.fallbackRoles}
                requiredCapabilities={vouchersPolicy?.requiredCapabilities}
              >
                <VouchersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
                requiredCapabilities={consignmentsPolicy?.requiredCapabilities}
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
                requiredCapabilities={consignmentsPolicy?.requiredCapabilities}
              >
                <ConsignmentCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments/returns"
            element={<Navigate to="/consignments?tab=returns" replace />}
          />
          <Route
            path="consignments/:id"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
                requiredCapabilities={consignmentsPolicy?.requiredCapabilities}
              >
                <ConsignmentDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="consignments/returns/create"
            element={
              <PermissionGuard
                requiredPermissions={consignmentsPolicy?.requiredPermissions}
                fallbackRoles={consignmentsPolicy?.fallbackRoles}
                requiredCapabilities={consignmentsPolicy?.requiredCapabilities}
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
                requiredCapabilities={consignmentsPolicy?.requiredCapabilities}
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
                requiredCapabilities={consignmentsPolicy?.requiredCapabilities}
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
                requiredCapabilities={consignmentsPolicy?.requiredCapabilities}
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
                requiredCapabilities={usersPolicy?.requiredCapabilities}
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
                requiredCapabilities={usersPolicy?.requiredCapabilities}
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
                requiredCapabilities={usersPolicy?.requiredCapabilities}
              >
                <UserEditPage />
              </PermissionGuard>
            }
          />
          <Route path="profile/change-password" element={<ChangePasswordPage />} />
          <Route
            path="device-activation"
            element={
              <PermissionGuard
                requiredPermissions={deviceActivationPolicy?.requiredPermissions}
                fallbackRoles={deviceActivationPolicy?.fallbackRoles}
                requiredCapabilities={deviceActivationPolicy?.requiredCapabilities}
              >
                <DeviceActivationPage />
              </PermissionGuard>
            }
          />
          <Route
            path="outlets"
            element={
              <PermissionGuard
                requiredPermissions={outletsPolicy?.requiredPermissions}
                fallbackRoles={outletsPolicy?.fallbackRoles}
                requiredCapabilities={outletsPolicy?.requiredCapabilities}
              >
                <OutletsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="settings/locations-registers"
            element={
              <PermissionGuard
                requiredPermissions={locationsRegistersPolicy?.requiredPermissions}
                fallbackRoles={locationsRegistersPolicy?.fallbackRoles}
                requiredCapabilities={locationsRegistersPolicy?.requiredCapabilities}
              >
                <LocationsRegistersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="settings/capabilities"
            element={
              <PermissionGuard
                requiredPermissions={capabilitySettingsPolicy?.requiredPermissions}
                fallbackRoles={capabilitySettingsPolicy?.fallbackRoles}
                requiredCapabilities={capabilitySettingsPolicy?.requiredCapabilities}
              >
                <CapabilitySettingsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="transactions"
            element={
              <PermissionGuard
                requiredPermissions={transactionsPolicy?.requiredPermissions}
                fallbackRoles={transactionsPolicy?.fallbackRoles}
                requiredCapabilities={transactionsPolicy?.requiredCapabilities}
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
                requiredCapabilities={transactionsPolicy?.requiredCapabilities}
              >
                <TransactionDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="customers"
            element={
              <PermissionGuard
                requiredPermissions={customersPolicy?.requiredPermissions}
                fallbackRoles={customersPolicy?.fallbackRoles}
                requiredCapabilities={customersPolicy?.requiredCapabilities}
              >
                <CustomersPage />
              </PermissionGuard>
            }
          />
          <Route
            path="customers/create"
            element={
              <PermissionGuard
                requiredPermissions={["customer.manage"]}
                fallbackRoles={["Owner", "Admin", "Keuangan", "KepalaCabang"]}
                requiredCapabilities={customersPolicy?.requiredCapabilities}
              >
                <CustomerCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="customers/:id"
            element={
              <PermissionGuard
                requiredPermissions={customersPolicy?.requiredPermissions}
                fallbackRoles={customersPolicy?.fallbackRoles}
                requiredCapabilities={customersPolicy?.requiredCapabilities}
              >
                <CustomerDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="customers/:id/edit"
            element={
              <PermissionGuard
                requiredPermissions={["customer.manage"]}
                fallbackRoles={["Owner", "Admin", "Keuangan", "KepalaCabang"]}
                requiredCapabilities={customersPolicy?.requiredCapabilities}
              >
                <CustomerEditPage />
              </PermissionGuard>
            }
          />
          <Route
            path="pos"
            element={
              <PermissionGuard
                requiredPermissions={posPolicy?.requiredPermissions}
                fallbackRoles={posPolicy?.fallbackRoles}
                requiredCapabilities={posPolicy?.requiredCapabilities}
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
            <Route path=":businessSlug/o/:outletCode/menu" element={<MenuPage />} />
            <Route path=":businessSlug/o/:outletCode/products/:productId" element={<ProductDetailPage />} />
            <Route path=":businessSlug/o/:outletCode/cart" element={<CartPage />} />
          </Route>
          
          <Route path=":businessSlug/o/:outletCode/checkout" element={<CheckoutLayout />}>
            <Route index element={<CheckoutPage />} />
          </Route>

          <Route path=":businessSlug/o/:outletCode/orders/:orderId" element={<OrderStatusLayout />}>
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
