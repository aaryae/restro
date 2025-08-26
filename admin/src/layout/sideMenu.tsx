import { MdKeyboardArrowRight } from "react-icons/md";
import Logo from "../assets/fav.webp";
import { SideListMenuType, SideMenuList } from "./sideMenuList";
import { SetStateAction, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { checkViewAccessList } from "@/utils/accessHelper";
import useTranslation from "@/locale/useTranslation";
import { LayoutDashboard, ShoppingCart } from "lucide-react";
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
  const [isVisible, setIsVisible] = useState<number[]>([]);
  const [isActive, setIsActive] = useState<string | null>(null);

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
    if (setToggleState) {
      setToggleState(false);
    }
  };
  return (
    <div className="w-full h-full bg-white pt-[7px] px-[12px] overflow-y-auto">
      {/* logo section */}
      <img
        src={Logo}
        alt="Logo"
        className="w-[72px] h-[59px] object-cover mx-[4px] "
      />
      <div className="flex flex-col gap-[6px] mt-[6px]">
        {/* Dashboard */}
        <div
          className={`${
            currentPath.includes("dashboard")
              ? "bg-primaryColor text-white"
              : ""
          } hover:bg-primaryColor hover:text-white flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] cursor-pointer mt-[0.5rem] transition-all duration-150`}
          onClick={() => handleNavigate("dashboard", "/admin/dashboard")}
        >
          <div className="flex items-center gap-[0.5rem]">
            <div className="h-[22px] w-[22px] flex-1 flex items-center">
              <LayoutDashboard />
            </div>
            {<p className="font-[400] text-[1rem]">{translate("Dashboard")}</p>}
          </div>
        </div>
        {/* {console.log(viewAccess, "side menu list")} */}
        {viewAccess.includes("Order") && (
          <div
            className={`${
              currentPath.includes("order") ? "bg-primaryColor text-white" : ""
            } hover:bg-primaryColor hover:text-white flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] cursor-pointer mt-[0.25rem] transition-all duration-150`}
            onClick={() => handleNavigate("request", "/admin/order/list")}
          >
            <div className="flex items-center gap-[0.5rem]">
              <div className="h-5 w-5 flex-1 flex items-center">
                <ShoppingCart />
              </div>
              <p className="font-[400] text-[1rem]">Orders</p>
            </div>
          </div>
        )}
        {/* Apps and Pages */}
        <p className="text-[#ACAAB1] font-[400] text-[13px] mt-[1rem] text-start">
          {translate("APPS & PAGES")}
        </p>
        {SideMenuList.map((each: SideListMenuType, index) => {
          const subMenuList = each.menu
            ? each.menu.map((each) => each.name)
            : [each.name];
          return (
            <div key={index}>
              {each.menu ? (
                subMenuList.some((item) => viewAccess.includes(item)) && (
                  <div
                    className=" flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] cursor-pointer hover:bg-primaryColor hover:text-white"
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
                      <div className="h-5 w-5 flex items-center">
                        {each.icon}
                      </div>
                      {
                        <p className="font-[400] text-[1rem] text-start">
                          {each.name}
                        </p>
                      }
                    </div>
                    {
                      <div>
                        <MdKeyboardArrowRight
                          className={`${
                            isVisible.includes(each.key) ? "rotate-[90deg]" : ""
                          }`}
                        />
                      </div>
                    }
                  </div>
                )
              ) : (
                <>
                  {viewAccess.includes(each.name) && (
                    <div
                      className={` flex justify-between items-center rounded-[0.25rem] py-[0.75rem] px-[0.75rem] hover:text-white hover:bg-primaryColor cursor-pointer transition-all duration-150 ${
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
                        <div className="h-5 w-5 flex items-center">
                          {each.icon}
                        </div>
                        {
                          <p className="font-[400] text-[1rem] text-start">
                            {each.name}
                          </p>
                        }
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* sub menu */}
              <div key={index} className="space-y-[0.25rem] mt-[0.25rem]">
                {each.menu &&
                  isVisible.includes(each.key) &&
                  each.menu.map((item, index) => (
                    <>
                      {viewAccess.includes(item.name) && (
                        <div
                          key={index}
                          className={`flex items-center gap-[0.5rem] hover:text-white hover:bg-primaryColor px-[1rem] ml-[1rem] py-[0.5rem] rounded-[0.25rem] cursor-pointer transition-all duration-150 ${
                            isActive === item.name ||
                            currentPath.includes(item.name.toLowerCase())
                              ? "text-white bg-primaryColor "
                              : ""
                          }`}
                          onClick={() => handleNavigate(item.name, item.path)}
                        >
                          <div className="h-[22px] w-[22px] flex items-center">
                            {item.icon}
                          </div>
                          {
                            <p className="font-[400] text-[1rem] text-start">
                              {translate(item.name)}
                            </p>
                          }
                        </div>
                      )}
                    </>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
