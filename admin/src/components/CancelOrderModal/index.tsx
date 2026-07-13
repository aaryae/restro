import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import React, { useState } from "react";
import useTranslation from "@/locale/useTranslation";
import { AlertTriangle, X } from "lucide-react";

type CancelOrderProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleCancelTrigger: () => void;
  handleConfirmCancel: (remarks: string) => void;
  itemId?: number | string | null;
  activeId?: number | string | null;
};

export default function CancelOrderModal({
  open,
  setOpen,
  handleCancelTrigger,
  handleConfirmCancel,
  itemId,
  activeId,
}: CancelOrderProps) {
  const translate = useTranslation();
  const [remarks, setRemarks] = useState("");
  const canConfirm = remarks.trim().length > 0;

  const isOpen =
    itemId != null && activeId != null
      ? open && String(itemId) === String(activeId)
      : open;

  const handleDismiss = () => {
    setRemarks("");
    setOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          setRemarks("");
          setOpen(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
          title="Cancel order"
          onClick={(e) => {
            e.stopPropagation();
            handleCancelTrigger();
          }}
        >
          <X size={16} strokeWidth={2.25} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[420px] gap-5 p-6 sm:p-7">
        <DialogHeader className="items-center space-y-3 sm:items-center sm:text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={22} strokeWidth={2} />
          </span>
          <DialogTitle className="text-base sm:text-center">
            {translate("Do you want to delete this Item?")}
          </DialogTitle>
          <DialogDescription className="sm:text-center">
            Please add a short remark explaining why this order is being
            cancelled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 text-left">
          <label
            htmlFor={`cancellation-remarks-${itemId ?? "order"}`}
            className="text-xs font-medium text-slate-600"
          >
            Cancellation remarks
          </label>
          <textarea
            id={`cancellation-remarks-${itemId ?? "order"}`}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            placeholder="Enter cancellation remarks"
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primaryColor/40 focus:ring-2 focus:ring-primaryColor/15"
          />
        </div>

        <DialogFooter className="sm:justify-center">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={handleDismiss}
          >
            {translate("Cancel")}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            className={`inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium text-white transition ${
              canConfirm
                ? "bg-rose-600 hover:bg-rose-700"
                : "cursor-not-allowed bg-rose-300"
            }`}
            onClick={() => handleConfirmCancel(remarks)}
          >
            {translate("Delete")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
