import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  message: [],
};

export const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocketNewMessage: (state, action) => {
      if (action.payload === "Connected to WebSocket server") {
        Object.assign(state, initialState);
        return;
      }
      try {
        const receivedResponse = JSON.parse(action.payload);
        const formattedResponse = {
          ...receivedResponse,
          id:
            receivedResponse.notificationId ??
            receivedResponse.requestId ??
            `${receivedResponse.type || "event"}-${Date.now()}`,
        };
        state.message.push(formattedResponse);
      } catch {
        // ignore non-JSON heartbeat / ping frames
      }
    },
  },
});

export const { setSocketNewMessage } = socketSlice.actions;
export default socketSlice.reducer;
