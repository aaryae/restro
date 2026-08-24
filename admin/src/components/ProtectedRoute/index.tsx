import React, { useEffect } from "react";
import { useAppSelector } from "../../redux/store/hooks";
import {
  useGetProfileQuery,
  useGetSessionAccessQuery,
} from "@/redux/services/authentication";
import { useDispatch } from "react-redux";
import { clearProfile, setProfile } from "@/redux/feature/profileSlice";
import { deleteToken, getToken } from "@/utils/tokenHandler";
import { setAuthData } from "@/redux/feature/authSlice";
import { jwtDecode } from "jwt-decode";
import {
  redirectToServeLogin,
  startSessionExpiryWatcher,
} from "@/utils/serveAuth";

interface ProtectedRouteType {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteType> = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useAppSelector((state) => state.auth);
  const localToken = getToken("token");
  const sessionToken = auth.token || localToken || "";
  const needsAccess = sessionToken && auth.clientAccess.length === 0;

  useEffect(() => {
    if (!auth.token && localToken) {
      try {
        const decoded = jwtDecode<{
          id?: number;
          roleId?: number;
          email?: string;
          exp?: number;
        }>(localToken);
        dispatch(
          setAuthData({
            token: localToken,
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
        deleteToken("token");
      }
    }
  }, [auth.token, localToken, dispatch]);

  const {
    data: userProfile,
    isSuccess: success,
    error,
  } = useGetProfileQuery("", { skip: !sessionToken });

  const {
    data: sessionAccess,
    isSuccess: accessLoaded,
    error: accessError,
  } = useGetSessionAccessQuery("", { skip: !needsAccess });

  useEffect(() => {
    if (error && "status" in error) {
      const status = error.status;
      if (status === 401 || status === 403) {
        dispatch(clearProfile());
        redirectToServeLogin();
      }
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (accessError && "status" in accessError) {
      const status = accessError.status;
      if (status === 401 || status === 403) {
        dispatch(clearProfile());
        redirectToServeLogin();
      }
    }
  }, [accessError, dispatch]);

  useEffect(() => {
    if (accessLoaded && sessionAccess?.data) {
      const access = sessionAccess.data;
      dispatch(
        setAuthData({
          token: sessionToken,
          id: access.id ?? auth.id,
          roleId: access.roleId ?? auth.roleId,
          roleType: access.roleType || auth.roleType,
          username: access.username || auth.username,
          clientAccess: access.clientAccess || [],
          serverAccess: access.serverAccess || [],
          expiry: access.expiry ?? auth.expiry,
        }),
      );
    }
  }, [
    accessLoaded,
    sessionAccess,
    dispatch,
    sessionToken,
    auth.id,
    auth.roleId,
    auth.roleType,
    auth.username,
    auth.expiry,
  ]);

  useEffect(() => {
    if (userProfile && userProfile.data) {
      dispatch(setProfile(userProfile.data));
    }
  }, [userProfile, success, dispatch]);

  useEffect(() => {
    if (!sessionToken) {
      redirectToServeLogin();
      return;
    }
    startSessionExpiryWatcher();
  }, [sessionToken]);

  if (!sessionToken) {
    return null;
  }

  if (needsAccess && !accessLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--serve-bg,#0c0c0e)] text-sm text-[var(--serve-muted,#a3a3ac)]">
        Loading your workspace…
      </main>
    );
  }

  return children;
};
