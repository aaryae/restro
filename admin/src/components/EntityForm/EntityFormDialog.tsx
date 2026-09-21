import { ReactNode, Suspense } from "react";
import CustomDialog from "@/components/Dialog";
import { cn } from "@/lib/utils";

type EntityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Wider dialogs for denser finance forms. Default max-w-2xl. */
  size?: "md" | "lg" | "xl" | "2xl";
  /** When false, outside click won't dismiss (use while a nested dialog is open). */
  closeOnOutsideClick?: boolean;
  children: ReactNode;
};

const sizeClass = {
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
};

/**
 * List-page add/edit shell. Mount children only while open so forms stay lazy.
 */
export function EntityFormDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  closeOnOutsideClick = true,
  children,
}: EntityFormDialogProps) {
  return (
    <CustomDialog
      buttonTitle={null}
      dialogOpen={open}
      setDialogOpen={(next) => {
        const value = typeof next === "function" ? next(open) : next;
        onOpenChange(value);
      }}
      title={title}
      titleDescription={description}
      contentClassName={cn(
        "gap-4 overflow-y-auto p-4 sm:p-5",
        sizeClass[size],
      )}
      closeOnOutsideClick={closeOnOutsideClick}
    >
      {open ? (
        <Suspense
          fallback={
            <div className="space-y-3 py-2" aria-hidden>
              <div className="h-3 w-28 animate-pulse rounded bg-[var(--serve-surface-2)]" />
              <div className="h-10 animate-pulse rounded-[9px] bg-[var(--serve-surface-2)]" />
              <div className="h-10 animate-pulse rounded-[9px] bg-[var(--serve-surface-2)]" />
            </div>
          }
        >
          {children}
        </Suspense>
      ) : null}
    </CustomDialog>
  );
}
