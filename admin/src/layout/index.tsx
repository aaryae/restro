import { Outlet, useLocation } from "react-router-dom";
import SideMenu from "./sideMenu";
import TopMenu from "./topMenu";
import TopMenuMobile from "./topMenuMobile";
import MobileBottomNav from "./MobileBottomNav";
import { Suspense, useEffect, useState } from "react";
import Loader from "@/components/Loader";
import OnboardingHost from "@/components/Onboarding/OnboardingHost";

const SIDEBAR_OPEN_KEY = "serve-sidebar-open";

function readSidebarOpen(): boolean {
  try {
    const raw = localStorage.getItem(SIDEBAR_OPEN_KEY);
    if (raw === null) return true;
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

export default function Layout() {
  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(readSidebarOpen);
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_KEY, sideMenuOpen ? "1" : "0");
    } catch {
      // ignore quota / private mode
    }
  }, [sideMenuOpen]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    const href = "/favicon.svg";
    let link = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    if (link.href !== href) {
      link.type = "image/svg+xml";
      link.href = href;
    }
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Desktop/tablet: docked sidebar */}
      <div
        data-tour="app-sidebar"
        className={`fixed left-0 top-0 z-50 hidden h-screen overflow-visible border-r border-[var(--serve-sidebar-border)] transition-all duration-300 md:block ${
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
        <div className="hidden min-w-0 border-b border-[var(--serve-border)] bg-[var(--serve-surface)] md:block">
          <TopMenu
            sideMenuOpen={sideMenuOpen}
            setSideMenuOpen={setSideMenuOpen}
          />
        </div>

        <div className="relative min-h-[87vh] min-w-0 overflow-x-hidden overflow-y-auto p-4 pb-20 md:px-[1.5rem] md:py-[1rem] md:pb-[1rem]">
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>

      <MobileBottomNav />
      <OnboardingHost />
    </div>
  );
}
