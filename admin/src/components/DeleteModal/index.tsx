import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import React from "react";
import useTranslation from "@/locale/useTranslation";

type DeleteModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Parent wraps id selection, e.g. `() => handleDeleteTrigger(item.id)` */
  handleDeleteTrigger: () => void;
  handleConfirmDelete: () => void;
  compact?: boolean;
  /** When true, trigger is non-interactive (e.g. locked rows). Default false. */
  disabled?: boolean;
  /** Row id for this trigger — pass with `activeId` when many rows share one `open` state */
  itemId?: number | string | null;
  /** Currently selected delete id from the parent */
  activeId?: number | string | null;
  title?: string;
  description?: string;
  confirmLabel?: string;
};

export default function DeleteModal({
  open,
  setOpen,
  handleDeleteTrigger,
  handleConfirmDelete,
  compact = false,
  disabled = false,
  itemId,
  activeId,
  title,
  description,
  confirmLabel,
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
          title={disabled ? "Delete unavailable" : "Delete"}
          disabled={disabled}
          aria-disabled={disabled}
          data-variant="danger"
          className={
            compact
              ? `inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                  disabled
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-rose-300 bg-rose-100 text-rose-700 hover:bg-rose-200"
                }`
              : `inline-flex items-center ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`
          }
          onClick={(e) => {
            e.stopPropagation();
            if (disabled) return;
            handleDeleteTrigger();
          }}
        >
          <Trash2
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
            {title
              ? translate(title)
              : translate("Do you want to delete this Item?")}
          </DialogTitle>
          <DialogDescription className="sm:text-center">
            {description
              ? translate(description)
              : translate(
                  "Are you sure you want to delete this item? You can restore it later from Settings → Recently Deleted (kept for 30 days).",
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
            {confirmLabel ? translate(confirmLabel) : translate("Delete")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
