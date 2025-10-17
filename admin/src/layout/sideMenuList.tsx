import {
  MdDisplaySettings,
  MdOutlineFactCheck,
  MdOutlineMailOutline,
  MdOutlinePerson,
  MdOutlineTableBar,
} from "react-icons/md";

import { FaMoneyBillWave } from "react-icons/fa";
import { CircleDollarSign } from "lucide-react";
import { AiFillBank } from "react-icons/ai";
import { FiShoppingCart } from "react-icons/fi";

import { GiExpense } from "react-icons/gi";

import {
  Users,
  ImageIcon,
  Mail,
  Settings,
  UserCheck,
  LogsIcon,
  LandmarkIcon,
  Sofa,
  HandPlatter,
  Layers,
  UtensilsCrossed,
  ChartBarStacked,
  ClipboardPlus,
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
        path: "/admin/product/list",
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
      {
        key: 1.5,
        name: "Reports",
        icon: <ClipboardPlus size={12} />,
        path: "/admin/daily-report",
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
    key: 3,
    name: "Finance",
    icon: <CircleDollarSign />,
    menu: [
      {
        key: 3.1,
        name: "Revenue",
        icon: <FaMoneyBillWave />,
        path: "/admin/revenue/list",
      },
      {
        key: 3.2,
        name: "Purchase",
        icon: <FiShoppingCart />,
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
        icon: <GiExpense />,
        path: "/admin/expense/list",
      },
      {
        key: 3.5,
        name: "Expense Category",
        icon: <GiExpense />,
        path: "/admin/expense-category/list",
      },
      {
        key: 3.6,
        name: "Supplier",
        icon: <GiExpense />,
        path: "/admin/supplier/list",
      },
      {
        key: 3.7,
        name: "Transaction",
        icon: <GiExpense />,
        path: "/admin/transaction/list",
      },
    ],
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
        icon: <MdOutlineFactCheck />,
      },
      {
        key: 4.2,
        name: "Table",
        path: "/admin/table/list",
        icon: <MdOutlineFactCheck />,
      },
      {
        key: 4.3,
        name: "Department",
        path: "/admin/department/list",
        icon: <MdOutlineFactCheck />,
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
        icon: <MdOutlinePerson />,
      },
      {
        key: 5.2,
        name: "Roles",
        path: "/admin/roles/list",
        icon: <MdOutlineFactCheck />,
      },
    ],
  },
  {
    key: 6,
    name: "Media",
    path: "/admin/media-category/list",
    icon: <ImageIcon />,
  },

  // {
  //   key: 7,
  //   name: "Email",
  //   icon: <Mail />,
  //   menu: [],
  // },
  {
    key: 8,
    name: "Account",
    label: "Cash and Banks",
    icon: <LandmarkIcon />,
    path: "/admin/account/list",
  },

  {
    key: 9,
    name: "Settings",
    icon: <Settings />,
    path: "/admin/settings",
    menu: [
      {
        key: 9.1,
        name: "Company Settings",
        path: "/admin/settings/list",
        icon: <MdDisplaySettings />,
      },
      {
        key: 9.2,
        name: "Email Template",
        path: "/admin/email-template/list",
        icon: <MdOutlineMailOutline />,
      },
      {
        key: 9.3,
        name: "Email SMTP",
        path: "/admin/smtp",
        icon: <MdOutlineMailOutline />,
      },
    ],
  },
  {
    key: 10,
    name: "Account Permission",
    label: "Account Permission",
    icon: <LandmarkIcon />,
    path: "/admin/account-permission/list",
  },
];
