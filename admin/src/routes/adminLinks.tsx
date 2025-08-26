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
import AddEditOrder from "@/pages/Order/AddEditOrder";
import AddEditCustomer from "@/pages/Customer/AddEditCustomer";

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
];
