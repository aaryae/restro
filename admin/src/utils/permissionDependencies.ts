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

const LIST_VIEW_KEY = "view";

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
    labels.push(listView.title);
  }

  if (requiresDetailView(action.key)) {
    const detailViews = getDetailViewActions(moduleActions);
    if (detailViews.length > 0) {
      labels.push(detailViews[0].title);
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
  const duplicates = moduleActions.filter((item) => item.title === action.title);
  if (duplicates.length <= 1) return action.title;

  const keyLabel = action.key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return `${action.title} (${keyLabel})`;
}
