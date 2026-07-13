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
          contentClassName,
        )}
        onInteractOutside={(e) => {
          if (!closeOnOutsideClick) e.preventDefault();
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
