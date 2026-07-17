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

function isListViewKey(key) {
  return key === LIST_VIEW_KEY;
}

function isDetailViewKey(key) {
  if (isListViewKey(key)) return false;
  if (DETAIL_VIEW_KEYS.has(key)) return true;
  return key.startsWith("view-");
}

function requiresListView(key) {
  return !isListViewKey(key);
}

function requiresDetailView(key) {
  if (key === "change-password" || key === "add") return false;
  if (DETAIL_REQUIRED_KEYS.has(key)) return true;
  return key.startsWith("edit-");
}

function getListViewAction(actions) {
  return actions.find((action) => isListViewKey(action.key));
}

function getDetailViewActions(actions) {
  return actions.filter((action) => isDetailViewKey(action.key));
}

function normalizeRoleActionIds(allActions, selectedIds) {
  const selectedSet = new Set(selectedIds);
  const actionsByList = allActions.reduce((acc, action) => {
    if (!acc[action.list]) acc[action.list] = [];
    acc[action.list].push(action);
    return acc;
  }, {});

  Object.values(actionsByList).forEach((moduleActions) => {
    const selectedInModule = moduleActions.filter((action) =>
      selectedSet.has(action.id),
    );
    if (selectedInModule.length === 0) return;

    const listView = getListViewAction(moduleActions);
    const hasListView = listView ? selectedSet.has(listView.id) : true;

    if (!hasListView) {
      moduleActions.forEach((action) => {
        if (requiresListView(action.key)) selectedSet.delete(action.id);
      });
    }

    const detailViews = getDetailViewActions(moduleActions);
    const hasDetailView =
      detailViews.length === 0 ||
      detailViews.some((detail) => selectedSet.has(detail.id));

    if (!hasDetailView) {
      moduleActions.forEach((action) => {
        if (requiresDetailView(action.key)) selectedSet.delete(action.id);
      });
    }
  });

  return Array.from(selectedSet);
}

module.exports = {
  normalizeRoleActionIds,
};
