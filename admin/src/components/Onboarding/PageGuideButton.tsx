import { lazy, Suspense, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/store/hooks";
import { markGuideSeen, resetOnboarding } from "@/redux/feature/onboardingSlice";
import { findPageGuide } from "@/onboarding/pageGuides";
import {
  clearOnboardingProgress,
  onboardingUserKey,
} from "@/utils/onboardingProgress";

const PageGuidePanel = lazy(() => import("./PageGuidePanel"));

/** Always-available "what is this page?" affordance for the top bar. */
export default function PageGuideButton() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const seenGuides = useAppSelector((state) => state.onboarding.seenGuides);
  const userId = useAppSelector((state) => state.auth.id);
  const [open, setOpen] = useState(false);

  const guide = useMemo(() => findPageGuide(pathname), [pathname]);
  const unseen = Boolean(guide) && !seenGuides.includes(guide!.id);

  const openPanel = () => {
    if (guide) dispatch(markGuideSeen(guide.id));
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        data-tour="page-guide-button"
        onClick={openPanel}
        aria-label={guide ? `About ${guide.title}` : "Help"}
        title={guide ? `About ${guide.title}` : "Help"}
        className="relative shrink-0 rounded-lg p-2 text-[var(--serve-muted)] transition hover:bg-[var(--serve-surface-2)] hover:text-[var(--serve-fg)]"
      >
        <HelpCircle size={20} />
        {unseen ? (
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--serve-accent)]"
          />
        ) : null}
      </button>

      {open ? (
        <Suspense fallback={null}>
          <PageGuidePanel
            guide={guide}
            onClose={() => setOpen(false)}
            onReplayTour={() => {
              setOpen(false);
              clearOnboardingProgress(onboardingUserKey(userId));
              dispatch(resetOnboarding());
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
}
