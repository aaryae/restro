import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/store/hooks";
import { useGetProfileQuery } from "@/redux/services/authentication";
import { useDispatch } from "react-redux";
import { clearProfile, setProfile } from "@/redux/feature/profileSlice";
import { deleteToken, getToken } from "@/utils/tokenHandler";
import { setAuthData } from "@/redux/feature/authSlice";
import { jwtDecode } from "jwt-decode";

interface ProtectedRouteType {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteType> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useAppSelector((state) => state.auth.token);
  const localToken = getToken("token");
  const sessionToken = auth || localToken || "";

  useEffect(() => {
    if (!auth && localToken) {
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
            roleId: Number(decoded.roleId) || 1,
            roleType: "Super Admin",
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
  }, [auth, localToken, dispatch]);

  const {
    data: userProfile,
    isSuccess: success,
    error,
  } = useGetProfileQuery("", { skip: !sessionToken });

  useEffect(() => {
    if (error && "status" in error) {
      const status = error.status;
      if (status === 401 || status === 403) {
        deleteToken("token");
        dispatch(clearProfile());
        navigate("/", { replace: true });
      }
    }
  }, [error, dispatch, navigate]);

  useEffect(() => {
    if (userProfile && userProfile.data) {
      dispatch(setProfile(userProfile.data));
    }
  }, [userProfile, success, dispatch]);

  if (!sessionToken) {
    return <Navigate to="/" />;
  }
  return children;
};
