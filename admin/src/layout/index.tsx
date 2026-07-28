import { Outlet } from "react-router-dom";
import SideMenu from "./sideMenu";
import TopMenu from "./topMenu";
import TopMenuMobile from "./topMenuMobile";
import { Suspense, useEffect, useState } from "react";
import { useGetSettingQuery } from "@/redux/services/settings";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import Loader from "@/components/Loader";

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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f2f6fa]">
      {/* Desktop/tablet: docked sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 hidden h-screen overflow-visible border-r border-slate-200/80 transition-all duration-300 md:block ${
          sideMenuOpen ? "w-80" : "w-20"
        }`}
      >
        <SideMenu
          setToggleState={setSideMenuOpen}
          sideMenuOpen={sideMenuOpen}
        />
      </div>

      {/* Mobile: top bar + drawer menu */}
      <div className="md:hidden">
        <TopMenuMobile />
      </div>

      {/* Single content shell — one Outlet so resize does not remount pages */}
      <div
        className={`min-h-screen min-w-0 transition-all duration-300 ${
          sideMenuOpen
            ? "md:ml-80 md:w-[calc(100%-20rem)]"
            : "md:ml-20 md:w-[calc(100%-5rem)]"
        }`}
      >
        <div className="hidden min-w-0 md:block">
          <TopMenu
            sideMenuOpen={sideMenuOpen}
            setSideMenuOpen={setSideMenuOpen}
          />
        </div>

        <div className="relative min-h-[87vh] min-w-0 overflow-x-hidden overflow-y-auto p-4 md:px-[1.5rem] md:py-[1rem]">
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
