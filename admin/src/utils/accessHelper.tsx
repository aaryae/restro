import { useAppSelector } from "@/redux/store/hooks";

/** Action keys the admin UI commonly gates on. Super Admin always gets these. */
const SUPER_ADMIN_UI_KEYS = [
  "view",
  "view-one",
  "view-single",
  "add",
  "edit",
  "delete",
  "edit-status",
  "edit-default",
  "edit-order",
  "view-total",
  "view-category-summary",
  "view-grouped",
  "view-category-sales-summary",
  "view-product-top-sales",
  "view-order-item",
  "edit-order-item-status",
  "order-checkout",
  "payment-qr-initiate",
  "payment-qr-status",
  "payment-qr-cancel",
  "block",
  "change-password",
  "reset-password",
  "toggle-isActive",
  "change-name",
  "get-by-user-id",
] as const;

function isSuperAdminUser(roleId: number | null, roleType: string) {
  return roleId === 1 || roleType === "Super Admin";
}

function checkAccess(module: string) {
  const access = useAppSelector((state) => state.auth.clientAccess);
  const roleId = useAppSelector((state) => state.auth.roleId);
  const roleType = useAppSelector((state) => state.auth.roleType);

  const moduleAccess = access
    .filter((each) => each.list === module)
    .map((each) => each.key);

  if (isSuperAdminUser(roleId, roleType)) {
    return Array.from(new Set([...moduleAccess, ...SUPER_ADMIN_UI_KEYS]));
  }

  return moduleAccess;
}

function checkViewAccessList() {
  const access = useAppSelector((state) => state.auth.clientAccess);
  const roleId = useAppSelector((state) => state.auth.roleId);
  const roleType = useAppSelector((state) => state.auth.roleType);

  const viewAccessList = access
    .filter((each) => each.key === "view")
    .map((each) => each.list);

  if (isSuperAdminUser(roleId, roleType)) {
    // Keep every module Super Admin already has, plus any list seen in clientAccess
    return Array.from(
      new Set([...viewAccessList, ...access.map((each) => each.list)]),
    );
  }

  return viewAccessList;
}

export { checkAccess, checkViewAccessList, isSuperAdminUser };
