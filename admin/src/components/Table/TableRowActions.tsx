import { ReactNode } from "react";

export default function TableRowActions({ children }: { children: ReactNode }) {
  return (
    <div
      className="table-row-actions relative z-10 mx-auto flex w-fit items-center justify-center gap-1.5"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
