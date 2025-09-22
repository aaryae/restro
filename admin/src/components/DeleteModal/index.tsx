import { DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "../ui/dialog";
import { TbTrashXFilled } from "react-icons/tb";
import React from "react";
import useTranslation from "@/locale/useTranslation";

type DeleteModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteTrigger: (id: number, isDeleted?: boolean) => void;
  handleConfirmDelete: () => void;
};

export default function DeleteModal({
  open,
  setOpen,
  handleDeleteTrigger,
  handleConfirmDelete,
}: DeleteModalProps) {
  const translate = useTranslation();

  const handleCancelButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger onClick={handleDeleteTrigger}>
        <TbTrashXFilled size={22} className="text-red-500 cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="w-[25rem] p-[3rem] md:w-fit">
        <DialogHeader>
          <DialogTitle>
            <span className="text-[1rem] font-[500] text-red-500 text-center">
              {translate("Do you want to delete this Item?")}
            </span>
          </DialogTitle>
          {/* <DialogDescription>
            <span className=" font-[400] text-[0.75rem]">
              {translate(
                "Are you sure you want to delete this item? This action cannot be undone."
              )}
            </span>
          </DialogDescription> */}
        </DialogHeader>
        <DialogFooter>
          <div className="flex justify-center gap-[2rem] w-full mt-[1rem]">
            <button
              className="bg-red-500 py-[0.7rem] px-[1.5rem] h-fit rounded-[6px] flex items-center"
              onClick={handleConfirmDelete}
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
