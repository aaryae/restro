import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface DialogProps {
  buttonTitle?: string | React.ReactNode;
  title: string;
  titleDescription?: string;
  children: React.ReactNode;
  contentClassName?: string;
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CustomDialog({
  buttonTitle,
  title,
  titleDescription,
  children,
  contentClassName,
  dialogOpen,
  setDialogOpen,
}: DialogProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div>{buttonTitle} </div>
      </DialogTrigger>
      <DialogContent
        className={
          contentClassName
            ? contentClassName
            : "w-[95vw] max-w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-4 sm:p-6 mx-auto my-4 sm:my-8 max-h-[90vh] overflow-y-auto"
        }
        onInteractOutside={(e) => {
          // Prevent dialog from closing when clicking on the overlay
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {titleDescription && (
            <DialogDescription>{titleDescription}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
