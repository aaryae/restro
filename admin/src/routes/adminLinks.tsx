import { lazy, type ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ModuleGuard } from "@/components/ModuleGuard";

function LegacyProductToItemRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/admin/item/${id}` : "/admin/item/"} replace />;
}

function ListFormRedirect({ listPath }: { listPath: string }) {
  const { id } = useParams();
  return (
    <Navigate
      to={id ? `${listPath}?edit=${id}` : `${listPath}?add=1`}
      replace
    />
  );
}

const UserProfile = lazy(() => import("@/pages/UserProfile"));
const Access = lazy(() => import("@/pages/Access"));
const EditAccess = lazy(() => import("@/pages/Access/EditAccess"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Media = lazy(() => import("@/pages/Media"));
const MediaImages = lazy(() => import("@/pages/Media/mediaImages"));
const Roles = lazy(() => import("@/pages/Roles"));
const Users = lazy(() => import("@/pages/Users"));
const ApproveRequest = lazy(() => import("@/pages/ApproveRequest"));
const Settings = lazy(() => import("@/pages/Settings"));
const Ledger = lazy(() => import("@/pages/Ledger"));
const EmailTemplate = lazy(() => import("@/pages/EmailTemplate"));
const AddEditEmailTemplate = lazy(
  () => import("@/pages/EmailTemplate/AddEditEmailTemplate"),
);
const EmailSmtp = lazy(() => import("@/pages/EmailSmtp"));
const ActiveEmailTemplate = lazy(() => import("@/pages/ActiveEmailTemplate"));
const ProductCategory = lazy(() => import("@/pages/ProductCategory"));
const Product = lazy(() => import("@/pages/Product"));
const AddEditProduct = lazy(() => import("@/pages/Product/AddEditProduct"));
const ProductVariant = lazy(() => import("@/pages/ProductVariant"));
const AddEditProductVariant = lazy(
  () => import("@/pages/ProductVariant/AddEditProductVariant"),
);
const Customer = lazy(() => import("@/pages/Customer"));
const Order = lazy(() => import("@/pages/Order"));
const Department = lazy(() => import("@/pages/Department"));
const Floor = lazy(() => import("@/pages/Floor"));
const OrderTable = lazy(() => import("@/pages/Table"));
const AddEditOrder = lazy(() => import("@/pages/Order/components/AddEditOrder"));
const CheckoutPage = lazy(() => import("@/pages/Order/CheckoutPage"));
const AddEditCustomer = lazy(() => import("@/pages/Customer/AddEditCustomer"));
const Supplier = lazy(() => import("@/pages/SuppliersModule"));
const Revenue = lazy(() => import("@/pages/Revenue"));
const Purchase = lazy(() => import("@/pages/Purchase"));
const PurchaseCategory = lazy(() => import("@/pages/PurchaseCategory"));
const AddEditPurchase = lazy(() => import("@/pages/Purchase/AddEditPurchase"));
const Account = lazy(() => import("@/pages/Account"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const AddEditAccount = lazy(() => import("@/pages/Account/AddEditAccount"));
const OpenItem = lazy(() => import("@/pages/OpenItem"));
const ExpenseCategory = lazy(() => import("@/pages/ExpenseCategory"));
const Transaction = lazy(() => import("@/pages/Transaction"));
const Addons = lazy(() => import("@/pages/Addons"));
const AccountPermission = lazy(() => import("@/pages/AccountPermission"));
const Report = lazy(() => import("@/pages/DailyReport"));
const DailySummaryReport = lazy(() =>
  import("@/pages/DailySummaryReport").then((m) => ({
    default: m.DailySummaryReport,
  })),
);
const TableReport = lazy(() => import("@/pages/TableReport"));
const RecentlyDeleted = lazy(() => import("@/pages/RecentlyDeleted"));
const MeasuringUnit = lazy(() => import("@/pages/MeasuringUnit"));
const StockGroup = lazy(() => import("@/pages/StockGroup"));
const StockItem = lazy(() => import("@/pages/StockItem"));
const StockHistory = lazy(() => import("@/pages/StockHistory"));

const rawAdminLinks: { path: string; element: ReactNode; module?: string; action?: string }[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/auth/list",
    element: <Users />,
  },
  {
    path: "/approve-request",
    element: <ApproveRequest />,
  },
  {
    path: "/roles/list",
    element: <Roles />,
  },
  {
    path: "/access",
    element: <Access />,
  },
  {
    path: "/access/:id",
    element: <EditAccess />,
  },
  {
    path: "/media-category/list",
    element: <Media />,
  },
  {
    path: "/media/:id",
    element: <MediaImages />,
  },
  {
    path: "/profile",
    element: <UserProfile />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/settings/list",
    element: <Settings />,
  },
  {
    path: "/ledger/list",
    element: <Ledger />,
  },
  {
    path: "/recently-deleted",
    element: <RecentlyDeleted />,
  },
  {
    path: "/email-template/list",
    element: <EmailTemplate />,
  },
  {
    path: "/email-template/add",
    element: <AddEditEmailTemplate />,
  },
  {
    path: "/email-template/:id",
    element: <AddEditEmailTemplate />,
  },
  {
    path: "/smtp",
    element: <EmailSmtp />,
  },
  {
    path: "/active-email-template",
    element: <ActiveEmailTemplate />,
  },
  {
    path: "/product-category/list",
    element: <ProductCategory />,
  },
  {
    path: "/product-category/",
    element: <ListFormRedirect listPath="/admin/product-category/list" />,
  },
  {
    path: "/product-category/:id",
    element: <ListFormRedirect listPath="/admin/product-category/list" />,
  },
  {
    path: "/item/list",
    element: <Product />,
  },
  {
    path: "/item/",
    element: <AddEditProduct />,
  },
  {
    path: "/item/:id",
    element: <AddEditProduct />,
  },
  // Legacy product URLs → item
  {
    path: "/product/list",
    element: <Navigate to="/admin/item/list" replace />,
  },
  {
    path: "/product/",
    element: <Navigate to="/admin/item/" replace />,
  },
  {
    path: "/product/:id",
    element: <LegacyProductToItemRedirect />,
  },
  {
    path: "/open-item/list",
    element: <OpenItem />,
  },
  {
    path: "/open-item/",
    element: <ListFormRedirect listPath="/admin/open-item/list" />,
  },
  {
    path: "/open-item/:id",
    element: <ListFormRedirect listPath="/admin/open-item/list" />,
  },
  {
    path: "/product-variant/list",
    element: <ProductVariant />,
  },
  {
    path: "/product-variant/",
    element: <AddEditProductVariant />,
  },
  {
    path: "/product-variant/:id",
    element: <AddEditProductVariant />,
  },
  {
    path: "/revenue/list",
    element: <Revenue />,
  },
  {
    path: "/revenue/",
    element: <ListFormRedirect listPath="/admin/revenue/list" />,
  },
  {
    path: "/revenue/:id",
    element: <ListFormRedirect listPath="/admin/revenue/list" />,
  },
  {
    path: "/purchase/list",
    element: <Purchase />,
  },
  {
    path: "/purchase/",
    element: <AddEditPurchase />,
  },
  {
    path: "/purchase/:id",
    element: <AddEditPurchase />,
  },
  {
    path: "/purchase-category/list",
    element: <PurchaseCategory />,
  },
  {
    path: "/purchase-category/",
    element: <ListFormRedirect listPath="/admin/purchase-category/list" />,
  },
  {
    path: "/purchase-category/:id",
    element: <ListFormRedirect listPath="/admin/purchase-category/list" />,
  },
  {
    path: "/expense-category/list",
    element: <ExpenseCategory />,
  },
  {
    path: "/expense-category/",
    element: <ListFormRedirect listPath="/admin/expense-category/list" />,
  },
  {
    path: "/expense-category/:id",
    element: <ListFormRedirect listPath="/admin/expense-category/list" />,
  },
  {
    path: "/customer/list",
    element: <Customer />,
  },
  {
    path: "/customer/:id",
    element: <AddEditCustomer />,
  },
  {
    path: "/customer/",
    element: <AddEditCustomer />,
  },
  {
    path: "/order/list",
    element: <Order />,
  },
  {
    path: "/order/checkout",
    element: <CheckoutPage />,
  },
  {
    path: "/order/",
    element: <AddEditOrder />,
  },
  {
    path: "/order/:tableId/:orderId",
    element: <AddEditOrder />,
  },
  {
    path: "/order/:tableId",
    element: <AddEditOrder />,
  },

  {
    path: "/supplier/list",
    element: <Supplier />,
  },

  {
    path: "/supplier/",
    element: <ListFormRedirect listPath="/admin/supplier/list" />,
  },

  {
    path: "/supplier/:id",
    element: <ListFormRedirect listPath="/admin/supplier/list" />,
  },

  {
    path: "/department/list",
    element: <Department />,
  },
  {
    path: "/department/:id",
    element: <ListFormRedirect listPath="/admin/department/list" />,
  },
  {
    path: "/department/",
    element: <ListFormRedirect listPath="/admin/department/list" />,
  },
  {
    path: "/floor/list",
    element: <Floor />,
  },
  {
    path: "/floor/:id",
    element: <ListFormRedirect listPath="/admin/floor/list" />,
  },
  {
    path: "/floor/",
    element: <ListFormRedirect listPath="/admin/floor/list" />,
  },
  {
    path: "/table/list",
    element: <OrderTable />,
  },
  {
    path: "/table/:id",
    element: <ListFormRedirect listPath="/admin/table/list" />,
  },
  {
    path: "/table/",
    element: <ListFormRedirect listPath="/admin/table/list" />,
  },
  {
    path: "/account/list",
    element: <Account />,
  },
  {
    path: "/account/",
    element: <AddEditAccount />,
  },
  {
    path: "/account/:id",
    element: <AddEditAccount />,
  },
  {
    path: "/expense/list",
    element: <Expenses />,
  },
  {
    path: "/expense/",
    element: <ListFormRedirect listPath="/admin/expense/list" />,
  },
  {
    path: "/expense/:id",
    element: <ListFormRedirect listPath="/admin/expense/list" />,
  },
  {
    path: "/transaction/list",
    element: <Transaction />,
  },
  {
    path: "/account-permission/list",
    element: <AccountPermission />,
  },
  {
    path: "/account-permission/",
    element: <ListFormRedirect listPath="/admin/account-permission/list" />,
  },
  {
    path: "/account-permission/:id",
    element: <ListFormRedirect listPath="/admin/account-permission/list" />,
  },

  {
    path: "/addons/list",
    element: <Addons />,
  },
  {
    path: "/addons/",
    element: <ListFormRedirect listPath="/admin/addons/list" />,
  },
  {
    path: "/addons/:id",
    element: <ListFormRedirect listPath="/admin/addons/list" />,
  },
  {
    path: "/daily-report",
    element: <Report />,
  },
  {
    path: "/daily-reports",
    element: <DailySummaryReport />,
  },
  {
    path: "/table-report",
    element: <TableReport />,
  },
  {
    path: "/measuring-unit/list",
    element: <MeasuringUnit />,
  },
  {
    path: "/measuring-unit/",
    element: <ListFormRedirect listPath="/admin/measuring-unit/list" />,
  },
  {
    path: "/measuring-unit/:id",
    element: <ListFormRedirect listPath="/admin/measuring-unit/list" />,
  },
  {
    path: "/stock-group/list",
    element: <StockGroup />,
  },
  {
    path: "/stock-group/",
    element: <ListFormRedirect listPath="/admin/stock-group/list" />,
  },
  {
    path: "/stock-group/:id",
    element: <ListFormRedirect listPath="/admin/stock-group/list" />,
  },
  {
    path: "/stock-item/list",
    element: <StockItem />,
  },
  {
    path: "/stock-history/list",
    element: <StockHistory />,
  },

];

const MODULE_RULES: { prefix: string; module: string; action?: string }[] = [
  { prefix: "/order/checkout", module: "Order", action: "order-checkout" },
  { prefix: "/order", module: "Order" },
  { prefix: "/auth", module: "Users" },
  { prefix: "/approve-request", module: "Action Request" },
  { prefix: "/roles", module: "Roles" },
  { prefix: "/access", module: "Access Module" },
  { prefix: "/media-category", module: "Media Category" },
  { prefix: "/media", module: "Media" },
  { prefix: "/settings", module: "Company Settings" },
  { prefix: "/ledger", module: "Ledger" },
  { prefix: "/recently-deleted", module: "Recently Deleted" },
  { prefix: "/email-template", module: "Email Template" },
  { prefix: "/smtp", module: "Email SMTP" },
  { prefix: "/active-email-template", module: "Active Email Template" },
  { prefix: "/product-category", module: "Product Category" },
  { prefix: "/item", module: "Product" },
  { prefix: "/product", module: "Product" },
  { prefix: "/open-item", module: "Open Item" },
  { prefix: "/product-variant", module: "Product" },
  { prefix: "/revenue", module: "Revenue" },
  { prefix: "/purchase-category", module: "Purchase Category" },
  { prefix: "/purchase", module: "Purchase" },
  { prefix: "/expense-category", module: "Expense Category" },
  { prefix: "/expense", module: "Expense" },
  { prefix: "/customer", module: "Customer" },
  { prefix: "/supplier", module: "Supplier" },
  { prefix: "/department", module: "Department" },
  { prefix: "/floor", module: "Floor" },
  { prefix: "/table-report", module: "Table Report" },
  { prefix: "/table", module: "Table" },
  { prefix: "/account-permission", module: "Account Permission" },
  { prefix: "/account", module: "Account" },
  { prefix: "/transaction", module: "Transaction" },
  { prefix: "/addons", module: "Addons" },
  { prefix: "/daily-report", module: "Daily Reports" },
  { prefix: "/daily-reports", module: "Daily Reports" },
  { prefix: "/measuring-unit", module: "Measuring Unit" },
  { prefix: "/stock-group", module: "Stock Group" },
  { prefix: "/stock-item", module: "Stock Item" },
  { prefix: "/stock-history", module: "Stock History" },
  { prefix: "/dashboard", module: "Dashboard" },
];

function resolveModule(path: string) {
  const hit = MODULE_RULES.find(
    (r) => path === r.prefix || path.startsWith(r.prefix + "/") || path.startsWith(r.prefix),
  );
  // Prefer longest prefix match
  const matches = MODULE_RULES.filter(
    (r) => path === r.prefix || path.startsWith(r.prefix + "/") || (r.prefix !== "/" && path.startsWith(r.prefix)),
  ).sort((a, b) => b.prefix.length - a.prefix.length);
  return matches[0] || hit || null;
}

export const adminLinks: { path: string; element: ReactNode }[] = rawAdminLinks.map(
  (link) => {
    const rule = resolveModule(link.path);
    if (!rule) return { path: link.path, element: link.element };
    return {
      path: link.path,
      element: (
        <ModuleGuard module={rule.module} action={rule.action || "view"}>
          {link.element}
        </ModuleGuard>
      ),
    };
  },
);
