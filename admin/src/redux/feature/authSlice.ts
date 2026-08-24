import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AccessType {
  path: string;
  key: string;
  list: string;
  requiredApproval: number;
}

interface AuthType {
  clientAccess: AccessType[];
  roleId: number | null;
  roleType: string;
  id: number | null;
  serverAccess: AccessType[];
  token: string;
  username: string;
  expiry: number | null;
}

const initialState: AuthType = {
  clientAccess: [],
  roleId: null,
  roleType: "",
  id: null,
  serverAccess: [],
  token: "",
  username: "",
  expiry: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<AuthType>) => {
      // this is done because the state parameter is not directly re assignable in redux toolkit
      Object.assign(state, action.payload);
    },
    setLogout: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const { setAuthData, setLogout } = authSlice.actions;

export default authSlice.reducer;
