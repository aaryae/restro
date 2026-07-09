import useTranslation from "@/locale/useTranslation";
import { Plus, Search } from "lucide-react";
import { ReactNode, useState } from "react";
import { IoReload } from "react-icons/io5";

interface MenuPageToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  filters?: ReactNode;
  extraActions?: ReactNode;
  hasAddButton?: boolean;
  newButtonText?: string;
  handleNewButton?: () => void;
  handleReloadButton: () => void;
  subText?: string;
}

export default function MenuPageToolbar({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  showSearch = true,
  filters,
  extraActions,
  hasAddButton = false,
  newButtonText,
  handleNewButton,
  handleReloadButton,
  subText,
}: MenuPageToolbarProps) {
  const translate = useTranslation();
  const [isRotating, setIsRotating] = useState(false);

  const handleReload = () => {
    setIsRotating(true);
    handleReloadButton();
    window.setTimeout(() => setIsRotating(false), 1000);
  };

  return (
    <div className="mb-4 space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {showSearch ? (
              <div className="relative min-w-0 flex-1 sm:max-w-sm lg:max-w-md">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition focus:border-primaryColor/40 focus:bg-white focus:ring-2 focus:ring-primaryColor/15"
                />
              </div>
            ) : null}
            {filters}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {extraActions}
            {hasAddButton && (
              <button
                type="button"
                onClick={handleNewButton}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primaryColor bg-primaryColor px-3 text-[13px] font-medium text-white transition hover:bg-primaryColor/90"
              >
                <Plus size={15} strokeWidth={2.25} />
                {newButtonText}
              </button>
            )}
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
            >
              <IoReload
                size={15}
                className={isRotating ? "rotate-animation" : ""}
              />
              {translate("Reload")}
            </button>
          </div>
        </div>
        {subText ? (
          <p className="mt-2 text-[13px] text-slate-500">{subText}</p>
        ) : null}
      </div>
    </div>
  );
}
