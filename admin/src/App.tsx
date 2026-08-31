import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { setAuthData } from "./redux/feature/authSlice";
import { clearProfile } from "./redux/feature/profileSlice";
import { deleteToken, getToken, setToken } from "./utils/tokenHandler";
import {
  hasValidPosSession,
  redirectToServeLogin,
  startSessionExpiryWatcher,
} from "./utils/serveAuth";

interface DecodedToken {
  exp?: number;
  id?: number;
  roleId?: number;
  email?: string;
}


export default function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    setToken("lang", "en");

    if (!hasValidPosSession()) {
      deleteToken("token");
      dispatch(clearProfile());
      redirectToServeLogin();
      return;
    }

    const token = getToken("token") || "";
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      dispatch(
        setAuthData({
          token,
          id: Number(decoded.id) || null,
          roleId: Number(decoded.roleId) || null,
          roleType: "",
          username: String(decoded.email || ""),
          clientAccess: [],
          serverAccess: [],
          expiry: decoded.exp || null,
        }),
      );
    } catch {
      redirectToServeLogin();
      return;
    }

    startSessionExpiryWatcher();
    navigate("/admin/order/list", { replace: true });
  }, [dispatch, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--serve-bg,#0c0c0e)] text-sm text-[var(--serve-muted,#a3a3ac)]">
      Opening your cafe…
    </main>
  );
}
