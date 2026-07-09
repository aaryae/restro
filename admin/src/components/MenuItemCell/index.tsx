import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import { ReactNode } from "react";

interface MenuItemCellProps {
  name: string;
  imageUrl?: string | null;
  badge?: ReactNode;
}

export default function MenuItemCell({
  name,
  imageUrl,
  badge,
}: MenuItemCellProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-left">
      <img
        src={imageUrl || DishPlaceHolder}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm sm:h-16 sm:w-16"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        {badge}
      </div>
    </div>
  );
}
