import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  UtensilsCrossed,
  ChartBarStacked,
  Users,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Table2,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { checkAccess } from "@/utils/accessHelper";
import {
  ORDER_LIST_ROUTE,
  PRODUCT_LIST_ROUTE,
  PRODUCT_CATEGORY_LIST_ROUTE,
  CUSTOMER_LIST_ROUTE,
  REVENUE_LIST_ROUTE,
  PURCHASE_LIST_ROUTE,
  EXPENSE_LIST_ROUTE,
  TABLE_LIST_ROUTE,
} from "@/routes/routeNames";

type QuickLink = {
  label: string;
  path: string;
  module: string;
  icon: LucideIcon;
};

const quickLinks: QuickLink[] = [
  { label: "Orders", path: ORDER_LIST_ROUTE, module: "Order", icon: ClipboardList },
  {
    label: "Menu Items",
    path: PRODUCT_LIST_ROUTE,
    module: "Product",
    icon: UtensilsCrossed,
  },
  {
    label: "Categories",
    path: PRODUCT_CATEGORY_LIST_ROUTE,
    module: "Product Category",
    icon: ChartBarStacked,
  },
  {
    label: "Customers",
    path: CUSTOMER_LIST_ROUTE,
    module: "Customer",
    icon: Users,
  },
  {
    label: "Revenue",
    path: REVENUE_LIST_ROUTE,
    module: "Revenue",
    icon: TrendingUp,
  },
  {
    label: "Purchase",
    path: PURCHASE_LIST_ROUTE,
    module: "Purchase",
    icon: ShoppingCart,
  },
  {
    label: "Expense",
    path: EXPENSE_LIST_ROUTE,
    module: "Expense",
    icon: Receipt,
  },
  {
    label: "Tables",
    path: TABLE_LIST_ROUTE,
    module: "Table",
    icon: Table2,
  },
  {
    label: "Daily Reports",
    path: "/admin/daily-reports",
    module: "Daily Reports",
    icon: FileText,
  },
];

export default function DashboardQuickLinks() {
  const navigate = useNavigate();

  const visibleLinks = quickLinks.filter((link) =>
    checkAccess(link.module).includes("view"),
  );

  if (!visibleLinks.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Quick navigation
      </p>
      <div className="flex flex-wrap gap-2">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.path}
              type="button"
              onClick={() => navigate(link.path)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-[12px] font-medium text-slate-700 transition hover:border-primaryColor/30 hover:bg-white hover:text-primaryColor sm:text-[13px]"
            >
              <Icon size={14} className="shrink-0 text-slate-500" />
              <span>{link.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
