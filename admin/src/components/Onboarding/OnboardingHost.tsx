import { lazy, Suspense, useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import {
  ONBOARDING_VERSION,
  bootstrapOnboarding,
  completeTour,
  dismissWelcome,
  setStepIndex,
  skipOnboarding,
  startTour,
} from "@/redux/feature/onboardingSlice";
import { checkViewAccessList } from "@/utils/accessHelper";
import {
  loadOnboardingProgress,
  onboardingUserKey,
  saveOnboardingProgress,
} from "@/utils/onboardingProgress";
import { TOUR_STEPS } from "@/onboarding/tourSteps";

const WelcomeModal = lazy(() => import("./WelcomeModal"));
const SpotlightTour = lazy(() => import("./SpotlightTour"));

/**
 * Drives first-run onboarding: greet, then walk the user through the app.
 * Completion is stored outside redux-persist so logout purge cannot re-show it.
 */
export default function OnboardingHost() {
  const dispatch = useAppDispatch();
  const phase = useAppSelector((state) => state.onboarding.phase);
  const stepIndex = useAppSelector((state) => state.onboarding.stepIndex);
  const completedAt = useAppSelector((state) => state.onboarding.completedAt);
  const skippedAt = useAppSelector((state) => state.onboarding.skippedAt);
  const userId = useAppSelector((state) => state.auth.id);
  const clientAccess = useAppSelector((state) => state.auth.clientAccess);
  const viewAccess = checkViewAccessList();
  const accessKey = viewAccess.join("|");
  const userKey = onboardingUserKey(userId);

  const accessReady = clientAccess.length > 0 && userKey !== null;

  useEffect(() => {
    if (!accessReady) return;
    const durable = loadOnboardingProgress(userKey);
    dispatch(
      bootstrapOnboarding(
        durable
          ? {
              version: durable.version,
              completedAt: durable.completedAt,
              skippedAt: durable.skippedAt,
            }
          : undefined,
      ),
    );
  }, [accessReady, dispatch, userKey]);

  // Mirror completion to durable storage whenever the user finishes or skips.
  useEffect(() => {
    if (!userKey) return;
    if (!completedAt && !skippedAt) return;
    saveOnboardingProgress(userKey, {
      version: ONBOARDING_VERSION,
      completedAt,
      skippedAt,
    });
  }, [userKey, completedAt, skippedAt]);

  const steps = useMemo(() => {
    const allowed = new Set(accessKey.split("|"));
    return TOUR_STEPS.filter((step) => {
      if (!step.module) return true;
      const required = Array.isArray(step.module) ? step.module : [step.module];
      return required.some((name) => allowed.has(name));
    });
  }, [accessKey]);

  const handleStepChange = useCallback(
    (index: number) => dispatch(setStepIndex(index)),
    [dispatch],
  );
  const handleFinish = useCallback(() => dispatch(completeTour()), [dispatch]);
  const handleSkip = useCallback(() => dispatch(skipOnboarding()), [dispatch]);

  if (!accessReady) return null;

  if (phase === "welcome") {
    return (
      <Suspense fallback={null}>
        <WelcomeModal
          onStartTour={() => dispatch(startTour())}
          onDismiss={() => dispatch(dismissWelcome())}
        />
      </Suspense>
    );
  }

  if (phase === "tour" && steps.length > 0) {
    const safeIndex = Math.min(stepIndex, steps.length - 1);
    return (
      <Suspense fallback={null}>
        <SpotlightTour
          steps={steps}
          stepIndex={safeIndex}
          onStepChange={handleStepChange}
          onFinish={handleFinish}
          onSkip={handleSkip}
        />
      </Suspense>
    );
  }

  return null;
}
