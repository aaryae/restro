import user_image from "@/assets/user_image.jpeg";
import { useAppSelector } from "@/redux/store/hooks";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { useState } from "react";
import Drawer from "@/components/Drawer";
import SideMenu from "./sideMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import useTranslation from "@/locale/useTranslation";
import { useDispatch } from "react-redux";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { deleteToken } from "@/utils/tokenHandler";
import { redirectToServeLogin } from "@/utils/serveAuth";
import { useLogoutMutation } from "@/redux/services/authentication";
import { clearProfile } from "@/redux/feature/profileSlice";
import { setLogout } from "@/redux/feature/authSlice";
import { persistor } from "@/redux/store/store";
import { LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function TopMenuMobile() {
  const navigate = useNavigate();
  const translate = useTranslation();
  const dispatch = useDispatch();

  const [logout] = useLogoutMutation();

  const userId = useAppSelector((state) => state.auth.id);
  const profileImage = useAppSelector((state) => state.profile.imageUrl);
  const username = useAppSelector((state) => state.profile.username);

  const [toggleState, setToggleState] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

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
    redirectToServeLogin();
  };

  return (
    <>
      <div className="px-6 pt-6">
        <div className="flex h-10 w-full items-center justify-between">
          <button
            type="button"
            onClick={() => setToggleState(true)}
            className="rounded-lg p-1.5 text-slate-700 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primaryColor/25"
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="shrink-0 rounded-lg p-2 text-[var(--serve-muted)] transition hover:bg-[var(--serve-surface-2)] hover:text-[var(--serve-fg)]"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative shrink-0 rounded-full outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primaryColor/25 focus-visible:ring-offset-2"
                aria-label={username || "Profile menu"}
              >
                <img
                  src={
                    profileImage
                      ? buildAssetUrl(profileImage)
                      : user_image
                  }
                  alt=""
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = user_image;
                  }}
                />
                <span
                  className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#f8f7fa] bg-emerald-500"
                  aria-hidden
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => navigate("/admin/profile")}>
                <UserRound />
                {translate("My Profile")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                <LogOut />
                {translate("Log Out")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
      <Drawer
        isOpen={toggleState}
        setIsOpen={setToggleState}
        position="left"
        width="w-[22rem] max-w-full"
        className="border-r border-slate-200/80"
        contentClassName="p-0"
      >
        <SideMenu
          setToggleState={setToggleState}
          sideMenuOpen={true}
          showCollapseToggle={false}
        />
      </Drawer>
    </>
  );
}
