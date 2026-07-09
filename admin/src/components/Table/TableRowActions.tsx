import { ReactNode } from "react";

export default function TableRowActions({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-fit items-center justify-center gap-2">
      {children}
    </div>
  );
}
