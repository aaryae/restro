"use strict";

/**
 * Platform panel RBAC — separate from cafe POS Super Admin / Admin.
 * Roles: owner (full) | operator (checkbox permissions).
 */

const PLATFORM_ROLES = Object.freeze(["owner", "operator"]);

const PLATFORM_ROLE_LABELS = Object.freeze({
  owner: "Owner",
  operator: "Operator",
});

/** Assignable checkboxes when creating/editing an operator. */
const OPERATOR_PERMISSIONS = Object.freeze([
  "dashboard.view",
  "cafes.section",
  "cafes.create",
  "cafes.view",
  "cafes.activate",
  "cafes.extend",
  "cafes.suspend",
  "cafes.impersonate",
  "audit.read",
]);

const OPERATOR_PERMISSION_META = Object.freeze([
  { key: "dashboard.view", label: "Show Dashboard" },
  { key: "cafes.section", label: "Show Cafes section" },
  { key: "cafes.create", label: "Create cafe" },
  { key: "cafes.view", label: "View cafe (table action)" },
  { key: "cafes.activate", label: "Activate cafe" },
  { key: "cafes.extend", label: "Extend trial" },
  { key: "cafes.suspend", label: "Suspend cafe" },
  { key: "cafes.impersonate", label: "Open POS" },
  { key: "audit.read", label: "Show Audit logs" },
]);

const ALL_PERMISSIONS = Object.freeze([
  "users.manage",
  ...OPERATOR_PERMISSIONS,
]);

function normalizePlatformRole(role) {
  const value = String(role || "")
    .trim()
    .toLowerCase();
  if (value === "viewer") return "operator"; // legacy
  return PLATFORM_ROLES.includes(value) ? value : null;
}

function sanitizePermissions(list) {
  if (!Array.isArray(list)) return [];
  const allowed = new Set(OPERATOR_PERMISSIONS);
  return [...new Set(list.map(String).filter((p) => allowed.has(p)))];
}

function permissionsForUser(user) {
  const role = normalizePlatformRole(user?.platformRole) || "operator";
  if (role === "owner") return [...ALL_PERMISSIONS];
  return sanitizePermissions(user?.permissions);
}

function userHasPermission(user, permission) {
  return permissionsForUser(user).includes(permission);
}

/** @deprecated use permissionsForUser — kept for older call sites during migrate */
function permissionsForRole(role) {
  if (normalizePlatformRole(role) === "owner") return [...ALL_PERMISSIONS];
  return [];
}

function roleHasPermission(role, permission) {
  return permissionsForRole(role).includes(permission);
}

module.exports = {
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  OPERATOR_PERMISSIONS,
  OPERATOR_PERMISSION_META,
  ALL_PERMISSIONS,
  PLATFORM_PERMISSIONS: ALL_PERMISSIONS,
  normalizePlatformRole,
  sanitizePermissions,
  permissionsForUser,
  userHasPermission,
  permissionsForRole,
  roleHasPermission,
};
