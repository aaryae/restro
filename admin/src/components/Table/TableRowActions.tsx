import { ReactNode } from "react";

export default function TableRowActions({ children }: { children: ReactNode }) {
  return (
    <div
      className="table-row-actions relative z-10 mx-auto flex w-max max-w-none items-center justify-center gap-2"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
