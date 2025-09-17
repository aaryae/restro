import { GiHamburgerMenu } from "react-icons/gi";
import user_image from "@/assets/user_image.jpeg";
import { useAppSelector } from "@/redux/store/hooks";
import { IMAGE_BASE_URL } from "@/constants";
import { MdOutlineNotifications, MdOutlineSearch } from "react-icons/md";
import React, { useState } from "react";
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
import { deleteToken, setToken } from "@/utils/tokenHandler";
import { useLogoutMutation } from "@/redux/services/authentication";
import { clearProfile } from "@/redux/feature/profileSlice";
import { setLogout } from "@/redux/feature/authSlice";
import { persistor } from "@/redux/store/store";
import { SideMenuList } from "./sideMenuList";
import { BsGlobe } from "react-icons/bs";
import EnglishFlag from "@/assets/english.png";
import JapanFlag from "@/assets/japan.png";
import Notification from "@/components/notification";

export default function TopMenuMobile() {
  const navigate = useNavigate();
  const translate = useTranslation();
  const dispatch = useDispatch();

  const [logout] = useLogoutMutation();

  const userId = useAppSelector((state) => state.auth.id);
  const profileImage = useAppSelector((state) => state.profile.imageUrl);
  const notifications = useAppSelector((state) => state.socket.message);

  const [toggleState, setToggleState] = useState<boolean>(false);

  const [userInput, setUserInput] = useState<string>("");

  const [suggestion, setSuggestion] = useState([]);

  const handleToggleState = () => {
    setToggleState(!toggleState);
  };

  const handleLanguageChange = (lang: string) => {
    setToken("lang", lang);
    window.location.reload();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    if (value.trim() !== "") {
      const matchedRoutes = SideMenuList.filter((route) =>
        route.name.toLowerCase().includes(value),
      ).flatMap((route) => {
        if (!route.menu) {
          return { name: route.name, path: route.path };
        } else {
          return route.menu.map((each) => {
            return { name: each.name, path: each.path };
          });
        }
      });
      setSuggestion(matchedRoutes);
    } else {
      setSuggestion([]);
    }
  };

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
        {/* <SearchBox /> */}
        <div className="relative">
          <div className="text-[#444050] flex items-center pl-[13px] border border-black py-[0.75rem] rounded-[0.25rem] mt-[2.438rem]">
            <MdOutlineSearch size={18} className="mr-[1rem]" />
            <input
              type="text"
              placeholder="Search Ctrl + k"
              value={userInput}
              onChange={handleInputChange}
              className="flex-1 font-[400] text-[1rem] text-[#ACAAB1] outline-none bg-transparent placeholder-[#ACAAB1]"
            />
          </div>
          {suggestion.length > 0 && (
            <ul className="absolute bg-white shadow-xl mt-[1rem] w-full space-y-[1rem] py-[1.5rem]">
              {suggestion.map((each, index) => (
                <div
                  key={index}
                  className="cursor-pointer"
                  onClick={() => navigate(each.path)}
                >
                  <div>{each.name}</div>
                  <div>{`${each.path}`}</div>
                </div>
              ))}
            </ul>
          )}
        </div>
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
