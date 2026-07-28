import { useState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import BasicInfo from "./BasicInfo";
import AccountManagement from "./AccountManagement";
import useTranslation from "@/locale/useTranslation";

const tabs = [
  {
    id: "BasicInfo",
    label: "Basic Information",
    description: "Name, contact, and photo",
    icon: UserRound,
  },
  {
    id: "AccountManagement",
    label: "Account Management",
    description: "Change your password",
    icon: KeyRound,
  },
] as const;

export default function UserProfile() {
  const translate = useTranslation();
  const [tabSection, setTabSection] = useState<(typeof tabs)[number]["id"]>(
    "BasicInfo",
  );

  return (
    <div className="flex min-w-0 w-full flex-col gap-5 pb-6">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-slate-800 sm:text-xl">
          {translate("Profile")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal details and account security.
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        <nav className="flex min-w-0 w-full shrink-0 gap-2 overflow-x-auto pb-1 lg:w-64 lg:flex-col lg:overflow-visible lg:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tabSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabSection(tab.id)}
                className={`flex min-w-[14rem] flex-1 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition lg:min-w-0 lg:flex-none ${
                  active
                    ? "border-primaryColor/30 bg-primaryColor/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    active
                      ? "bg-primaryColor text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      active ? "text-primaryColor" : "text-slate-800"
                    }`}
                  >
                    {translate(tab.label)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {translate(tab.description)}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {tabSection === "BasicInfo" && <BasicInfo />}
          {tabSection === "AccountManagement" && <AccountManagement />}
        </section>
      </div>
    </div>
  );
}
