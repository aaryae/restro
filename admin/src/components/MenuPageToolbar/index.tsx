import useTranslation from "@/locale/useTranslation";
import { Plus, RefreshCw, Search } from "lucide-react";
import { ReactNode, useState } from "react";

interface MenuPageToolbarProps {
  title?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  filters?: ReactNode;
  extraActions?: ReactNode;
  hasAddButton?: boolean;
  newButtonText?: ReactNode;
  handleNewButton?: () => void;
  handleReloadButton?: () => void;
  subText?: string;
}

export default function MenuPageToolbar({
  title,
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
    if (searchValue) {
      onSearchChange?.("");
    }
    handleReloadButton?.();
    window.setTimeout(() => setIsRotating(false), 1000);
  };

  const hasTools = showSearch || Boolean(filters);

  return (
    <div className="mb-4">
      <div className="rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h1 className="text-[1.25rem] leading-tight">{translate(title)}</h1>
            ) : null}
            {subText ? (
              <p
                className={`text-[13px] text-[var(--serve-muted)] ${title ? "mt-1" : ""}`}
              >
                {subText}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {extraActions}
            {hasAddButton && (
              <button
                type="button"
                onClick={handleNewButton}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--primary-color)] bg-[var(--primary-color)] px-3 text-[13px] font-medium text-[var(--primary-fg)] transition hover:opacity-90"
              >
                <Plus size={15} strokeWidth={2.25} />
                {newButtonText}
              </button>
            )}
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 text-[13px] font-medium text-[var(--serve-muted)] transition hover:border-[color-mix(in_srgb,var(--serve-accent)_24%,var(--serve-border))] hover:bg-[var(--serve-surface)] hover:text-[var(--serve-fg)]"
            >
              <RefreshCw className={isRotating ? "rotate-animation" : ""} />
              {translate("Reload")}
            </button>
          </div>
        </div>

        {hasTools ? (
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            {showSearch ? (
              <div className="relative min-w-0 flex-1 sm:max-w-sm lg:max-w-md">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--serve-muted)]"
                />
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="serve-search-input h-9 w-full rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] pl-9 pr-3 text-[13px] text-[var(--serve-fg)] outline-none transition focus:border-[color-mix(in_srgb,var(--serve-accent)_40%,var(--serve-border))] focus:bg-[var(--serve-surface)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--serve-accent)_15%,transparent)]"
                />
              </div>
            ) : null}
            {filters}
          </div>
        ) : null}
      </div>
    </div>
  );
}
