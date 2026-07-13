import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { TbTrashXFilled } from "react-icons/tb";
import { AlertTriangle } from "lucide-react";
import React from "react";
import useTranslation from "@/locale/useTranslation";

type DeleteModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteTrigger: (id: number, isDeleted?: boolean) => void;
  handleConfirmDelete: () => void;
  compact?: boolean;
};

export default function DeleteModal({
  open,
  setOpen,
  handleDeleteTrigger,
  handleConfirmDelete,
  compact = false,
}: DeleteModalProps) {
  const translate = useTranslation();

  const handleCancelButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={handleDeleteTrigger} asChild>
        {compact ? (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
            title="Delete"
          >
            <TbTrashXFilled size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center"
            title="Delete"
          >
            <TbTrashXFilled size={22} className="text-red-500" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[400px] gap-5 p-6 sm:p-7">
        <DialogHeader className="items-center space-y-3 sm:items-center sm:text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={22} strokeWidth={2} />
          </span>
          <DialogTitle className="text-base sm:text-center">
            {translate("Do you want to delete this Item?")}
          </DialogTitle>
          <DialogDescription className="sm:text-center">
            {translate(
              "Are you sure you want to delete this item? This action cannot be undone.",
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={handleCancelButton}
          >
            {translate("Cancel")}
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-rose-600 px-5 text-sm font-medium text-white transition hover:bg-rose-700"
            onClick={handleConfirmDelete}
          >
            {translate("Delete")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
