import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PageFilterWrapper({
  title,
  children,
  defaultCollapsed = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] shadow-sm">
      <button
        type="button"
        onClick={toggleCollapse}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-[var(--serve-surface-2)]"
      >
        <h3 className="text-[13px] font-semibold text-[var(--serve-fg)]">
          {title}
        </h3>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--serve-muted)]" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-[var(--serve-muted)]" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "max-h-0 overflow-hidden opacity-0"
            : "max-h-[2000px] border-t border-[var(--serve-border)] opacity-100"
        }`}
      >
        <div className="p-4 pt-3">{children}</div>
      </div>
    </div>
  );
}
