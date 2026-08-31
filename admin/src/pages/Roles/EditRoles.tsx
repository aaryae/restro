import {
  useGetRoleByIdQuery,
  useListAllRolesQuery,
  useUpdateRoleMutation,
} from "@/redux/services/role";
import { useEffect, useMemo, useState } from "react";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Button from "@/components/Button";
import useTranslation from "@/locale/useTranslation";
import { ChevronDown, ChevronRight, Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDisplayTitle,
  getPrerequisiteLabels,
  groupPermissionsByCategory,
  isPermissionEnabled,
  normalizeSelectedPermissions,
  PermissionAction,
  PermissionModule,
  toggleAllInModule,
  togglePermission,
} from "@/utils/permissionDependencies";

type ResponseItem = {
  list: string;
  id: number;
  title: string;
  key: string;
};

const HIDDEN_ROLE_MODULES = new Set(["Product Variant"]);

function groupRoleMenuActions(response: ResponseItem[]): PermissionModule[] {
  const grouped = response.reduce(
    (acc: Record<string, PermissionModule>, each) => {
      if (HIDDEN_ROLE_MODULES.has(each.list)) return acc;
      if (!acc[each.list]) {
        acc[each.list] = {
          key: each.list,
          title: each.list,
          children: [],
        };
      }
      acc[each.list].children.push({
        id: each.id,
        title: each.title,
        key: each.key,
        list: each.list,
      });
      return acc;
    },
    {},
  );

  return Object.values(grouped).sort((a, b) => a.title.localeCompare(b.title));
}

const CATEGORY_LABELS = {
  view: "View access",
  create: "Create",
  modify: "Modify & delete",
  other: "Advanced",
} as const;

export default function EditRoles({
  id,
  setIsOpen,
}: {
  id: number | null;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const translate = useTranslation();
  const [search, setSearch] = useState("");

  const { data: roleMenuAction, isSuccess: success } = useListAllRolesQuery("");
  const { data: allowableRoles, isSuccess: allowableRolesSuccess } =
    useGetRoleByIdQuery(id, {
      skip: id === null,
    });
  const [updateRole, { isLoading: saving }] = useUpdateRoleMutation();

  const [accessRoles, setAccessRoles] = useState<number[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    {},
  );

  const modules: PermissionModule[] = useMemo(() => {
    if (success && roleMenuAction?.data?.data) {
      return groupRoleMenuActions(roleMenuAction.data.data as ResponseItem[]);
    }
    return [];
  }, [success, roleMenuAction]);

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return modules;

    return modules
      .map((module) => ({
        ...module,
        children: module.children.filter(
          (action) =>
            action.title.toLowerCase().includes(query) ||
            action.key.toLowerCase().includes(query) ||
            module.title.toLowerCase().includes(query),
        ),
      }))
      .filter((module) => module.children.length > 0);
  }, [modules, search]);

  useEffect(() => {
    if (allowableRolesSuccess) {
      const allowedRoles =
        allowableRoles?.data?.role_actions?.map(
          (each: { role_menu_action: { id: number } }) =>
            each.role_menu_action.id,
        ) ?? [];
      const visibleIds = new Set(
        modules.flatMap((module) => module.children.map((action) => action.id)),
      );
      setAccessRoles(
        normalizeSelectedPermissions(modules, allowedRoles).filter((roleId) =>
          visibleIds.has(roleId),
        ),
      );
    }
  }, [id, allowableRoles, allowableRolesSuccess, modules]);

  const totalPermissions = modules.reduce(
    (count, module) => count + module.children.length,
    0,
  );

  const handleCheckboxChange = (module: PermissionModule, actionId: number) => {
    const checked = !accessRoles.includes(actionId);
    setAccessRoles((prev) =>
      togglePermission(module.children, prev, actionId, checked),
    );
  };

  const handleSelectAll = (module: PermissionModule, checked: boolean) => {
    setAccessRoles((prev) => toggleAllInModule(module.children, prev, checked));
  };

  const toggleModule = (moduleKey: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const allExpanded =
    filteredModules.length > 0 &&
    filteredModules.every((module) => expandedModules[module.key]);

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    filteredModules.forEach((module) => {
      next[module.key] = !allExpanded;
    });
    setExpandedModules(next);
  };

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const handleSubmit = async () => {
    const normalized = normalizeSelectedPermissions(modules, accessRoles);
    const roleData = allowableRoles?.data;

    const body = {
      title: String(roleData?.title ?? ""),
      description: String(roleData?.description ?? ""),
      roleType: roleData?.roleType,
      role_actions: normalized.map((each) => ({
        roleMenuActionId: each,
      })),
    };

    try {
      const response = await updateRole({ body, id }).unwrap();
      handleResponse({
        res: response,
        onSuccess: handleCloseDrawer,
      });
    } catch (error) {
      handleError({ error });
    }
  };

  const roleTitle = allowableRoles?.data?.title ?? translate("Role");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-primaryColor/[0.03] px-5 pb-5 pt-1 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor shadow-sm ring-1 ring-primaryColor/10">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {translate("Edit Role")}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {roleTitle} · {accessRoles.length} of {totalPermissions}{" "}
              {translate("permissions selected")}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search modules or permissions..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-primaryColor/40 focus:ring-2 focus:ring-primaryColor/15"
            />
          </div>
          <button
            type="button"
            onClick={handleExpandAll}
            disabled={filteredModules.length === 0}
            className="text-sm font-medium text-primaryColor transition hover:text-primaryColor/80 disabled:opacity-50"
          >
            {allExpanded ? translate("Collapse All") : translate("Expand All")}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="space-y-3">
          {filteredModules.map((module) => {
            const selectedCount = module.children.filter((action) =>
              accessRoles.includes(action.id),
            ).length;
            const allSelected =
              module.children.length > 0 &&
              selectedCount === module.children.length;
            const isExpanded = expandedModules[module.key] ?? false;
            const groups = groupPermissionsByCategory(module.children);

            return (
              <div
                key={module.key}
                className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleModule(module.key)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50/80"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{module.title}</p>
                    <p className="text-xs text-slate-500">
                      {selectedCount} / {module.children.length} selected
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      selectedCount > 0
                        ? "bg-primaryColor/10 text-primaryColor"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {selectedCount > 0 ? "Granted" : "None"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-4">
                    <label className="mb-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) =>
                          handleSelectAll(module, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-primaryColor focus:ring-primaryColor/30"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {translate("Select all in this module")}
                      </span>
                    </label>

                    <div className="space-y-4">
                      {(
                        Object.keys(CATEGORY_LABELS) as Array<
                          keyof typeof CATEGORY_LABELS
                        >
                      ).map((category) => {
                        const items = groups[category];
                        if (items.length === 0) return null;

                        return (
                          <div key={category}>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {CATEGORY_LABELS[category]}
                            </p>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {items.map((action) => {
                                const checked = accessRoles.includes(action.id);
                                const enabled = isPermissionEnabled(
                                  action,
                                  module.children,
                                  accessRoles,
                                );
                                const prerequisites = getPrerequisiteLabels(
                                  action,
                                  module.children,
                                );

                                return (
                                  <label
                                    key={action.id}
                                    className={cn(
                                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition",
                                      checked
                                        ? "border-primaryColor/25 bg-primaryColor/[0.04]"
                                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                                      !enabled && !checked && "opacity-60",
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={!enabled && !checked}
                                      onChange={() =>
                                        handleCheckboxChange(module, action.id)
                                      }
                                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primaryColor focus:ring-primaryColor/30 disabled:cursor-not-allowed"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-slate-800">
                                        {getDisplayTitle(action, module.children)}
                                      </p>
                                      {!enabled && !checked && prerequisites.length > 0 && (
                                        <p className="mt-0.5 text-xs text-amber-700">
                                          Requires: {prerequisites.join(", ")}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredModules.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-500">
              {translate("No permissions match your search.")}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
        <div className="flex justify-end">
          <Button
            className="submit-button min-h-11 w-full min-w-[8rem] sm:w-auto"
            handleClick={handleSubmit}
            disabled={saving || accessRoles.length === 0}
          >
            <div className="flex items-center justify-center">
              {saving ? translate("Saving...") : translate("Save Permissions")}
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
