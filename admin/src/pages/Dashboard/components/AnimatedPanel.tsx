import { ReactNode } from "react";
import cn from "clsx";

type AnimatedPanelProps = {
  panelKey: string;
  children: ReactNode;
  className?: string;
  variant?: "page" | "chart";
};

export default function AnimatedPanel({
  panelKey,
  children,
  className,
  variant = "page",
}: AnimatedPanelProps) {
  return (
    <div
      key={panelKey}
      className={cn(
        variant === "chart" ? "dashboard-chart-enter" : "dashboard-panel-enter",
        className,
      )}
    >
      {children}
    </div>
  );
}
