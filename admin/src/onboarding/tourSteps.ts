import {
  CircleDollarSign,
  ClipboardList,
  HelpCircle,
  ImageIcon,
  LandmarkIcon,
  LayoutDashboard,
  PanelsTopLeft,
  Search,
  Settings,
  ShoppingCart,
  Sofa,
  Sparkles,
  UploadCloud,
  UserCheck,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  id: string;
  /** Matches a `data-tour="…"` attribute. Omit for a centered, targetless step. */
  target?: string;
  title: string;
  body: string;
  icon: LucideIcon;
  placement?: TourPlacement;
  /** Navigate here before showing the step. */
  route?: string;
  /**
   * Access module name(s) — the step is skipped unless the user can view at
   * least one. Sidebar groups list several, since a group stays visible when
   * any single child is permitted.
   */
  module?: string | string[];
}

/**
 * The first-run walkthrough. Steps whose target never appears (hidden by
 * permissions or viewport) are skipped automatically by the tour engine.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to Serve",
    body: "A two-minute tour of the places you will use every day. You can leave at any time and replay it later from the help button.",
    placement: "center",
  },
  {
    id: "sidebar",
    target: "app-sidebar",
    icon: PanelsTopLeft,
    title: "Your navigation",
    body: "Everything is grouped here: Menu, Finance, Reports, Floors and Tables, and Settings. Collapse it with the toggle when you need more room.",
    placement: "right",
  },
  {
    id: "orders",
    target: "nav-orders",
    module: "Order",
    icon: ShoppingCart,
    title: "Orders — your floor",
    body: "The POS itself. Open a table, add items, send them to the kitchen as a KOT, then check out with cash, card, or a NepalPay QR.",
    placement: "right",
  },
  {
    id: "dashboard",
    target: "nav-dashboard",
    module: "Dashboard",
    icon: LayoutDashboard,
    title: "Dashboard — the daily pulse",
    body: "Revenue, purchases, expenses and cash position at a glance. Use the range tabs to compare today against the week or month.",
    placement: "right",
  },
  {
    id: "menu-group",
    target: "nav-Menu",
    module: "Product",
    icon: UtensilsCrossed,
    title: "Menu — items and categories",
    body: "Build what your floor can sell: items, categories, add-ons, and open items for one-off charges.",
    placement: "right",
  },
  {
    id: "menu-items",
    route: "/admin/item/list",
    target: "menu-bulk-upload",
    module: "Product",
    icon: UploadCloud,
    title: "Bulk upload your menu",
    body: "Already have your menu in Excel or Google Sheets? Download the template, paste your items, and upload — we validate every row before anything is saved.",
    placement: "bottom",
  },
  {
    id: "finance",
    target: "nav-Finance",
    module: ["Revenue", "Purchase", "Expense", "Supplier"],
    icon: CircleDollarSign,
    title: "Finance — money in and out",
    body: "Record revenue, purchases, expenses and suppliers here. These feed the dashboard charts and the daily summary report.",
    placement: "right",
  },
  {
    id: "reports",
    target: "nav-Report",
    module: ["Daily Reports", "Table Report"],
    icon: ClipboardList,
    title: "Reports — closing the day",
    body: "Daily summary and table performance. This is where most owners end their shift.",
    placement: "right",
  },
  {
    id: "customer",
    target: "nav-Customer",
    module: "Customer",
    icon: UserCheck,
    title: "Customers — your regulars",
    body: "Attach a customer to an order to build up their history. Useful for deliveries, running tabs and knowing who your best guests are.",
    placement: "right",
  },
  {
    id: "tables",
    target: "nav-Floors and Tables",
    module: ["Floor", "Table", "Department"],
    icon: Sofa,
    title: "Floors, tables and departments",
    body: "Lay out your floor plan and define kitchen departments so each KOT prints where it should.",
    placement: "right",
  },
  {
    id: "cash-and-banks",
    target: "nav-Cash and Banks",
    module: ["Account", "Transaction", "Account Permission"],
    icon: LandmarkIcon,
    title: "Cash and banks",
    body: "Your cash drawer, bank accounts and wallets. Every payment settles into one of these, and you can transfer between them or restrict who may touch each account.",
    placement: "right",
  },
  {
    id: "users-and-roles",
    target: "nav-Users and Roles",
    module: ["Users", "Roles"],
    icon: Users,
    title: "Users and roles",
    body: "Give each staff member their own login, then use roles to decide what they can reach — waiters on the POS, owners on Finance.",
    placement: "right",
  },
  {
    id: "media",
    target: "nav-Media",
    module: "Media",
    icon: ImageIcon,
    title: "Media library",
    body: "Upload item photos once and reuse them anywhere. Everything your menu shows on the POS grid comes from here.",
    placement: "right",
  },
  {
    id: "settings",
    target: "nav-Settings",
    module: ["Company Settings", "Ledger", "Recently Deleted"],
    icon: Settings,
    title: "Settings, ledger and safety net",
    body: "Company Settings holds your cafe name, logo and tax details for printed bills. Ledger is the running record of money in and out, and Recently Deleted lets you restore anything removed by mistake.",
    placement: "right",
  },
  {
    id: "search",
    target: "top-search",
    icon: Search,
    title: "Jump anywhere",
    body: "Search across pages and records without leaving the keyboard.",
    placement: "bottom",
  },
  {
    id: "help",
    target: "page-guide-button",
    icon: HelpCircle,
    title: "Help lives on every page",
    body: "This button explains the page you are on, with a short video where one is available. Replay this tour from here whenever you like.",
    placement: "bottom",
  },
];
