import { FaTrash, FaUserPlus } from "react-icons/fa";
import Button from "../Button";
import { IoReload } from "react-icons/io5";
import { MdGridView } from "react-icons/md";
import useTranslation from "@/locale/useTranslation";
import { useState } from "react";
import { ViewType } from "@/pages/Users";
import { IoMdList } from "react-icons/io";

interface PageHeaderType {
  hasAddButton: boolean;
  hasViewType?: boolean;
  hasSubText?: boolean;
  subText?: string | React.ReactNode;
  newButtonText?: string | React.ReactNode;
  viewType?: ViewType;
  toggleViewType?: (type: ViewType) => void;
  handleNewButton?: () => void;
  handleReloadButton: () => void;
  hasDeleteButton?: boolean;
  refetch?: () => void;
  handleDeleteButton?: () => void;
  children?: React.ReactNode;
}

export default function PageHeader({
  hasAddButton,
  hasViewType = false,
  hasSubText = false,
  subText,
  newButtonText,
  viewType,
  toggleViewType,
  handleNewButton,
  handleReloadButton,
  hasDeleteButton,
  refetch,
  handleDeleteButton,
  children,
}: Readonly<PageHeaderType>) {
  const translate = useTranslation();
  const [isRotating, setIsRotating] = useState(false);

  const handleClick = () => {
    setIsRotating(true);
    handleReloadButton();
    refetch?.();
    setTimeout(() => setIsRotating(false), 1000);
  };

  return (
    <div className="flex flex-col sm:items-end gap-[1rem] sm:gap-[1.25rem] mt-[1.5rem] mb-[1.25rem]">
      {/* List or Grid View */}
      {hasViewType && (
        <div className="flex gap-[1rem]">
          <MdGridView
            size={22}
            className={` cursor-pointer ${
              viewType === "grid" ? "text-black" : "text-[#A4ADBB]"
            }`}
            onClick={() => toggleViewType?.("grid")}
          />
          <IoMdList
            size={22}
            className={` cursor-pointer ${
              viewType === "list" ? "text-black" : "text-[#A4ADBB]"
            }`}
            onClick={() => toggleViewType?.("list")}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full">
        {children}
        {hasAddButton && (
          <Button
            className="bg-primaryColor text-white rounded-[0.25rem] shrink-0"
            handleClick={handleNewButton}
          >
            <div className="flex items-center gap-[0.5rem] px-3 py-2 sm:px-5 sm:py-2.5 ">
              <p className="font-[500] text-sm sm:text-[0.9375rem]">
                {newButtonText}
              </p>
            </div>
          </Button>
        )}
        <Button
          className="bg-[#E5E6EC] text-white rounded-[0.25rem] shrink-0"
          handleClick={handleClick}
        >
          <div className="flex items-center gap-[0.5rem] px-3 py-2 sm:px-5 sm:py-2.5 text-[#A4ADBB]">
            <div className={isRotating ? "rotate-animation" : ""}>
              <IoReload size={18} />
            </div>
            <p className="font-[500] text-sm sm:text-[0.9375rem]">
              {translate("Reload")}
            </p>
          </div>
        </Button>
        {hasDeleteButton && (
          <Button
            className="bg-red-500 text-white rounded-[0.25rem] shrink-0"
            handleClick={handleDeleteButton}
          >
            <div className="flex items-center gap-[0.5rem] px-3 py-2 sm:px-5 sm:py-2.5 text-white">
              <div>
                <FaTrash size={20} />
              </div>
              <p className="font-[500] text-sm sm:text-[0.9375rem]">
                {translate("Delete")}
              </p>
            </div>
          </Button>
        )}
      </div>
      {/* Sub Text Section */}
      {hasSubText && (
        <div>
          <p className="font-[400] text-[0.9375rem] text-[#676c76]">
            {subText}
          </p>
        </div>
      )}
    </div>
  );
}
