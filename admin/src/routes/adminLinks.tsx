import UserProfile from "@/pages/UserProfile";
import Access from "@/pages/Access";
import EditAccess from "@/pages/Access/EditAccess";
import Dashboard from "@/pages/Dashboard";
import Media from "@/pages/Media";
import MediaImages from "@/pages/Media/mediaImages";
import Roles from "@/pages/Roles";
import Users from "@/pages/Users";
import ApproveRequest from "@/pages/ApproveRequest";
import Settings from "@/pages/Settings";
import EmailTemplate from "@/pages/EmailTemplate";
import AddEditEmailTemplate from "@/pages/EmailTemplate/AddEditEmailTemplate";
import EmailSmtp from "@/pages/EmailSmtp";
import ActiveEmailTemplate from "@/pages/ActiveEmailTemplate";
import ProductCategory from "@/pages/ProductCategory";
import AddEditProductCategory from "@/pages/ProductCategory/AddEditProductCategory";
import Product from "@/pages/Product";
import AddEditProduct from "@/pages/Product/AddEditProduct";
import ProductVariant from "@/pages/ProductVariant";
import AddEditProductVariant from "@/pages/ProductVariant/AddEditProductVariant";
import Customer from "@/pages/Customer";
import Order from "@/pages/Order";
import Department from "@/pages/Department";
import AddEditDepartment from "@/pages/Department/AddEditDepartment";
import Floor from "@/pages/Floor";
import AddEditFloor from "@/pages/Floor/AddEditFloor";
import OrderTable from "@/pages/Table";
import AddEditTable from "@/pages/Table/AddEditTable";
import AddEditOrder from "@/pages/Order/components/AddEditOrder";
import AddEditCustomer from "@/pages/Customer/AddEditCustomer";
import Supplier from "@/pages/SuppliersModule";
import AddEditSupplier from "@/pages/SuppliersModule/AddEditSupplier";
import Revenue from "@/pages/Revenue";
import AddEditRevenue from "@/pages/Revenue/AddEditRevenue";
import Purchase from "@/pages/Purchase";
import PurchaseCategory from "@/pages/PurchaseCategory";
import AddPurchaseCategory from "@/pages/PurchaseCategory/AddEditPurchaseCategory";
import AddEditPurchase from "@/pages/Purchase/AddEditPurchase";
import Account from "@/pages/Account";
import Expenses from "@/pages/Expenses";
import AddEditExpense from "@/pages/Expenses/AddEditExpense";
import AddEditAccount from "@/pages/Account/AddEditAccount";
import OpenItem from "@/pages/OpenItem";
import AddEditOpenItem from "@/pages/OpenItem/AddEditOpenItem";
import ExpenseCategory from "@/pages/ExpenseCategory";
import AddExpenseCategory from "@/pages/ExpenseCategory/AddEditExpenseCategory";
import Transaction from "@/pages/Transaction";
import AddEditAccountPermission from "@/pages/AccountPermission/AddEditAccountPermission";
import AddEditAddons from "@/pages/Addons/AddEditAddons";
import Addons from "@/pages/Addons";
import AccountPermission from "@/pages/AccountPermission";
import Report from "@/pages/DailyReport";
import { DailySummaryReport } from "@/pages/DailySummaryReport";
import { TableReport } from "@/pages/TableReport";

export const adminLinks = [
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
