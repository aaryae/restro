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
      className="transition-colors"
    >
      <td className="w-10 align-middle">
        <button
          type="button"
          className="flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-md text-[var(--serve-muted)] transition hover:bg-[var(--serve-surface-2)] hover:text-[var(--serve-fg)] active:cursor-grabbing"
          style={{ touchAction: "none" }}
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
      </td>

      {mergedActionsLayout && cells.length === 2 ? (
        <td colSpan={2} className="align-middle">
          <div className="flex w-full max-w-2xl items-center justify-between gap-6">
            <div className="min-w-0 text-left">{cells[0]}</div>
            <div className="shrink-0">{cells[1]}</div>
          </div>
        </td>
      ) : (
        cells.map((item, cellIndex) => (
          <td
            key={cellIndex}
            className={
              cellIndex === cells.length - 1 ? "text-center" : undefined
            }
          >
            {item}
          </td>
        ))
      )}
    </tr>
  );
}
