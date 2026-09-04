import React from "react";
import { useAppSelector } from "@/redux/store/hooks";
import { checkAccess } from "@/utils/accessHelper";

interface ModuleGuardProps {
  module: string;
  action?: string;
  children: React.ReactNode;
}

/**
 * Fail-closed route gate: require a module action (default "view").
 * Super Admin is handled inside checkAccess.
 */
export function ModuleGuard({
  module,
  action = "view",
  children,
}: ModuleGuardProps) {
  const roleId = useAppSelector((s) => s.auth.roleId);
  const roleType = useAppSelector((s) => s.auth.roleType);
  const clientAccess = useAppSelector((s) => s.auth.clientAccess);
  const token = useAppSelector((s) => s.auth.token);

  const isSuperAdmin = roleId === 1 || roleType === "Super Admin";
  const accessKeys = checkAccess(module);
  const allowed = isSuperAdmin || accessKeys.includes(action);

  // Access still hydrating for a non–super-admin session.
  if (
    token &&
    !isSuperAdmin &&
    clientAccess.length === 0 &&
    !allowed
  ) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--serve-muted,#a3a3ac)]">
        Checking access…
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--serve-muted,#a3a3ac)]">
        <p>You do not have access to this page.</p>
      </main>
    );
  }

  return children;
}
