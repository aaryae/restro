import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Bump when tour content changes enough that returning users should see it. */
export const ONBOARDING_VERSION = 2;

type Phase = "idle" | "welcome" | "tour" | "done";

export interface OnboardingState {
  version: number;
  phase: Phase;
  stepIndex: number;
  /** Guide ids the user has already opened, so we can badge the unseen ones. */
  seenGuides: string[];
  completedAt: string | null;
  skippedAt: string | null;
}

const initialState: OnboardingState = {
  version: ONBOARDING_VERSION,
  phase: "idle",
  stepIndex: 0,
  seenGuides: [],
  completedAt: null,
  skippedAt: null,
};

export const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    /**
     * Called once after login. Prefer durable local progress (survives logout
     * purge); fall back to redux-persist fields for the same session.
     */
    bootstrapOnboarding: (
      state,
      action: PayloadAction<
        | {
            completedAt?: string | null;
            skippedAt?: string | null;
            version?: number;
          }
        | undefined
      >,
    ) => {
      const durable = action.payload;
      if (durable) {
        if (
          durable.version === ONBOARDING_VERSION &&
          (durable.completedAt || durable.skippedAt)
        ) {
          state.version = ONBOARDING_VERSION;
          state.completedAt = durable.completedAt || null;
          state.skippedAt = durable.skippedAt || null;
          state.phase = "done";
          state.stepIndex = 0;
          return;
        }
      }

      if (state.version !== ONBOARDING_VERSION) {
        state.version = ONBOARDING_VERSION;
        state.completedAt = null;
        state.skippedAt = null;
        state.phase = "welcome";
        state.stepIndex = 0;
        return;
      }

      if (state.completedAt || state.skippedAt) {
        state.phase = "done";
        state.stepIndex = 0;
        return;
      }

      state.phase = "welcome";
      state.stepIndex = 0;
    },
    startTour: (state) => {
      state.phase = "tour";
      state.stepIndex = 0;
    },
    setStepIndex: (state, action: PayloadAction<number>) => {
      state.stepIndex = Math.max(0, action.payload);
    },
    completeTour: (state) => {
      state.phase = "done";
      state.stepIndex = 0;
      state.completedAt = new Date().toISOString();
      state.skippedAt = null;
    },
    skipOnboarding: (state) => {
      state.phase = "done";
      state.stepIndex = 0;
      state.skippedAt = new Date().toISOString();
    },
    dismissWelcome: (state) => {
      state.phase = "done";
      state.skippedAt = new Date().toISOString();
    },
    markGuideSeen: (state, action: PayloadAction<string>) => {
      if (!state.seenGuides.includes(action.payload)) {
        state.seenGuides.push(action.payload);
      }
    },
    /** "Replay tour" from the help panel — clears durable + redux completion. */
    resetOnboarding: (state) => {
      state.phase = "welcome";
      state.stepIndex = 0;
      state.completedAt = null;
      state.skippedAt = null;
      state.version = ONBOARDING_VERSION;
    },
  },
});

export const {
  bootstrapOnboarding,
  startTour,
  setStepIndex,
  completeTour,
  skipOnboarding,
  dismissWelcome,
  markGuideSeen,
  resetOnboarding,
} = onboardingSlice.actions;
