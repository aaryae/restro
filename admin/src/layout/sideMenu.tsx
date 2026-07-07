import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import Logo from "../assets/fav.webp";
import { SideListMenuType, SideMenuList } from "./sideMenuList";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { checkViewAccessList } from "@/utils/accessHelper";
import useTranslation from "@/locale/useTranslation";
import { LayoutDashboard, PanelLeft, ShoppingCart } from "lucide-react";
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
  const [hoveredKey, setHoveredKey] = useState<number | null>(null);
  const [collapsedFlyout, setCollapsedFlyout] = useState<{
    key: number;
    top: number;
    left: number;
    title: string;
    items: SideListMenuType[];
  } | null>(null);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (!isSettingsView) {
      try {
        localStorage.setItem("lastMainPath", location.pathname);
      } catch (_) {
        // ignore storage errors
      }
    }
  }, [isSettingsView, location.pathname]);

  useEffect(() => {
    if (location.pathname === "/admin/settings") {
      setIsActive("Company Settings");
      navigate("/admin/settings/list", { replace: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (sideMenuOpen) {
      setCollapsedFlyout(null);
      setHoveredKey(null);
    }
  }, [sideMenuOpen]);

  const handleClick = (key: number) => {
    setIsVisible((prev) => {
      if (prev.includes(key)) {
        return prev.filter((each) => each !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const showSubmenu = (key: number, hasSubItems: boolean) =>
    sideMenuOpen && hasSubItems && isVisible.includes(key);

  const cancelFlyoutClose = () => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
      flyoutCloseTimer.current = null;
    }
  };

  const scheduleFlyoutClose = () => {
    cancelFlyoutClose();
    flyoutCloseTimer.current = setTimeout(() => {
      setCollapsedFlyout(null);
      setHoveredKey(null);
    }, 120);
  };

  const openCollapsedFlyout = (
    target: HTMLElement,
    each: SideListMenuType,
    visibleSubItems: SideListMenuType[],
  ) => {
    const rect = target.getBoundingClientRect();
    cancelFlyoutClose();
    setHoveredKey(each.key);
    setCollapsedFlyout({
      key: each.key,
      top: rect.top,
      left: rect.right + 10,
      title: translate(each.label || each.name),
      items: visibleSubItems,
    });
  };

  const handleNavigate = (name: string, path?: string) => {
    setIsActive(name);
    navigate(path ? path : "");
    // Auto-minimize drawer only on tablet/mobile
    try {
      if (
        setToggleState &&
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(max-width: 1023px)").matches
      ) {
        setToggleState(false);
      }
    } catch (_) {
      // ignore
    }
  };
  return (
    <div
      className={`sidebar-shell ${!sideMenuOpen ? "sidebar-collapsed" : ""} w-full h-full px-[12px] overflow-x-hidden min-h-0 flex flex-col ${!sideMenuOpen ? "pt-[30px]" : "pt-[14px]"}`}
    >
      {/* logo section */}
      <div
        className={`sidebar-header flex items-center ${sideMenuOpen ? "justify-between" : "justify-center"}`}
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

        <button
          type="button"
          aria-label={sideMenuOpen ? "Collapse sidebar" : "Expand sidebar"}
          onClick={() => setToggleState && setToggleState((cur) => !cur)}
          className="sidebar-toggle-btn cursor-pointer"
        >
          <PanelLeft size={sideMenuOpen ? 20 : 22} strokeWidth={2.2} />
        </button>
      </div>
      <div
        className={`sidebar-nav flex flex-col gap-[6px] mt-[2rem] ${!sideMenuOpen ? "items-center" : " "}`}
      >
        {sideMenuOpen && !isSettingsView && (
          <p className="sidebar-section-label px-2 mb-1">Navigation</p>
        )}

        {isSettingsView && sideMenuOpen && (
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                let fallback = "/admin/dashboard";
                try {
                  const last = localStorage.getItem("lastMainPath");
                  navigate(last || fallback);
                } catch (_) {
                  navigate(fallback);
                }
              }}
              className="sidebar-back-btn flex items-center gap-2 text-sm px-2 py-1 rounded"
            >
              <MdKeyboardArrowLeft />
              <span>Go back</span>
            </button>
          </div>
        )}
        {/* Dashboard */}
        {!isSettingsView && viewAccess.includes("Order") && (
          <div
            className={`sidebar-item group transition-all duration-300 flex justify-between items-center rounded-[0.75rem] py-[0.875rem] px-[0.875rem] cursor-pointer ${
              currentPath.includes("order") ? "sidebar-item-active" : ""
            }`}
            onClick={() => handleNavigate("request", "/admin/order/list")}
          >
            <div className="flex items-center gap-[0.5rem]">
              <div className="sidebar-item-icon">
                <ShoppingCart />
              </div>
              {sideMenuOpen && (
                <p className="font-[500] text-[0.96rem] transition-all duration-300">
                  Orders
                </p>
              )}
            </div>
          </div>
        )}

        {/* {viewAccess.includes("Supplier") && ( */}
        {/* <div
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
        </div> */}
        {/* )} */}
        {/* Apps and Pages */}
        {filteredSideMenuList.map((each: SideListMenuType, index) => {
          const subMenuList = each.menu
            ? each.menu.map((each) => each.name)
            : [each.name];
          const hasAccess = subMenuList.some((item) =>
            viewAccess.includes(item),
          );
          if (!hasAccess) return null; // Completely remove unauthorized menu groups/items

          const visibleSubItems =
            (each.menu as SideListMenuType[] | undefined)?.filter((item) =>
              viewAccess.includes(item.name),
            ) || [];

          const hasSubmenu = visibleSubItems.length > 0;
          const isParentActive =
            each.path &&
            (currentPath.includes(each.name.toLowerCase()) ||
              (each.path && location.pathname.startsWith(each.path)));
          const isLeafActive =
            currentPath.includes(each.name.toLowerCase()) ||
            currentPath.includes(each.name.toLowerCase() + "-category");
          const submenuOpen = showSubmenu(
            each.key,
            hasSubmenu && !(each.name === "Settings" && !isSettingsView),
          );

          return (
            <div
              key={index}
              className="sidebar-menu-group"
              onMouseEnter={(event) => {
                if (!sideMenuOpen && hasSubmenu) {
                  openCollapsedFlyout(
                    event.currentTarget,
                    each,
                    visibleSubItems,
                  );
                }
              }}
              onMouseLeave={() => {
                if (!sideMenuOpen && hasSubmenu) {
                  scheduleFlyoutClose();
                }
              }}
            >
              {each.menu ? (
                <div
                  className={`sidebar-item group flex justify-between items-center rounded-[0.75rem] py-[0.875rem] px-[0.875rem] cursor-pointer transition-all duration-300 ${
                    isParentActive ? "sidebar-item-active" : ""
                  }`}
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
                  <div className="flex items-center gap-[0.5rem] min-w-0">
                    <div className="sidebar-item-icon">{each.icon}</div>
                    {sideMenuOpen && (
                      <p className="font-[500] text-[0.96rem] transition-all duration-300 text-start">
                        {translate(each.label || each.name)}
                      </p>
                    )}
                  </div>
                  {sideMenuOpen &&
                    (!each.path ||
                      (isSettingsView && each.name === "Settings")) && (
                      <div>
                        <MdKeyboardArrowRight
                          className={`sidebar-chevron transition-transform duration-300 ${submenuOpen ? "rotate-[90deg]" : ""}`}
                        />
                      </div>
                    )}
                </div>
              ) : (
                <div
                  className={`sidebar-item group flex justify-between items-center rounded-[0.75rem] py-[0.875rem] px-[0.875rem] cursor-pointer transition-all duration-300 ${
                    isLeafActive ? "sidebar-item-active" : ""
                  }`}
                  onClick={() => {
                    if (each.path) {
                      handleNavigate(each.name, each.path);
                    } else {
                      handleClick(each.key);
                    }
                  }}
                >
                  <div className="flex items-center gap-[0.5rem] min-w-0">
                    <div className="sidebar-item-icon">{each.icon}</div>
                    {sideMenuOpen && (
                      <p className="font-[500] text-[0.96rem] transition-all duration-300 text-start">
                        {translate(each.label || each.name)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {sideMenuOpen && submenuOpen && (
                <div className="sidebar-submenu space-y-[0.25rem] mt-[0.25rem]">
                  {visibleSubItems.map((item, idx) => (
                    <div
                      key={`${each.key}-${idx}`}
                      className={`sidebar-subitem group flex items-center gap-[0.5rem] px-[1rem] ml-[1rem] py-[0.75rem] rounded-[0.65rem] cursor-pointer transition-all duration-300 ${
                        isActive === item.name ||
                        (item.path && location.pathname.startsWith(item.path))
                          ? "sidebar-subitem-active"
                          : ""
                      }`}
                      onClick={() => handleNavigate(item.name, item.path)}
                    >
                      <div className="sidebar-subitem-icon">{item.icon}</div>
                      <p className="font-[500] text-[0.92rem] transition-all duration-300 text-start">
                        {translate(item.label || item.name)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {!sideMenuOpen &&
        collapsedFlyout &&
        createPortal(
          <div
            className="sidebar-flyout sidebar-flyout--fixed"
            style={{
              top: collapsedFlyout.top,
              left: collapsedFlyout.left,
            }}
            onMouseEnter={cancelFlyoutClose}
            onMouseLeave={scheduleFlyoutClose}
          >
            <p className="sidebar-flyout-title">{collapsedFlyout.title}</p>
            <div className="sidebar-flyout-items">
              {collapsedFlyout.items.map((item, idx) => (
                <button
                  key={`flyout-${collapsedFlyout.key}-${idx}`}
                  type="button"
                  className={`sidebar-flyout-item ${
                    isActive === item.name ||
                    (item.path && location.pathname.startsWith(item.path))
                      ? "sidebar-flyout-item-active"
                      : ""
                  }`}
                  onClick={() => {
                    handleNavigate(item.name, item.path);
                    setCollapsedFlyout(null);
                    setHoveredKey(null);
                  }}
                >
                  <span className="sidebar-subitem-icon">{item.icon}</span>
                  <span>{translate(item.label || item.name)}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
