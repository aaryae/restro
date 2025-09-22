import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "../ui/dialog";
import React, { useState } from "react";
import useTranslation from "@/locale/useTranslation";
import { Plus } from "lucide-react";

type CacnelOrderProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleCancelTrigger: (id: number, isDeleted?: boolean) => void;
  handleConfirmCancel: (remarks: string) => void;
};

export default function CancelOrderModal({
  open,
  setOpen,
  handleCancelTrigger,
  handleConfirmCancel,
}: CacnelOrderProps) {
  const translate = useTranslation();

  const handleCancelButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setRemarks("");
    setOpen(false);
  };
  const [remarks, setRemarks] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={handleCancelTrigger}>
        <Plus
          onClick={handleCancelButton}
          size={20}
          className="rotate-45 text-red-400 cursor-pointer "
        />
      </DialogTrigger>
      <DialogContent className="w-[25rem] p-[3rem] md:w-fit">
        <DialogHeader>
          <DialogTitle>
            <span className="text-[1rem] font-[500] text-red-500 text-center">
              {translate("Do you want to delete this Item?")}
            </span>
          </DialogTitle>
          <DialogDescription>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="bg-white text-black border border-gray-300 p-2 w-full mt-4"
              placeholder="Enter Cancellation Remarks"
            ></textarea>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex justify-center gap-[2rem] w-full mt-[1rem]">
            <button
              disabled={remarks.trim().length <= 0}
              className={`py-[0.7rem] px-[1.5rem] h-fit rounded-[6px] flex items-center ${remarks.trim().length <= 0 ? "bg-red-200" : "bg-red-500"}`}
              onClick={() => handleConfirmCancel(remarks)}
            >
              <span className="font-[400] text-[1rem] text-white ">
                {translate("Delete")}
              </span>
            </button>
            <button
              className="bg-gray-400 h-fit py-[0.7rem] px-[1.5rem] rounded-[6px] flex items-center"
              onClick={handleCancelButton}
            >
              <span className="font-[400] text-[1rem] text-white ">
                {translate("Cancel")}
              </span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
