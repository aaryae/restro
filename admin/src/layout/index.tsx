import { Outlet } from "react-router-dom";
import SideMenu from "./sideMenu";
import TopMenu from "./topMenu";
import TopMenuMobile from "./topMenuMobile";
import { useState } from "react";

export default function Layout() {
  // notification system disabled
  // const { connect } = useWebSocket();
  // useEffect(() => {
  //   connect();
  // }, []);

  const [sideMenuOpen, setSideMenuOpen] = useState<boolean>(true);

  return (
    <>
      {/* For Desktop View */}
      <div className="hidden lg:flex bg-[#f2f6fa]">
        {/* Side Menu */}
        <div
          className={`h-screen fixed shadow-lg shadow-gray-400 z-10 transition-all duration-300 ${sideMenuOpen ? "w-[18%]" : "w-20"}`}
        >
          <SideMenu
            setToggleState={setSideMenuOpen}
            sideMenuOpen={sideMenuOpen}
          />
        </div>
        <div
          className={`flex-1 flex flex-col h-screen w-screen  ${sideMenuOpen ? "ml-[18%]" : "ml-16"}`}
        >
          {/* Main Content */}
          <div>
            <TopMenu
              sideMenuOpen={sideMenuOpen}
              setSideMenuOpen={setSideMenuOpen}
            />
          </div>
          {/* Page content */}
          <div className="flex-1 px-[1.5rem] py-[1rem] overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
      {/* for Mobile View */}
      <div className="block lg:hidden ">
        <TopMenuMobile />

        {/* Page content */}
        <div className="flex-1 p-4 overflow-auto min-h-[87vh]">
          <Outlet />
        </div>
      </div>
    </>
  );
}
