import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  message: [],
};

export const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocketNewMessage: (state, action) => {
      console.log(action.payload, "action payload");
      // please refactor this code as message cannot be a parameter to check the condition
      if (action.payload !== "Connected to WebSocket server") {
        // first check if the data is as per required
        const receivedResponse = JSON.parse(action.payload);
        const formattedResponse = {
          ...receivedResponse,
          id: receivedResponse.notificationId,
        };
        // since data from socket comes in string
        state.message.push(formattedResponse);
      } else {
        Object.assign(state, initialState);
      }
    },
  },
});

export const { setSocketNewMessage } = socketSlice.actions;
export default socketSlice.reducer;
