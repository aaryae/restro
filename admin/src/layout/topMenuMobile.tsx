import { GiHamburgerMenu } from "react-icons/gi";
import user_image from "@/assets/user_image.jpeg";
import { useAppSelector } from "@/redux/store/hooks";
import { IMAGE_BASE_URL } from "@/constants";
import { useState } from "react";
import Drawer from "@/components/Drawer";
import SideMenu from "./sideMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import useTranslation from "@/locale/useTranslation";
import { useDispatch } from "react-redux";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { deleteToken } from "@/utils/tokenHandler";
import { useLogoutMutation } from "@/redux/services/authentication";
import { clearProfile } from "@/redux/feature/profileSlice";
import { setLogout } from "@/redux/feature/authSlice";
import { persistor } from "@/redux/store/store";
// import { SideMenuList } from "./sideMenuList";

export default function TopMenuMobile() {
  const navigate = useNavigate();
  const translate = useTranslation();
  const dispatch = useDispatch();

  const [logout] = useLogoutMutation();

  const userId = useAppSelector((state) => state.auth.id);
  const profileImage = useAppSelector((state) => state.profile.imageUrl);

  const [toggleState, setToggleState] = useState<boolean>(false);

  const handleToggleState = () => {
    setToggleState(!toggleState);
  };

  // Language change removed on mobile for now

  // Removed mobile search handlers

  const handleLogout = async () => {
    try {
      const response = await logout({ id: userId }).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    }
    deleteToken("token");
    dispatch(clearProfile());

    dispatch(setLogout());
    persistor.purge();
  };

  return (
    <>
      <div className="px-[1.5rem] pt-[1.625rem]">
        <div className="flex  justify-between items-center w-full h-[2rem]">
          <GiHamburgerMenu size={24} onClick={handleToggleState} />
          <div className="flex items-center gap-[1rem] pr-[1.5rem]">
            {/* <DropdownMenu>
              <DropdownMenuTrigger>
                <BsGlobe size={26} className="text-[#444050] cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <button
                    className="flex gap-[8px]"
                    onClick={() => handleLanguageChange("jp")}
                  >
                    <img
                      src={JapanFlag}
                      alt="Japan Flag"
                      className="w-[16px] h-[16px]"
                    />
                    Japanese
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <button
                    className="flex gap-[0.5rem]"
                    onClick={() => handleLanguageChange("en")}
                  >
                    <img
                      src={EnglishFlag}
                      alt="English Flag"
                      className="w-[16px] h-[16px]"
                    />
                    English
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="relative">
                  <MdOutlineNotifications
                    size={40}
                    className="text-[#444050] cursor-pointer"
                  />
                  {notifications.length > 0 && (
                    <p className=" absolute top-[0rem] right-[0] bg-red-700 w-[1.5rem] h-[1.5rem] rounded-full ">
                      <span className="text-white">{notifications.length}</span>
                    </p>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <Notification />
              </DropdownMenuContent>
            </DropdownMenu> */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <img
                  src={
                    profileImage
                      ? `${IMAGE_BASE_URL}${profileImage}`
                      : user_image
                  }
                  alt="Profile "
                  className="h-[38px] w-[38px] rounded-full cursor-pointer border border-black object-contain"
                  // crossOrigin="anonymous"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <button onClick={() => navigate("/admin/profile")}>
                    {translate("My Profile")}
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <button onClick={handleLogout}>{translate("Log Out")}</button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Mobile search removed */}
      </div>
      <Drawer
        isOpen={toggleState}
        setIsOpen={setToggleState}
        position="left"
        className="z-50 sm:w-[30%] md:w-[30%] lg:w-[30%]"
      >
        <SideMenu setToggleState={setToggleState} sideMenuOpen={true} />
      </Drawer>
    </>
  );
}
