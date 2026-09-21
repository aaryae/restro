import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { cn } from "@/lib/utils";

interface DialogProps {
  buttonTitle?: string | React.ReactNode;
  title: string;
  titleDescription?: string;
  children: React.ReactNode;
  contentClassName?: string;
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeOnOutsideClick?: boolean;
  /** Stack above another open dialog (e.g. form inside EntityFormDialog). */
  nested?: boolean;
}

export default function CustomDialog({
  buttonTitle,
  title,
  titleDescription,
  children,
  contentClassName,
  dialogOpen,
  setDialogOpen,
  closeOnOutsideClick = false,
  nested = false,
}: DialogProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {buttonTitle ? (
        <DialogTrigger asChild>
          <div>{buttonTitle}</div>
        </DialogTrigger>
      ) : null}
      <DialogContent
        className={cn(
          "max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto p-6 sm:p-7",
          nested && "z-[110]",
          contentClassName,
        )}
        overlayClassName={nested ? "z-[105]" : undefined}
        onInteractOutside={(e) => {
          if (!closeOnOutsideClick) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (nested) e.stopPropagation();
        }}
        onFocusOutside={(e) => {
          if (nested) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {titleDescription ? (
            <DialogDescription>{titleDescription}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
