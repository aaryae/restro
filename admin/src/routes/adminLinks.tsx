import { lazy, type ReactNode } from "react";

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
const EmailTemplate = lazy(() => import("@/pages/EmailTemplate"));
const AddEditEmailTemplate = lazy(
  () => import("@/pages/EmailTemplate/AddEditEmailTemplate"),
);
const EmailSmtp = lazy(() => import("@/pages/EmailSmtp"));
const ActiveEmailTemplate = lazy(() => import("@/pages/ActiveEmailTemplate"));
const ProductCategory = lazy(() => import("@/pages/ProductCategory"));
const AddEditProductCategory = lazy(
  () => import("@/pages/ProductCategory/AddEditProductCategory"),
);
const Product = lazy(() => import("@/pages/Product"));
const AddEditProduct = lazy(() => import("@/pages/Product/AddEditProduct"));
const ProductVariant = lazy(() => import("@/pages/ProductVariant"));
const AddEditProductVariant = lazy(
  () => import("@/pages/ProductVariant/AddEditProductVariant"),
);
const Customer = lazy(() => import("@/pages/Customer"));
const Order = lazy(() => import("@/pages/Order"));
const Department = lazy(() => import("@/pages/Department"));
const AddEditDepartment = lazy(
  () => import("@/pages/Department/AddEditDepartment"),
);
const Floor = lazy(() => import("@/pages/Floor"));
const AddEditFloor = lazy(() => import("@/pages/Floor/AddEditFloor"));
const OrderTable = lazy(() => import("@/pages/Table"));
const AddEditTable = lazy(() => import("@/pages/Table/AddEditTable"));
const AddEditOrder = lazy(() => import("@/pages/Order/components/AddEditOrder"));
const AddEditCustomer = lazy(() => import("@/pages/Customer/AddEditCustomer"));
const Supplier = lazy(() => import("@/pages/SuppliersModule"));
const AddEditSupplier = lazy(
  () => import("@/pages/SuppliersModule/AddEditSupplier"),
);
const Revenue = lazy(() => import("@/pages/Revenue"));
const AddEditRevenue = lazy(() => import("@/pages/Revenue/AddEditRevenue"));
const Purchase = lazy(() => import("@/pages/Purchase"));
const PurchaseCategory = lazy(() => import("@/pages/PurchaseCategory"));
const AddPurchaseCategory = lazy(
  () => import("@/pages/PurchaseCategory/AddEditPurchaseCategory"),
);
const AddEditPurchase = lazy(() => import("@/pages/Purchase/AddEditPurchase"));
const Account = lazy(() => import("@/pages/Account"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const AddEditExpense = lazy(() => import("@/pages/Expenses/AddEditExpense"));
const AddEditAccount = lazy(() => import("@/pages/Account/AddEditAccount"));
const OpenItem = lazy(() => import("@/pages/OpenItem"));
const AddEditOpenItem = lazy(() => import("@/pages/OpenItem/AddEditOpenItem"));
const ExpenseCategory = lazy(() => import("@/pages/ExpenseCategory"));
const AddExpenseCategory = lazy(
  () => import("@/pages/ExpenseCategory/AddEditExpenseCategory"),
);
const Transaction = lazy(() => import("@/pages/Transaction"));
const AddEditAccountPermission = lazy(
  () => import("@/pages/AccountPermission/AddEditAccountPermission"),
);
const AddEditAddons = lazy(() => import("@/pages/Addons/AddEditAddons"));
const Addons = lazy(() => import("@/pages/Addons"));
const AccountPermission = lazy(() => import("@/pages/AccountPermission"));
const Report = lazy(() => import("@/pages/DailyReport"));
const DailySummaryReport = lazy(() =>
  import("@/pages/DailySummaryReport").then((m) => ({
    default: m.DailySummaryReport,
  })),
);
const TableReport = lazy(() => import("@/pages/TableReport"));

export const adminLinks: { path: string; element: ReactNode }[] = [
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
    element: <AddEditProductCategory />,
  },
  {
    path: "/product-category/:id",
    element: <AddEditProductCategory />,
  },
  {
    path: "/product/list",
    element: <Product />,
  },
  {
    path: "/product/",
    element: <AddEditProduct />,
  },
  {
    path: "/product/:id",
    element: <AddEditProduct />,
  },
  {
    path: "/open-item/list",
    element: <OpenItem />,
  },
  {
    path: "/open-item/",
    element: <AddEditOpenItem />,
  },
  {
    path: "/open-item/:id",
    element: <AddEditOpenItem />,
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
    element: <AddEditRevenue />,
  },
  {
    path: "/revenue/:id",
    element: <AddEditRevenue />,
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
    element: <AddPurchaseCategory />,
  },
  {
    path: "/purchase-category/:id",
    element: <AddPurchaseCategory />,
  },
  {
    path: "/expense-category/list",
    element: <ExpenseCategory />,
  },
  {
    path: "/expense-category/",
    element: <AddExpenseCategory />,
  },
  {
    path: "/expense-category/:id",
    element: <AddExpenseCategory />,
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
    element: <AddEditSupplier />,
  },

  {
    path: "/supplier/:id",
    element: <AddEditSupplier />,
  },

  {
    path: "/department/list",
    element: <Department />,
  },
  {
    path: "/department/:id",
    element: <AddEditDepartment />,
  },
  {
    path: "/department/",
    element: <AddEditDepartment />,
  },
  {
    path: "/floor/list",
    element: <Floor />,
  },
  {
    path: "/floor/:id",
    element: <AddEditFloor />,
  },
  {
    path: "/floor/",
    element: <AddEditFloor />,
  },
  {
    path: "/table/list",
    element: <OrderTable />,
  },
  {
    path: "/table/:id",
    element: <AddEditTable />,
  },
  {
    path: "/table/",
    element: <AddEditTable />,
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
    element: <AddEditExpense />,
  },
  {
    path: "/expense/:id",
    element: <AddEditExpense />,
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
    element: <AddEditAccountPermission />,
  },
  {
    path: "/account-permission/:id",
    element: <AddEditAccountPermission />,
  },

  {
    path: "/addons/list",
    element: <Addons />,
  },
  {
    path: "/addons/",
    element: <AddEditAddons />,
  },
  {
    path: "/addons/:id",
    element: <AddEditAddons />,
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
];
