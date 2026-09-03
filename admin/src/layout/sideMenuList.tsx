import {
  Banknote,
  ChartBarStacked,
  CircleDollarSign,
  ClipboardList,
  ClipboardPlus,
  HandPlatter,
  History,
  ImageIcon,
  LandmarkIcon,
  Layers,
  LogsIcon,
  Package,
  Receipt,
  Ruler,
  Settings,
  ShoppingCart,
  Sofa,
  UserCheck,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export type SideListMenuType = {
  key: number;
  name: string;
  label?: string;
  icon: React.ReactNode;
  path?: string;
  menu?: SideListMenuType[];
};

export const SideMenuList: SideListMenuType[] = [
  {
    key: 1,
    name: "Menu",
    icon: <LogsIcon />,
    menu: [
      {
        key: 1.1,
        name: "Product",
        label: "Items",
        path: "/admin/item/list",
        icon: <UtensilsCrossed size={12} />,
      },
      {
        key: 1.2,
        name: "Product Category",
        label: "Categories",
        path: "/admin/product-category/list",
        icon: <ChartBarStacked size={12} />,
      },
      {
        key: 1.3,
        name: "Open Item",
        icon: <HandPlatter size={12} />,
        path: "/admin/open-item/list",
      },
      {
        key: 1.4,
        name: "Addons",
        icon: <HandPlatter size={12} />,
        path: "/admin/addons/list",
      },
    ],
  },
  {
    key: 11,
    name: "Inventory",
    icon: <Package />,
    menu: [
      {
        key: 11.1,
        name: "Stock Item",
        path: "/admin/stock-item/list",
        icon: <Package size={12} />,
      },
      {
        key: 11.2,
        name: "Measuring Unit",
        path: "/admin/measuring-unit/list",
        icon: <Ruler size={12} />,
      },
      {
        key: 11.3,
        name: "Stock Group",
        path: "/admin/stock-group/list",
        icon: <Layers size={12} />,
      },
      {
        key: 11.4,
        name: "Stock History",
        path: "/admin/stock-history/list",
        icon: <History size={12} />,
      },
    ],
  },
  {
    key: 3,
    name: "Finance",
    icon: <CircleDollarSign />,
    menu: [
      {
        key: 3.1,
        name: "Revenue",
        icon: <Banknote />,
        path: "/admin/revenue/list",
      },
      {
        key: 3.2,
        name: "Purchase",
        icon: <ShoppingCart />,
        path: "/admin/purchase/list",
      },
      {
        key: 3.3,
        name: "Purchase Category",
        icon: <Layers size={12} />,
        path: "/admin/purchase-category/list",
      },
      {
        key: 3.4,
        name: "Expense",
        icon: <Receipt />,
        path: "/admin/expense/list",
      },
      {
        key: 3.5,
        name: "Expense Category",
        icon: <Receipt />,
        path: "/admin/expense-category/list",
      },
      {
        key: 3.6,
        name: "Supplier",
        icon: <Receipt />,
        path: "/admin/supplier/list",
      },
    ],
  },
  {
    key: 10,
    name: "Report",
    icon: <ClipboardList size={12} />,
    menu: [
      {
        key: 10.2,
        name: "Daily Reports",
        label: "Daily Reports",
        icon: <ClipboardPlus size={12} />,
        path: "/admin/daily-reports",
      },
      {
        key: 10.3,
        name: "Table Report",
        label: "Table Report",
        icon: <ClipboardPlus size={12} />,
        path: "/admin/table-report",
      },
    ],
  },
  {
    key: 2,
    name: "Customer",
    icon: <UserCheck />,
    path: "/admin/customer/list",
  },
  {
    key: 4,
    name: "Floors and Tables",
    icon: <Sofa />,
    menu: [
      {
        key: 4.1,
        name: "Floor",
        path: "/admin/floor/list",
        icon: <ClipboardList size={12} />,
      },
      {
        key: 4.2,
        name: "Table",
        path: "/admin/table/list",
        icon: <ClipboardList size={12} />,
      },
      {
        key: 4.3,
        name: "Department",
        path: "/admin/department/list",
        icon: <ClipboardList size={12} />,
      },
    ],
  },
  {
    key: 8,
    name: "Cash and Banks",
    icon: <LandmarkIcon />,
    menu: [
      {
        key: 8.1,
        name: "Account",
        label: "Accounts",
        icon: <ClipboardList size={12} />,
        path: "/admin/account/list",
      },
      {
        key: 8.2,
        name: "Transaction",
        icon: <Receipt />,
        path: "/admin/transaction/list",
      },
      {
        key: 8.3,
        name: "Account Permission",
        label: "Permission",
        icon: <LandmarkIcon size={12} />,
        path: "/admin/account-permission/list",
      },
    ],
  },
  {
    key: 5,
    name: "Users and Roles",
    icon: <Users />,
    menu: [
      {
        key: 5.1,
        name: "Users",
        path: "/admin/auth/list",
        icon: <UserCheck size={12} />,
      },
      {
        key: 5.2,
        name: "Roles",
        path: "/admin/roles/list",
        icon: <ClipboardList size={12} />,
      },
    ],
  },
  {
    key: 6,
    name: "Media",
    path: "/admin/media-category/list",
    icon: <ImageIcon />,
  },
  {
    key: 9,
    name: "Settings",
    icon: <Settings />,
    path: "/admin/settings/list",
    menu: [
      {
        key: 9.1,
        name: "Company Settings",
        path: "/admin/settings/list",
        icon: <Settings size={12} />,
      },
      {
        key: 9.2,
        name: "Ledger",
        path: "/admin/ledger/list",
        icon: <ClipboardList size={12} />,
      },
      {
        key: 9.3,
        name: "Recently Deleted",
        path: "/admin/recently-deleted",
        icon: <ClipboardList size={12} />,
      },
    ],
  },
];
