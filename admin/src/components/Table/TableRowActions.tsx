import { ReactNode } from "react";

export default function TableRowActions({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative z-10 mx-auto flex w-fit items-center justify-center gap-2"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
