import { LayoutGrid, List } from "lucide-react";
import type { ViewType } from "@/pages/Users";

interface ListGridToggleProps {
  viewType: ViewType;
  onChange: (type: ViewType) => void;
}

export default function ListGridToggle({
  viewType,
  onChange,
}: ListGridToggleProps) {
  const btnClass = (active: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
      active
        ? "bg-white text-slate-800 shadow-sm"
        : "text-slate-400 hover:text-slate-600"
    }`;

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50/60 p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={btnClass(viewType === "list")}
        title="List view"
      >
        <List />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={btnClass(viewType === "grid")}
        title="Grid view"
      >
        <LayoutGrid />
      </button>
    </div>
  );
}
