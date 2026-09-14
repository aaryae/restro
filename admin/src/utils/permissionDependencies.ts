export type PermissionAction = {
  id: number;
  title: string;
  key: string;
  list: string;
};

export type PermissionModule = {
  key: string;
  title: string;
  children: PermissionAction[];
};

export type PermissionSection = {
  key: string;
  title: string;
  description: string;
  modules: PermissionModule[];
};

const LIST_VIEW_KEY = "view";

/** Friendly module names (match what staff see in the sidebar). */
export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  Dashboard: "Dashboard",
  Order: "Orders",
  Kot: "Kitchen tickets (KOT)",
  Product: "Menu items",
  "Product Category": "Menu categories",
  "Open Item": "Open items",
  Addons: "Add-ons",
  "Stock Item": "Stock items",
  "Measuring Unit": "Measuring units",
  "Stock Group": "Stock groups",
  "Stock History": "Stock history",
  Revenue: "Revenue",
  Purchase: "Purchases",
  "Purchase Category": "Purchase categories",
  Expense: "Expenses",
  "Expense Category": "Expense categories",
  Supplier: "Suppliers",
  "Daily Reports": "Daily reports",
  "Table Report": "Table reports",
  Reports: "Reports",
  Customer: "Customers",
  Floor: "Floors",
  Table: "Tables",
  Department: "Departments",
  Account: "Cash & bank accounts",
  Transaction: "Transactions",
  "Account Permission": "Account permissions",
  Transfer: "Transfers",
  Users: "Staff users",
  Roles: "Roles & permissions",
  Media: "Media files",
  "Media Category": "Media folders",
  "Company Settings": "Company settings",
  Ledger: "Ledger",
  "Email Template": "Email templates",
  "Active Email Template": "Active email templates",
  "Email SMTP": "Email (SMTP) settings",
  "Access Module": "System access modules",
  "Action Request": "Action requests",
  Layout: "POS layout",
};

/** Group modules like the left sidebar for easier scanning. */
export const PERMISSION_SECTIONS: Array<{
  key: string;
  title: string;
  description: string;
  modules: string[];
}> = [
  {
    key: "dashboard",
    title: "Dashboard",
    description: "Home screen overview",
    modules: ["Dashboard"],
  },
  {
    key: "orders",
    title: "Orders",
    description: "Taking and managing orders",
    modules: ["Order", "Kot"],
  },
  {
    key: "menu",
    title: "Menu",
    description: "Items, categories, and add-ons",
    modules: ["Product", "Product Category", "Open Item", "Addons"],
  },
  {
    key: "inventory",
    title: "Inventory",
    description: "Stock and measuring units",
    modules: ["Stock Item", "Measuring Unit", "Stock Group", "Stock History"],
  },
  {
    key: "finance",
    title: "Finance",
    description: "Money in and money out",
    modules: [
      "Revenue",
      "Purchase",
      "Purchase Category",
      "Expense",
      "Expense Category",
      "Supplier",
    ],
  },
  {
    key: "reports",
    title: "Reports",
    description: "Business reports",
    modules: ["Daily Reports", "Table Report", "Reports"],
  },
  {
    key: "customers",
    title: "Customers",
    description: "Customer records",
    modules: ["Customer"],
  },
  {
    key: "floors",
    title: "Floors & tables",
    description: "Floor plan and seating",
    modules: ["Floor", "Table", "Department"],
  },
  {
    key: "cash",
    title: "Cash & banks",
    description: "Accounts and money movement",
    modules: ["Account", "Transaction", "Account Permission", "Transfer"],
  },
  {
    key: "users",
    title: "Users & roles",
    description: "Staff accounts and access",
    modules: ["Users", "Roles"],
  },
  {
    key: "media",
    title: "Media",
    description: "Photos and files",
    modules: ["Media", "Media Category"],
  },
  {
    key: "settings",
    title: "Settings",
    description: "Cafe and system settings",
    modules: [
      "Company Settings",
      "Ledger",
      "Email Template",
      "Active Email Template",
      "Email SMTP",
      "Layout",
    ],
  },
  {
    key: "system",
    title: "Advanced / system",
    description: "Usually only for managers",
    modules: ["Access Module", "Action Request"],
  },
];

/** Plain-language labels for common action keys. */
const ACTION_KEY_LABELS: Record<string, string> = {
  view: "Can open and see this section",
  "view-one": "Can open a single record",
  "view-single": "Can open a single record",
  "view-by-id": "Can open a single record",
  "view-grouped": "Can see grouped totals",
  "view-total": "Can see totals",
  "view-order-item": "Can see items on an order",
  add: "Can add new records",
  edit: "Can edit records",
  delete: "Can delete records",
  block: "Can block / unblock",
  "toggle-isActive": "Can turn active on or off",
  "reset-password": "Can reset staff passwords",
  "change-password": "Can change password",
  "change-name": "Can rename",
  "edit-status": "Can change status",
  "edit-default": "Can set as default",
  "edit-order": "Can edit an order",
  "order-checkout": "Can take payment / checkout",
  "edit-order-item-status": "Can update item status on an order",
  adjust: "Can adjust stock counts",
  import: "Can import data",
  "payment-qr-initiate": "Can start QR payment",
  "payment-qr-status": "Can check QR payment status",
  "payment-qr-cancel": "Can cancel QR payment",
  "get-by-user-id": "Can look up by staff member",
};

const DETAIL_VIEW_KEYS = new Set([
  "view-single",
  "view-one",
  "view-by-id",
  "view-grouped",
  "view-total",
  "view-order-item",
]);

const DETAIL_REQUIRED_KEYS = new Set([
  "edit",
  "delete",
  "toggle-isActive",
  "reset-password",
  "change-name",
  "edit-status",
  "edit-default",
  "edit-order",
  "block",
  "get-by-user-id",
  "payment-qr-initiate",
  "payment-qr-status",
  "payment-qr-cancel",
  "edit-order-item-status",
  "order-checkout",
]);

export function getModuleDisplayName(listKey: string): string {
  return MODULE_DISPLAY_NAMES[listKey] || listKey;
}

export function isListViewKey(key: string): boolean {
  return key === LIST_VIEW_KEY;
}

export function isDetailViewKey(key: string): boolean {
  if (isListViewKey(key)) return false;
  if (DETAIL_VIEW_KEYS.has(key)) return true;
  return key.startsWith("view-");
}

export function requiresListView(key: string): boolean {
  return !isListViewKey(key);
}

export function requiresDetailView(key: string): boolean {
  if (key === "change-password" || key === "add") return false;
  if (DETAIL_REQUIRED_KEYS.has(key)) return true;
  return key.startsWith("edit-");
}

export function getListViewAction(
  actions: PermissionAction[],
): PermissionAction | undefined {
  return actions.find((action) => isListViewKey(action.key));
}

export function getDetailViewActions(
  actions: PermissionAction[],
): PermissionAction[] {
  return actions.filter((action) => isDetailViewKey(action.key));
}

export function getPrerequisiteLabels(
  action: PermissionAction,
  moduleActions: PermissionAction[],
): string[] {
  const labels: string[] = [];
  const listView = getListViewAction(moduleActions);

  if (requiresListView(action.key) && listView) {
    labels.push(getDisplayTitle(listView, moduleActions));
  }

  if (requiresDetailView(action.key)) {
    const detailViews = getDetailViewActions(moduleActions);
    if (detailViews.length > 0) {
      labels.push(getDisplayTitle(detailViews[0], moduleActions));
    }
  }

  return labels;
}

export function isPermissionEnabled(
  action: PermissionAction,
  moduleActions: PermissionAction[],
  selectedIds: number[],
): boolean {
  const listView = getListViewAction(moduleActions);
  if (requiresListView(action.key) && listView && !selectedIds.includes(listView.id)) {
    return false;
  }

  if (requiresDetailView(action.key)) {
    const detailViews = getDetailViewActions(moduleActions);
    if (
      detailViews.length > 0 &&
      !detailViews.some((detail) => selectedIds.includes(detail.id))
    ) {
      return false;
    }
  }

  return true;
}

export function togglePermission(
  moduleActions: PermissionAction[],
  selectedIds: number[],
  actionId: number,
  checked: boolean,
): number[] {
  const action = moduleActions.find((item) => item.id === actionId);
  if (!action) return selectedIds;

  const next = new Set(selectedIds);

  if (checked) {
    next.add(actionId);

    const listView = getListViewAction(moduleActions);
    if (listView && requiresListView(action.key)) {
      next.add(listView.id);
    }

    if (requiresDetailView(action.key)) {
      getDetailViewActions(moduleActions).forEach((detail) => next.add(detail.id));
    }
  } else {
    next.delete(actionId);

    if (isListViewKey(action.key)) {
      moduleActions.forEach((item) => next.delete(item.id));
    } else if (isDetailViewKey(action.key)) {
      moduleActions.forEach((item) => {
        if (requiresDetailView(item.key)) next.delete(item.id);
      });
    }
  }

  return Array.from(next);
}

export function toggleAllInModule(
  moduleActions: PermissionAction[],
  selectedIds: number[],
  checked: boolean,
): number[] {
  const moduleIds = moduleActions.map((action) => action.id);
  if (!checked) {
    return selectedIds.filter((id) => !moduleIds.includes(id));
  }
  return [...new Set([...selectedIds, ...moduleIds])];
}

export function normalizeSelectedPermissions(
  modules: PermissionModule[],
  selectedIds: number[],
): number[] {
  let normalized = [...selectedIds];

  modules.forEach((module) => {
    const moduleIds = new Set(module.children.map((action) => action.id));
    const selectedInModule = normalized.filter((id) => moduleIds.has(id));
    if (selectedInModule.length === 0) return;

    const listView = getListViewAction(module.children);
    const hasListView = listView ? normalized.includes(listView.id) : true;

    if (!hasListView) {
      normalized = normalized.filter(
        (id) =>
          !moduleIds.has(id) ||
          module.children.find((action) => action.id === id)?.key === LIST_VIEW_KEY,
      );
    }

    const detailViews = getDetailViewActions(module.children);
    const hasDetailView =
      detailViews.length === 0 ||
      detailViews.some((detail) => normalized.includes(detail.id));

    if (!hasDetailView) {
      normalized = normalized.filter((id) => {
        const action = module.children.find((item) => item.id === id);
        return !action || !requiresDetailView(action.key);
      });
    }
  });

  return normalized;
}

export function groupPermissionsByCategory(actions: PermissionAction[]) {
  const groups = {
    view: [] as PermissionAction[],
    create: [] as PermissionAction[],
    modify: [] as PermissionAction[],
    other: [] as PermissionAction[],
  };

  actions.forEach((action) => {
    if (isListViewKey(action.key) || isDetailViewKey(action.key)) {
      groups.view.push(action);
    } else if (action.key === "add") {
      groups.create.push(action);
    } else if (
      action.key === "edit" ||
      action.key === "delete" ||
      action.key === "block" ||
      action.key.startsWith("edit-")
    ) {
      groups.modify.push(action);
    } else {
      groups.other.push(action);
    }
  });

  return groups;
}

export function getDisplayTitle(
  action: PermissionAction,
  moduleActions: PermissionAction[],
): string {
  const mapped = ACTION_KEY_LABELS[action.key];
  if (mapped) return mapped;

  const cleaned = String(action.title || "")
    .replace(/\b(API|Endpoint|Route)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned && !/^[a-z0-9-]+$/i.test(cleaned)) {
    const duplicates = moduleActions.filter((item) => item.title === action.title);
    if (duplicates.length <= 1) return cleaned;
  }

  const keyLabel = action.key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return cleaned || keyLabel;
}

export function groupModulesIntoSections(
  modules: PermissionModule[],
): PermissionSection[] {
  const byKey = new Map(modules.map((module) => [module.key, module]));
  const used = new Set<string>();

  const sections: PermissionSection[] = PERMISSION_SECTIONS.map((section) => {
    const sectionModules = section.modules
      .map((name) => {
        const module = byKey.get(name);
        if (!module) return null;
        used.add(name);
        return {
          ...module,
          title: getModuleDisplayName(module.key),
        };
      })
      .filter(Boolean) as PermissionModule[];

    return {
      key: section.key,
      title: section.title,
      description: section.description,
      modules: sectionModules,
    };
  }).filter((section) => section.modules.length > 0);

  const leftover = modules
    .filter((module) => !used.has(module.key))
    .map((module) => ({
      ...module,
      title: getModuleDisplayName(module.key),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (leftover.length > 0) {
    sections.push({
      key: "other",
      title: "Other",
      description: "Additional permissions",
      modules: leftover,
    });
  }

  return sections;
}
