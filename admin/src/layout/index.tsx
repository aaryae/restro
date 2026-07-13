import { Outlet } from "react-router-dom";
import SideMenu from "./sideMenu";
import TopMenu from "./topMenu";
import TopMenuMobile from "./topMenuMobile";
import { useEffect, useState } from "react";
import { useGetSettingQuery } from "@/redux/services/settings";
import { buildAssetUrl } from "@/utils/buildAssetUrl";

export default function Layout() {
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(true);
  const { data: settings } = useGetSettingQuery("");

  useEffect(() => {
    const href = settings?.data?.fav_icon
      ? buildAssetUrl(settings.data.fav_icon)
      : "/fav.webp";
    let link = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.type = "image/png";
      link.href = href;
    }
  }, [settings]);

  return (
    <>
      {/* For Desktop View */}
      <div className="hidden min-h-screen w-full overflow-x-hidden bg-[#f2f6fa] lg:block">
        {/* Side Menu */}
        <div
          className={`fixed z-50 h-screen overflow-visible border-r border-slate-200/80 transition-all duration-300 ${
            sideMenuOpen ? "w-[18%]" : "w-20"
          }`}
        >
          <SideMenu
            setToggleState={setSideMenuOpen}
            sideMenuOpen={sideMenuOpen}
          />
        </div>

        <div
          className={`min-h-screen min-w-0 transition-all duration-300 ${
            sideMenuOpen
              ? "ml-[18%] w-[82%]"
              : "ml-20 w-[calc(100%-5rem)]"
          }`}
        >
          <div className="min-w-0">
            <TopMenu
              sideMenuOpen={sideMenuOpen}
              setSideMenuOpen={setSideMenuOpen}
            />
          </div>
          <div className="min-w-0 overflow-x-hidden overflow-y-auto px-[1.5rem] py-[1rem]">
            <Outlet />
          </div>
        </div>
      </div>
      {/* for Mobile View */}
      <div className="block overflow-x-hidden lg:hidden">
        <TopMenuMobile />

        <div className="min-h-[87vh] overflow-x-hidden overflow-y-auto p-4">
          <Outlet />
        </div>
      </div>
    </>
  );
}
