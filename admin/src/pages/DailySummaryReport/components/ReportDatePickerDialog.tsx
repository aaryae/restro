import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./report-datepicker.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/utils/formatDate";

interface ReportDatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onConfirm: (date: Date) => void;
  title?: string;
  description?: string;
}

export function ReportDatePickerDialog({
  open,
  onOpenChange,
  selectedDate,
  onConfirm,
  title = "Choose a date",
  description = "Select the day you want to review.",
}: ReportDatePickerDialogProps) {
  const [draft, setDraft] = useState(selectedDate);

  useEffect(() => {
    if (open) setDraft(selectedDate);
  }, [open, selectedDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[22rem] gap-0 p-0 sm:max-w-[22rem]">
        <DialogHeader className="border-b border-slate-100 px-5 pb-4 pt-5 text-left">
          <DialogTitle className="pr-8 text-base">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="report-datepicker flex justify-center px-4 py-4">
          <DatePicker
            selected={draft}
            onChange={(date: Date | null) => {
              if (date) setDraft(date);
            }}
            inline
            maxDate={new Date()}
            calendarClassName="border-0 shadow-none"
          />
        </div>

        <DialogFooter className="border-t border-slate-100 px-5 py-4 sm:justify-between">
          <p className="mb-2 text-left text-[13px] text-slate-500 sm:mb-0">
            {formatDate(draft)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(draft);
                onOpenChange(false);
              }}
              className="h-9 rounded-lg bg-primaryColor px-3.5 text-[13px] font-medium text-white transition hover:opacity-90"
            >
              Apply
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
