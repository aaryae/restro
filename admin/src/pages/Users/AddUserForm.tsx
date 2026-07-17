import { LuUser, LuUserPlus } from "react-icons/lu";
import { GoLock } from "react-icons/go";
import { useEffect, useState } from "react";
import UserForm from "./UserForm";
import Security from "./Security";
import useTranslation from "@/locale/useTranslation";
import { useGetUserByIdQuery } from "@/redux/services/authentication";
import { cn } from "@/lib/utils";

export default function AddUserForm({
  isOpen,
  editId,
  setIsOpen,
}: {
  isOpen: boolean;
  editId: number | null;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const translate = useTranslation();
  const [tabSection, setTabSection] = useState<string>("profile");

  const { data: userData } = useGetUserByIdQuery(editId, {
    skip: editId === null,
  });

  useEffect(() => {
    if (!isOpen) {
      setTabSection("profile");
    }
  }, [isOpen]);

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const handleMediaOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const handleTabChange = (tab: string) => {
    if (editId === null) return;
    setTabSection(tab);
  };

  const isEditing = editId !== null;
  const displayName = isEditing
    ? [userData?.data?.firstName, userData?.data?.lastName]
        .filter(Boolean)
        .join(" ") ||
      userData?.data?.username ||
      translate("User")
    : null;

  const tabs = [
    {
      id: "profile",
      label: translate("Profile"),
      icon: LuUser,
      disabled: false,
    },
    {
      id: "security",
      label: translate("Security"),
      icon: GoLock,
      disabled: !isEditing,
    },
  ] as const;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-primaryColor/[0.03] px-5 pb-5 pt-1 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor shadow-sm ring-1 ring-primaryColor/10">
            {isEditing ? (
              <LuUser className="h-5 w-5" />
            ) : (
              <LuUserPlus className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {isEditing ? translate("Edit User") : translate("Add User")}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isEditing
                ? displayName
                  ? `${displayName}${userData?.data?.email ? ` · ${userData.data.email}` : ""}`
                  : translate("Update account details and permissions.")
                : translate("Create a new staff account with role access.")}
            </p>
          </div>
        </div>

        <div className="mt-5 inline-flex w-full rounded-xl border border-slate-200/90 bg-slate-100/70 p-1 sm:w-auto">
          {tabs.map(({ id, label, icon: Icon, disabled }) => (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => handleTabChange(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all sm:flex-none sm:px-5",
                tabSection === id
                  ? "bg-white text-primaryColor shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900",
                disabled && "cursor-not-allowed opacity-45 hover:text-slate-600",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {tabSection === "profile" && (
          <UserForm
            editId={editId}
            handleCloseDrawer={handleCloseDrawer}
            isOpen={isOpen}
            onMediaOpenChange={handleMediaOpenChange}
          />
        )}
        {tabSection === "security" && isEditing && (
          <Security
            isOpen={isOpen}
            editId={editId}
            handleCloseDrawer={handleCloseDrawer}
          />
        )}
      </div>
    </div>
  );
}
