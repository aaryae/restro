import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MediaType {
  selectedImage: string;
  multipleSelectedImage: string[];
}

const initialState: MediaType = {
  selectedImage: "",
  multipleSelectedImage: [],
};

export const mediaSlice = createSlice({
  name: "media",
  initialState,
  reducers: {
    setSelectedMedia: (state, action: PayloadAction<string>) => {
      if (state.selectedImage === action.payload) {
        Object.assign(state, initialState);
      } else {
        state.selectedImage = action.payload;
      }
    },
    setSelectMultipleMedia: (state, action: PayloadAction<string>) => {
      if (state.multipleSelectedImage.includes(action.payload)) {
        state.multipleSelectedImage = state.multipleSelectedImage.filter(
          (each) => each !== action.payload,
        );
      } else {
        state.multipleSelectedImage.push(action.payload);
      }
    },
    clearSelectedMedia: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const { setSelectedMedia, clearSelectedMedia, setSelectMultipleMedia } =
  mediaSlice.actions;

export default mediaSlice.reducer;
