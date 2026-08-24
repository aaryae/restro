import { createSlice } from "@reduxjs/toolkit";

interface ProfileType {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: "male" | "female" | "others";
  id: number | null;
  imageUrl: string;
  mobileNo: string;
}

const initialState: ProfileType = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  gender: "male",
  id: null,
  imageUrl: "",
  mobileNo: "",
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      Object.assign(state, action.payload);
    },
    clearProfile: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const { setProfile, clearProfile } = profileSlice.actions;

export default profileSlice.reducer;
