import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TrialGateCode = "TRIAL_EXPIRED" | "TRIAL_FINISHED" | "TENANT_UNAVAILABLE";

export interface TrialGateCafe {
  id?: number;
  slug?: string;
  name?: string;
  status?: string;
  trialEndsAt?: string | null;
  selfServeTrialExtendedAt?: string | null;
}

export interface TrialGateState {
  open: boolean;
  code: TrialGateCode | null;
  canSelfExtend: boolean;
  selfServeExtendDays: number;
  message: string;
  cafe: TrialGateCafe | null;
}

const initialState: TrialGateState = {
  open: false,
  code: null,
  canSelfExtend: false,
  selfServeExtendDays: 3,
  message: "",
  cafe: null,
};

export const trialGateSlice = createSlice({
  name: "trialGate",
  initialState,
  reducers: {
    openTrialGate: (
      state,
      action: PayloadAction<{
        code: TrialGateCode;
        canSelfExtend?: boolean;
        selfServeExtendDays?: number;
        message?: string;
        cafe?: TrialGateCafe | null;
      }>,
    ) => {
      state.open = true;
      state.code = action.payload.code;
      state.canSelfExtend = Boolean(action.payload.canSelfExtend);
      state.selfServeExtendDays = action.payload.selfServeExtendDays ?? 3;
      state.message =
        action.payload.message ||
        (action.payload.code === "TRIAL_FINISHED"
          ? "Your free trial has finished."
          : "Your free trial has ended.");
      state.cafe = action.payload.cafe || null;
    },
    closeTrialGate: () => initialState,
  },
});

export const { openTrialGate, closeTrialGate } = trialGateSlice.actions;
