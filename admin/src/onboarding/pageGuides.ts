export interface PageGuide {
  id: string;
  /** Route prefixes this guide applies to; longest match wins. */
  match: string[];
  title: string;
  summary: string;
  /** "What you can do here" — kept short and action-oriented. */
  highlights: string[];
  tips?: string[];
  /** YouTube/Vimeo watch or embed URL, or a direct .mp4. */
  videoUrl?: string;
}

/**
 * Per-page explanations shown by the help button. Videos are optional and can
 * be pointed at your own hosting via VITE_ONBOARDING_VIDEO_BASE.
 */
export const PAGE_GUIDES: PageGuide[] = [
  {
    id: "dashboard",
    match: ["/admin/dashboard"],
    title: "Dashboard",
    summary:
      "Your cafe at a glance. Every number here is built from the orders, purchases and expenses recorded elsewhere in Serve.",
    highlights: [
      "Compare revenue, purchases and expenses across today, this week or this month",
      "Watch cash and bank balances move as transactions are recorded",
      "Jump straight into the page behind any card using the quick links",
    ],
    tips: [
      "Empty charts usually mean no orders have been checked out for the selected range.",
    ],
  },
  {
    id: "orders",
    match: ["/admin/order"],
    title: "Orders (POS)",
    summary:
      "The floor view. Open a table, build the order, fire it to the kitchen, then settle the bill.",
    highlights: [
      "Dine-in, takeaway and delivery orders in one place",
      "Send items to the kitchen as a KOT, routed by department",
      "Split payments, apply discounts, and take NepalPay QR payments",
      "Transfer items or whole orders between tables",
    ],
    tips: [
      "An order is only counted as revenue once it is checked out.",
    ],
  },
  {
    id: "product",
    match: ["/admin/item", "/admin/product"],
    title: "Menu items",
    summary:
      "Everything your staff can sell. Items belong to a category and are routed to a kitchen department.",
    highlights: [
      "Add items with price, photo, description and add-ons",
      "Bulk upload an existing menu from Excel or CSV",
      "Drag rows to control the order items appear in on the POS",
    ],
    tips: [
      "Create your departments and categories first — bulk upload matches them by name.",
    ],
  },
  {
    id: "product-category",
    match: ["/admin/product-category"],
    title: "Menu categories",
    summary:
      "Categories group your items on the POS grid, so staff can find things fast during a rush.",
    highlights: [
      "Create categories like Coffee, Snacks or Beverages",
      "Reorder them to match how your staff actually work",
    ],
  },
  {
    id: "addons",
    match: ["/admin/addons"],
    title: "Add-ons",
    summary:
      "Optional extras that attach to an item — an extra shot, a side, a sauce.",
    highlights: [
      "Define an add-on once and reuse it across many items",
      "Add-ons are priced separately and show on the bill",
    ],
  },
  {
    id: "open-item",
    match: ["/admin/open-item"],
    title: "Open items",
    summary:
      "One-off charges that are not on your menu, such as a custom platter or a service fee.",
    highlights: ["Charge an ad-hoc amount without polluting your menu"],
  },
  {
    id: "floor",
    match: ["/admin/floor", "/admin/table"],
    title: "Floors and tables",
    summary:
      "Your physical layout. Tables live on floors, and the POS floor view mirrors what you set up here.",
    highlights: [
      "Create floors, then add tables to each floor",
      "Table status on the POS reflects live orders",
    ],
  },
  {
    id: "department",
    match: ["/admin/department"],
    title: "Departments",
    summary:
      "Departments decide where a KOT prints — kitchen, bar, or a grill station.",
    highlights: [
      "Assign every menu item to a department",
      "Each department gets its own kitchen ticket",
    ],
  },
  {
    id: "revenue",
    match: ["/admin/revenue"],
    title: "Revenue",
    summary:
      "Income records, including sales settled through the POS and any money recorded manually.",
    highlights: ["Track income by account", "Feeds the dashboard revenue chart"],
  },
  {
    id: "purchase",
    match: ["/admin/purchase"],
    title: "Purchases",
    summary:
      "What you buy from suppliers. Purchases drive your cost side of the dashboard.",
    highlights: [
      "Record purchases against a supplier and category",
      "Pay from a cash, bank or wallet account",
    ],
  },
  {
    id: "purchase-category",
    match: ["/admin/purchase-category"],
    title: "Purchase categories",
    summary:
      "Buckets for what you buy — produce, dairy, packaging, beverages. They group your spending on the dashboard.",
    highlights: ["Create the categories your purchases are filed under"],
  },
  {
    id: "expense",
    match: ["/admin/expense"],
    title: "Expenses",
    summary:
      "Running costs that are not stock — rent, salaries, utilities, repairs.",
    highlights: ["Group expenses by category", "Shows in the daily summary"],
  },
  {
    id: "expense-category",
    match: ["/admin/expense-category"],
    title: "Expense categories",
    summary:
      "How your running costs are grouped, so you can see where the money actually goes.",
    highlights: ["Create categories like Rent, Salary or Utilities"],
  },
  {
    id: "supplier",
    match: ["/admin/supplier"],
    title: "Suppliers",
    summary: "The vendors you buy from, reusable across purchases.",
    highlights: ["Keep contact details and purchase history in one place"],
  },
  {
    id: "account",
    match: ["/admin/account", "/admin/transaction"],
    title: "Cash and banks",
    summary:
      "Your cash drawer, bank accounts and wallets. Every payment lands in one of these.",
    highlights: [
      "Create cash, bank and wallet accounts",
      "Transfer money between accounts",
      "Review every transaction with its source",
    ],
  },
  {
    id: "account-permission",
    match: ["/admin/account-permission"],
    title: "Account permissions",
    summary:
      "Controls which staff may move money through which cash or bank account.",
    highlights: [
      "Restrict a bank account to owners only",
      "Let cashiers touch the cash drawer and nothing else",
    ],
  },
  {
    id: "customer",
    match: ["/admin/customer"],
    title: "Customers",
    summary:
      "Your regulars. Attach a customer to an order to build history and loyalty.",
    highlights: ["Store contact details", "See what each customer orders"],
  },
  {
    id: "users",
    match: ["/admin/auth", "/admin/roles", "/admin/access"],
    title: "Users and roles",
    summary:
      "Who can do what. Roles carry permissions; users are assigned a role.",
    highlights: [
      "Invite waiters, cashiers and managers",
      "Restrict sensitive pages like Finance to owners",
    ],
    tips: ["Give each staff member their own login — never share one account."],
  },
  {
    id: "reports",
    match: ["/admin/daily-reports", "/admin/daily-report", "/admin/table-report"],
    title: "Reports",
    summary:
      "End-of-day numbers: sales, payments, purchases and expenses for a date range.",
    highlights: [
      "Close the day with a single summary",
      "Export to Excel or PDF for your accountant",
    ],
  },
  {
    id: "settings",
    match: ["/admin/settings"],
    title: "Company settings",
    summary:
      "Your cafe identity — name, logo, address and tax details. Everything here shows up on printed bills and KOTs.",
    highlights: [
      "Set your brand name and logo",
      "Configure PAN/VAT and the bill footer",
      "Set currency, service charge and tax rates",
    ],
    tips: [
      "Get this right before your first real service — bills already printed keep the old details.",
    ],
  },
  {
    // The list route is /admin/media-category/list, so both prefixes matter.
    id: "media",
    match: ["/admin/media", "/admin/media-category"],
    title: "Media library",
    summary:
      "Images used across your menu. Upload once and reuse on any item.",
    highlights: [
      "Organise images into categories",
      "Pick a stored image from any item form instead of re-uploading",
    ],
  },
  {
    id: "ledger",
    match: ["/admin/ledger"],
    title: "Ledger",
    summary:
      "A chronological record of every money movement across your accounts — sales, purchases, expenses and transfers in one running list.",
    highlights: [
      "Audit income and spending over any date range",
      "Trace a transaction back to the order or purchase behind it",
      "Hand a clean record to your accountant",
    ],
  },
  {
    id: "recently-deleted",
    match: ["/admin/recently-deleted"],
    title: "Recently deleted",
    summary:
      "A safety net. Deleted records rest here for a while before they are gone for good.",
    highlights: ["Restore something removed by mistake"],
  },
  {
    id: "stock-item",
    match: ["/admin/stock-item"],
    title: "Stock items — your inventory hub",
    summary:
      "Ingredients and supplies you buy and track in the store — flour, oil, bottles, packets. This is separate from the Menu: menu items are what you sell; stock items are what you keep in quantity.",
    highlights: [
      "Add a stock item with a measuring unit, optional group, opening quantity and rate",
      "Use Adjust to record purchases or write-offs; every change is logged in Stock History",
      "Bulk upload from Excel when you already have a supplier list",
      "Watch the KPI cards for total value and low-stock alerts",
    ],
    tips: [
      "Measuring units ship with restaurant defaults (kg, ltr, pcs, …). Open Measuring Units to see descriptions or add your own.",
      "Stock groups are optional folders — Dairy, Dry Goods, Beverages — so the list stays tidy.",
      "Recipe consumption and purchase→stock linking come in a later phase; for now you adjust quantities manually.",
    ],
  },
  {
    id: "measuring-unit",
    match: ["/admin/measuring-unit"],
    title: "Measuring units",
    summary:
      "How you count or weigh stock — kilograms, liters, pieces, bottles. Every stock item needs one unit so quantities stay consistent.",
    highlights: [
      "Restaurant defaults are seeded for you (kg, g, ltr, ml, pcs, pkt, dz, btl, can, box)",
      "Each unit has a short description of when to use it",
      "Add a custom unit if your supplier uses a different pack size",
    ],
    tips: [
      "You cannot delete a unit that is already used by a stock item.",
    ],
  },
  {
    id: "stock-group",
    match: ["/admin/stock-group"],
    title: "Stock groups",
    summary:
      "Optional folders for stock items — Dairy, Dry Goods, Cleaning — so the inventory list is easier to scan.",
    highlights: [
      "Create groups that match how your store is organised",
      "Assign a group when you create or edit a stock item",
      "Bulk upload can create a group automatically from the Group column",
    ],
  },
  {
    id: "stock-history",
    match: ["/admin/stock-history"],
    title: "Stock history",
    summary:
      "An audit trail of every quantity change — opening stock, adjustments in or out, and the rate used at the time.",
    highlights: [
      "Filter with Today / Yesterday / Last 7 or 30 days, or pick a custom From–To range on the calendar",
      "Trace quantity changes back to opening stock and adjustments",
      "Use it alongside Finance purchases until automatic linking ships",
    ],
  },
  {
    id: "product-variant",
    match: ["/admin/product-variant"],
    title: "Item variants",
    summary:
      "Sizes and versions of the same item — small, regular and large, each with its own price.",
    highlights: ["Price each variant separately", "Staff pick the size at the POS"],
  },
  {
    id: "approve-request",
    match: ["/admin/approve-request"],
    title: "Approval requests",
    summary:
      "Actions a staff member asked to perform that need a supervisor's sign-off first.",
    highlights: [
      "Review what was requested and by whom",
      "Approve or reject before the change is applied",
    ],
  },
  {
    id: "profile",
    match: ["/admin/profile"],
    title: "Your profile",
    summary: "Your own account details and password.",
    highlights: ["Update your name, photo and contact details", "Change your password"],
  },
  {
    id: "email",
    match: [
      "/admin/email-template",
      "/admin/active-email-template",
      "/admin/smtp",
    ],
    title: "Email",
    summary:
      "Templates and delivery settings for the mail Serve sends on your behalf.",
    highlights: [
      "Edit the wording of automated emails",
      "Choose which template is active",
      "Point Serve at your own SMTP server",
    ],
  },
];

/** Longest-prefix match so "/admin/product-category" beats "/admin/product". */
export function findPageGuide(pathname: string): PageGuide | null {
  let best: { guide: PageGuide; length: number } | null = null;

  for (const guide of PAGE_GUIDES) {
    for (const prefix of guide.match) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (!best || prefix.length > best.length) {
          best = { guide, length: prefix.length };
        }
      }
    }
  }

  return best?.guide ?? null;
}
