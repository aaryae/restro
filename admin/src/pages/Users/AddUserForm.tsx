import { LuUser } from "react-icons/lu";
import { GoLock } from "react-icons/go";
import { useState } from "react";
import UserForm from "./UserForm";
import Security from "./Security";
import useTranslation from "@/locale/useTranslation";

export default function AddUserForm({
  isOpen,
  editId,
  setIsOpen,
}: {
  isOpen: boolean;
  editId: number | null;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const translate = useTranslation();
  const [tabSection, setTabSection] = useState<string>("profile");

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  const handleTabChange = (tab: string) => {
    if (editId === null) {
      setTabSection("profile");
    } else {
      setTabSection(tab);
    }
  };

  return (
    <div>
      {/* Tab Section */}
      <div className="flex flex-wrap md:mt-[4rem] mt-0 mb-[1.5rem]">
        <button
          className={`flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem]  cursor-pointer ${
            tabSection === "profile" ? "bg-primaryColor text-white" : ""
          } `}
          onClick={() => handleTabChange("profile")}
        >
          <LuUser />
          <p className="font-[500] text-[15px]">{translate("Profile")}</p>
        </button>
        <button
          className={`flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem]  cursor-pointer ${
            tabSection === "security" ? "bg-primaryColor text-white" : ""
          } ${editId === null ? "text-gray-400 cursor-not-allowed" : ""}`}
          onClick={() => handleTabChange("security")}
        >
          <GoLock />
          <p className="font-[500] text-[15px]">{translate("Security")}</p>
        </button>
      </div>

      {/*User Form Section */}
      {tabSection === "profile" && (
        <UserForm
          editId={editId}
          handleCloseDrawer={handleCloseDrawer}
          isOpen={isOpen}
        />
      )}
      {tabSection === "security" && (
        <Security
          isOpen={isOpen}
          editId={editId}
          handleCloseDrawer={handleCloseDrawer}
        />
      )}
    </div>
  );
}
