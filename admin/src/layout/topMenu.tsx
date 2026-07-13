import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useLogoutMutation } from "../redux/services/authentication";
import { deleteToken } from "../utils/tokenHandler";
import { useDispatch } from "react-redux";
import { setLogout } from "../redux/feature/authSlice";
import { persistor } from "../redux/store/store";
import { handleError, handleResponse } from "../utils/responseHandler";
import { useAppSelector } from "../redux/store/hooks";
import { useNavigate } from "react-router-dom";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import { clearProfile } from "@/redux/feature/profileSlice";
import useTranslation from "@/locale/useTranslation";
import user_image from "@/assets/user_image.jpeg";
import SearchBox from "@/components/SearchBox";
import { LogOut, UserRound } from "lucide-react";

export default function TopMenu({
  sideMenuOpen: _sideMenuOpen,
  setSideMenuOpen: _setSideMenuOpen,
}: {
  sideMenuOpen: boolean;
  setSideMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const translate = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userId = useAppSelector((state) => state.auth.id);
  const profileImage = useAppSelector((state) => state.profile.imageUrl);
  const username = useAppSelector((state) => state.profile.username);

  const [logout] = useLogoutMutation();

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
    <div className="flex w-full min-w-0 items-center justify-between gap-4 px-6 py-4">
      <SearchBox />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative shrink-0 rounded-full outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primaryColor/25 focus-visible:ring-offset-2"
            aria-label={username || "Profile menu"}
          >
            <img
              src={
                profileImage ? buildAssetUrl(profileImage) : user_image
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
  );
}
