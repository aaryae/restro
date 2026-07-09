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
    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={toggleCollapse}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-slate-50/80"
      >
        <h3 className="text-[13px] font-semibold text-slate-700">{title}</h3>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "max-h-0 opacity-0 overflow-hidden"
            : "max-h-[2000px] border-t border-slate-100 opacity-100"
        }`}
      >
        <div className="p-4 pt-3">{children}</div>
      </div>
    </div>
  );
}
