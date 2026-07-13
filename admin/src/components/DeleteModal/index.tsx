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
  /** Parent wraps id selection, e.g. `() => handleDeleteTrigger(item.id)` */
  handleDeleteTrigger: () => void;
  handleConfirmDelete: () => void;
  compact?: boolean;
  /** Row id for this trigger — pass with `activeId` when many rows share one `open` state */
  itemId?: number | string | null;
  /** Currently selected delete id from the parent */
  activeId?: number | string | null;
};

export default function DeleteModal({
  open,
  setOpen,
  handleDeleteTrigger,
  handleConfirmDelete,
  compact = false,
  itemId,
  activeId,
}: DeleteModalProps) {
  const translate = useTranslation();

  const isOpen =
    itemId != null && activeId != null
      ? open && String(itemId) === String(activeId)
      : open;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          title="Delete"
          className={
            compact
              ? "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
              : "inline-flex cursor-pointer items-center"
          }
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTrigger();
          }}
        >
          <TbTrashXFilled
            size={compact ? 16 : 22}
            className={compact ? undefined : "text-red-500"}
          />
        </button>
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
            onClick={() => setOpen(false)}
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
