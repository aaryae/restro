import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import Logo from "../assets/fav.webp";
import { SideListMenuType, SideMenuList } from "./sideMenuList";
import { SetStateAction, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { checkViewAccessList } from "@/utils/accessHelper";
import useTranslation from "@/locale/useTranslation";
import {
  Container,
  LayoutDashboard,
  PanelLeft,
  ShoppingCart,
} from "lucide-react";
import { useGetSettingQuery } from "@/redux/services/settings";
import { IMAGE_BASE_URL } from "@/constants";
export default function SideMenu({
  setToggleState,
  sideMenuOpen,
}: Readonly<{
  setToggleState?: React.Dispatch<SetStateAction<boolean>>;
  sideMenuOpen: boolean;
}>) {
  const location = useLocation();
  const currentPath = location.pathname.split("/");
  const translate = useTranslation();
  const navigate = useNavigate();
  const viewAccess = checkViewAccessList();
  const settingsGroup = SideMenuList.find((each) => each.name === "Settings");
  const settingsPaths = [
    settingsGroup?.path,
    ...(settingsGroup?.menu?.map((m) => m.path) || []),
  ].filter(Boolean) as string[];
  const isSettingsView = settingsPaths.some((p) =>
    location.pathname.startsWith(p),
  );
  const filteredSideMenuList = isSettingsView
    ? SideMenuList.filter((each) => each.name === "Settings")
    : SideMenuList;

  const [isVisible, setIsVisible] = useState<number[]>([]);
  const [isActive, setIsActive] = useState<string | null>(null);
  const { data: settings } = useGetSettingQuery("");
  useEffect(() => {
    if (isSettingsView) {
      const sg = SideMenuList.find((m) => m.name === "Settings");
      if (sg && !isVisible.includes(sg.key)) {
        setIsVisible((prev) => [...prev, sg.key]);
      }
    }
  }, [isSettingsView, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/admin/settings") {
      setIsActive("Company Settings");
      navigate("/admin/settings/list", { replace: true });
    }
  }, [location.pathname]);

  const handleClick = (key: number) => {
    setIsVisible((prev) => {
      if (prev.includes(key)) {
        return prev.filter((each) => each !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleNavigate = (name: string, path?: string) => {
    setIsActive(name);
    navigate(path ? path : "");
    // if (setToggleState) {
    //   setToggleState(false);
    // }
  };
  return (
    <div className="w-full h-full bg-white pt-[7px] px-[12px] overflow-y-auto">
      {/* logo section */}
      <div
        className={`flex items-center ${sideMenuOpen ? "justify-between" : "justify-center"}`}
      >
        {sideMenuOpen && (
          <img
            src={
              settings?.data?.brandingImage
                ? `${IMAGE_BASE_URL}${settings.data.brandingImage}`
                : Logo
            }
            alt="Logo"
            className={`w-[72px] h-[59px] object-cover mx-[4px]`}
          />
        )}

        <PanelLeft
          onClick={() => setToggleState((cur) => !cur)}
          className="cursor-pointer mt-4"
        />
      </div>
      <div className="flex flex-col gap-[6px] mt-[6px]">
        {isSettingsView && sideMenuOpen && (
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-gray-100"
            >
              <MdKeyboardArrowLeft />
              <span>Go back</span>
            </button>
          </div>
        )}
        {/* Dashboard */}
        {!isSettingsView && (
          <div
            className={`${
              currentPath.includes("dashboard")
                ? "bg-primaryColor text-white"
                : ""
            } group hover:bg-primaryColor hover:text-white transition-all duration-300 flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] cursor-pointer mt-[0.5rem]`}
            onClick={() => handleNavigate("dashboard", "/admin/dashboard")}
          >
            <div className="flex items-center gap-[0.5rem]">
              <div className="h-[22px] w-[22px] flex-1 flex items-center">
                <LayoutDashboard />
              </div>
              {sideMenuOpen && (
                <p className="font-[400] text-[1rem] group-hover:translate-x-3 transition-all duration-300">
                  {translate("Dashboard")}
                </p>
              )}
            </div>
          </div>
        )}
        {!isSettingsView && viewAccess.includes("Order") && (
          <div
            className={`${
              currentPath.includes("order") ? "bg-primaryColor text-white" : ""
            } group hover:bg-primaryColor hover:text-white transition-all duration-300 flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] cursor-pointer`}
            onClick={() => handleNavigate("request", "/admin/order/list")}
          >
            <div className="flex items-center gap-[0.5rem]">
              <div
                className={`${sideMenuOpen ? "h-5 w-5" : "h-7 w-7"} flex items-center`}
              >
                <ShoppingCart />
              </div>
              {sideMenuOpen && (
                <p className="font-[400] text-[1rem] group-hover:translate-x-3 transition-all duration-300">
                  Orders
                </p>
              )}
            </div>
          </div>
        )}

        {/* {viewAccess.includes("Supplier") && ( */}
        <div
          className={`${
            currentPath.includes("supplier") ? "bg-primaryColor text-white" : ""
          } hover:bg-primaryColor hover:text-white flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] cursor-pointer mt-[0.25rem]`}
          onClick={() => handleNavigate("request", "/admin/supplier/list")}
        >
          <div className="flex items-center gap-[0.5rem]">
            <div
              className={`${sideMenuOpen ? "h-5 w-5" : "h-7 w-7"} flex items-center`}
            >
              <Container />
            </div>
            {sideMenuOpen && <p className="font-[400] text-[1rem]">Supplier</p>}
          </div>
        </div>
        {/* )} */}
        {/* Apps and Pages */}
        {filteredSideMenuList.map((each: SideListMenuType, index) => {
          const subMenuList = each.menu
            ? each.menu.map((each) => each.name)
            : [each.name];
          return (
            <div key={index}>
              {each.menu ? (
                subMenuList.some((item) => viewAccess.includes(item)) && (
                  <div
                    className="group flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] cursor-pointer hover:bg-primaryColor hover:text-white transition-all duration-300"
                    onClick={() => {
                      if (isSettingsView && each.name === "Settings") {
                        handleClick(each.key);
                      } else if (each.path) {
                        handleNavigate(each.name, each.path);
                      } else {
                        handleClick(each.key);
                      }
                    }}
                  >
                    {/* Primary menu */}
                    <div className="flex items-center gap-[0.5rem]">
                      <div
                        className={`${sideMenuOpen ? "h-5 w-5" : "h-7 w-7"} flex items-center`}
                      >
                        {each.icon}
                      </div>
                      {sideMenuOpen && (
                        <p className="font-[400] text-[1rem] group-hover:translate-x-3 transition-all duration-300 text-start">
                          {each.name}
                        </p>
                      )}
                    </div>
                    {sideMenuOpen &&
                      (!each.path ||
                        (isSettingsView && each.name === "Settings")) && (
                        <div>
                          <MdKeyboardArrowRight
                            className={`${
                              isVisible.includes(each.key)
                                ? "rotate-[90deg]"
                                : ""
                            }`}
                          />
                        </div>
                      )}
                  </div>
                )
              ) : (
                <>
                  {viewAccess.includes(each.name) && (
                    <div
                      className={`group flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] hover:text-white hover:bg-primaryColor cursor-pointer transition-all duration-300 ${
                        currentPath.includes(each.name.toLowerCase()) ||
                        currentPath.includes(
                          each.name.toLowerCase() + "-category",
                        )
                          ? "bg-primaryColor text-white"
                          : ""
                      }`}
                      onClick={() => {
                        if (each.path) {
                          handleNavigate(each.name, each.path);
                        } else {
                          handleClick(each.key);
                        }
                      }}
                    >
                      {/* Primary menu */}
                      <div className="flex items-center gap-[0.5rem]">
                        <div
                          className={`${sideMenuOpen ? "h-5 w-5" : "h-7 w-7"} flex items-center`}
                        >
                          {each.icon}
                        </div>
                        {sideMenuOpen && (
                          <p className="font-[400] text-[1rem] group-hover:translate-x-3 transition-all duration-300 text-start">
                            {each.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* sub menu */}
              {sideMenuOpen &&
                !(each.name === "Settings" && !isSettingsView) && (
                  <div className="space-y-[0.25rem] mt-[0.25rem]">
                    {each.menu &&
                      isVisible.includes(each.key) &&
                      (each.menu as SideListMenuType[]).map(
                        (item, idx) =>
                          viewAccess.includes(item.name) && (
                            <div
                              key={`${each.key}-${idx}`}
                              className={`group flex items-center gap-[0.5rem] hover:text-white hover:bg-primaryColor px-[1rem] ml-[1rem] py-[0.5rem] rounded-[0.25rem] cursor-pointer transition-all duration-300 ${
                                isActive === item.name ||
                                (item.path &&
                                  location.pathname.startsWith(item.path))
                                  ? "text-white bg-primaryColor "
                                  : ""
                              }`}
                              onClick={() =>
                                handleNavigate(item.name, item.path)
                              }
                            >
                              <div className="h-[22px] w-[22px] flex items-center">
                                {item.icon}
                              </div>
                              {sideMenuOpen && (
                                <p className="font-[400] text-[1rem] group-hover:translate-x-3 transition-all duration-300 text-start">
                                  {translate(item.label || item.name)}
                                </p>
                              )}
                            </div>
                          ),
                      )}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
