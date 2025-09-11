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
  MenuIcon,
  LogsIcon,
  LandmarkIcon,
  Sofa,
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
        icon: <MdOutlineFactCheck />,
      },
      {
        key: 1.2,
        name: "Product Category",
        label: "Categories",
        path: "/admin/product-category/list",
        icon: <MdOutlineFactCheck />,
      },
      // {
      //   key: 3.3,
      //   name: "Product Variant",
      //   path: "/admin/product-variant/list",
      //   icon: <MdOutlineFactCheck />,
      // },
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
        name: "Expense",
        icon: <GiExpense />,
        path: "/admin/expense/list",
      },
      {
        key: 3.4,
        name: "Supplier",
        icon: <GiExpense />,
        path: "/admin/supplier/list",
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

  {
    key: 7,
    name: "Email",
    icon: <Mail />,
    menu: [
      {
        key: 7.1,
        name: "Email Template",
        path: "/admin/email-template/list",
        icon: <MdOutlineMailOutline />,
      },
      {
        key: 7.2,
        name: "Email SMTP",
        path: "/admin/smtp",
        icon: <MdOutlineMailOutline />,
      },
    ],
  },
  {
    key: 8,
    name: "Account",
    icon: <LandmarkIcon />,
    path: "/admin/account/list",
  },

  {
    key: 10,
    name: "Settings",
    icon: <Settings />,
    path: "/admin/settings",
    menu: [
      {
        key: 10.1,
        name: "Company Settings",
        path: "/admin/settings/list",
        icon: <MdDisplaySettings />,
      },
    ],
  },
];
