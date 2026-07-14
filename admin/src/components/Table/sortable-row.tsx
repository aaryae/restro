import type React from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableRowProps {
  product: any[];
  mergedActionsLayout?: boolean;
}

export function SortableRow({
  product,
  mergedActionsLayout = false,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product[0] });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? "relative" : "static",
  } as React.CSSProperties;

  const cells = product.slice(1);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="text-sm text-slate-700 transition-colors hover:bg-primaryColor/[0.03]"
    >
      <td className="w-10 px-2 py-3 align-middle">
        <button
          type="button"
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      </td>

      {mergedActionsLayout && cells.length === 2 ? (
        <td colSpan={2} className="px-4 py-3 align-middle">
          <div className="flex w-full max-w-2xl items-center justify-between gap-6">
            <div className="min-w-0 text-left">{cells[0]}</div>
            <div className="shrink-0">{cells[1]}</div>
          </div>
        </td>
      ) : (
        cells.map((item, cellIndex) => {
          const isActions = cellIndex === cells.length - 1;
          return (
            <td
              key={cellIndex}
              className={`px-4 py-3 align-middle ${
                isActions
                  ? "whitespace-nowrap pr-6 text-center"
                  : "whitespace-nowrap text-left"
              }`}
            >
              {item}
            </td>
          );
        })
      )}
    </tr>
  );
}
