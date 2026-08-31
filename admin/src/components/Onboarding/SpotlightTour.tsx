import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { TourPlacement, TourStep } from "@/onboarding/tourSteps";

const SPOTLIGHT_PADDING = 8;
const CARD_WIDTH = 432;
const VIEWPORT_MARGIN = 16;
const GAP = 18;
const ARROW_SIZE = 12;
/** Below this width there is no room to sit beside a target — use a sheet. */
const COMPACT_QUERY = "(max-width: 639px)";
/** How long to wait for a lazily mounted target before skipping the step. */
const TARGET_TIMEOUT_MS = 1600;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function readRect(element: Element): Rect {
  const box = element.getBoundingClientRect();
  return {
    top: box.top - SPOTLIGHT_PADDING,
    left: box.left - SPOTLIGHT_PADDING,
    width: box.width + SPOTLIGHT_PADDING * 2,
    height: box.height + SPOTLIGHT_PADDING * 2,
  };
}

/**
 * Targets are quoted attribute values, not identifiers — several contain
 * spaces ("nav-Cash and Banks"), so only quotes and backslashes need escaping.
 */
function selectorFor(target: string) {
  return `[data-tour="${target.replace(/["\\]/g, "\\$&")}"]`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Pick a side with room for the card, falling back to the roomiest one. */
function resolvePlacement(
  rect: Rect,
  preferred: TourPlacement,
  cardSize: { width: number; height: number },
): Exclude<TourPlacement, "center"> {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const room = {
    top: rect.top,
    bottom: vh - (rect.top + rect.height),
    left: rect.left,
    right: vw - (rect.left + rect.width),
  };

  const needed = {
    top: cardSize.height + GAP,
    bottom: cardSize.height + GAP,
    left: cardSize.width + GAP,
    right: cardSize.width + GAP,
  };

  const order: Exclude<TourPlacement, "center">[] =
    preferred === "center"
      ? ["bottom", "right", "top", "left"]
      : [
          preferred,
          preferred === "left" ? "right" : preferred === "right" ? "left" : "bottom",
          "bottom",
          "top",
          "right",
          "left",
        ];

  for (const side of order) {
    if (room[side] >= needed[side]) return side;
  }

  return (Object.keys(room) as Exclude<TourPlacement, "center">[]).reduce((a, b) =>
    room[a] >= room[b] ? a : b,
  );
}

function cardPosition(
  rect: Rect,
  placement: Exclude<TourPlacement, "center">,
  cardSize: { width: number; height: number },
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0;
  let left = 0;

  if (placement === "bottom" || placement === "top") {
    left = rect.left + rect.width / 2 - cardSize.width / 2;
    top =
      placement === "bottom"
        ? rect.top + rect.height + GAP
        : rect.top - cardSize.height - GAP;
  } else {
    top = rect.top + rect.height / 2 - cardSize.height / 2;
    left =
      placement === "right"
        ? rect.left + rect.width + GAP
        : rect.left - cardSize.width - GAP;
  }

  return {
    top: clamp(top, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vh - cardSize.height - VIEWPORT_MARGIN)),
    left: clamp(left, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vw - cardSize.width - VIEWPORT_MARGIN)),
  };
}

interface SpotlightTourProps {
  steps: TourStep[];
  stepIndex: number;
  onStepChange: (index: number) => void;
  onFinish: () => void;
  onSkip: () => void;
}

export default function SpotlightTour({
  steps,
  stepIndex,
  onStepChange,
  onFinish,
  onSkip,
}: SpotlightTourProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSize, setCardSize] = useState({ width: CARD_WIDTH, height: 220 });
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia(COMPACT_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches);
    setCompact(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const goNext = useCallback(() => {
    if (isLast) onFinish();
    else onStepChange(stepIndex + 1);
  }, [isLast, onFinish, onStepChange, stepIndex]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) onStepChange(stepIndex - 1);
  }, [onStepChange, stepIndex]);

  // Steps can live on another page; get there before hunting for the target.
  useEffect(() => {
    if (step?.route && location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [location.pathname, navigate, step]);

  // Track the target element: it may mount late (lazy route) or move (scroll).
  useLayoutEffect(() => {
    if (!step) return undefined;

    if (!step.target) {
      setRect(null);
      return undefined;
    }

    let frame = 0;
    let cancelled = false;
    const deadline = Date.now() + TARGET_TIMEOUT_MS;
    const selector = selectorFor(step.target);

    const tick = () => {
      if (cancelled) return;
      const element = document.querySelector(selector);

      if (element) {
        const nextRect = readRect(element);
        setRect((prev) =>
          prev &&
          prev.top === nextRect.top &&
          prev.left === nextRect.left &&
          prev.width === nextRect.width &&
          prev.height === nextRect.height
            ? prev
            : nextRect,
        );

        const box = element.getBoundingClientRect();
        const offscreen =
          box.top < 0 || box.bottom > window.innerHeight;
        if (offscreen) {
          element.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      } else if (Date.now() > deadline) {
        // Hidden by permissions or viewport — do not strand the user here.
        cancelled = true;
        goNext();
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [goNext, step]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const box = cardRef.current.getBoundingClientRect();
    setCardSize((prev) =>
      Math.abs(prev.height - box.height) < 1 && Math.abs(prev.width - box.width) < 1
        ? prev
        : { width: box.width, height: box.height },
    );
  }, [step, rect]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
      } else if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, onSkip]);

  const centered = !step?.target || step.placement === "center" || !rect;
  /** Anchored beside the target; on phones we drop to a bottom sheet instead. */
  const anchored = !centered && !compact;

  const layout = useMemo(() => {
    if (!anchored || !rect) return null;
    const placement = resolvePlacement(rect, step?.placement || "bottom", cardSize);
    return { placement, ...cardPosition(rect, placement, cardSize) };
  }, [anchored, cardSize, rect, step]);

  /**
   * Caret joining card to target. Rendered as a sibling of the card (which
   * clips its own overflow) and painted underneath it, so the card body hides
   * the inner half of the rotated square and only a bordered tip shows.
   */
  const arrowStyle = useMemo((): CSSProperties | null => {
    if (!layout || !rect) return null;
    const half = ARROW_SIZE / 2;
    const { placement, top, left } = layout;
    const edgeInset = 20;

    if (placement === "top" || placement === "bottom") {
      const x = clamp(
        rect.left + rect.width / 2,
        left + edgeInset,
        left + Math.max(edgeInset, cardSize.width - edgeInset),
      );
      return {
        top: (placement === "bottom" ? top : top + cardSize.height) - half,
        left: x - half,
      };
    }

    const y = clamp(
      rect.top + rect.height / 2,
      top + edgeInset,
      top + Math.max(edgeInset, cardSize.height - edgeInset),
    );
    return {
      top: y - half,
      left: (placement === "right" ? left : left + cardSize.width) - half,
    };
  }, [cardSize, layout, rect]);

  if (!step) return null;

  const StepIcon = step.icon;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  /**
   * Positioning lives on a wrapper, never on the card: the entrance animation
   * owns the card's `transform`, so a translate-based centring would be wiped
   * out the moment the keyframes settle.
   */
  const wrapper = layout
    ? {
        className: "absolute w-[min(27rem,calc(100vw-2rem))]",
        style: { top: `${layout.top}px`, left: `${layout.left}px` } as CSSProperties,
      }
    : centered
      ? {
          className: "absolute inset-0 flex items-center justify-center p-4",
          style: undefined,
        }
      : {
          className:
            "absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex justify-center",
          style: undefined,
        };

  return createPortal(
    <div className="fixed inset-0 z-[200]" aria-live="polite">
      {/* Dim everything except the target. Four panels keep the cutout crisp. */}
      {rect && !centered ? (
        <>
          <div className="tour-dim" style={{ top: 0, left: 0, right: 0, height: Math.max(rect.top, 0) }} />
          <div
            className="tour-dim"
            style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="tour-dim"
            style={{ top: rect.top, left: 0, width: Math.max(rect.left, 0), height: rect.height }}
          />
          <div
            className="tour-dim"
            style={{
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
            }}
          />
          <div
            aria-hidden
            className="tour-ring"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          >
            <span className="absolute -inset-[3px] animate-tour-halo rounded-[inherit] border-2 border-tourAccent/55 motion-reduce:hidden" />
          </div>
        </>
      ) : (
        <div className="tour-dim" style={{ inset: 0 }} />
      )}

      {arrowStyle ? <span aria-hidden className="tour-arrow" style={arrowStyle} /> : null}

      <div className={wrapper.className} style={wrapper.style}>
        {/* Hairline gradient border: a 1px gradient wrapper reads far crisper
            on a dark card than a flat border would. */}
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-step-title"
          key={step.id}
          className="w-full max-w-[27rem] animate-tour-in rounded-2xl bg-gradient-to-b from-white/25 via-white/10 to-white/5 p-px shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] motion-reduce:animate-none"
        >
          <div className="relative overflow-hidden rounded-[15px] bg-tourSurface">
            {/* Accent bloom — the card is lit from above by the brand colour. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-44 w-80 -translate-x-1/2 rounded-full bg-tourAccent/25 blur-3xl"
            />

            <div className="relative p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tourAccent/15 text-tourAccent ring-1 ring-inset ring-tourAccent/30">
                  <StepIcon size={19} />
                </span>

                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                  {stepIndex + 1} / {steps.length}
                </span>

                <button
                  type="button"
                  onClick={onSkip}
                  aria-label="Close tour"
                  className="-mr-1 ml-auto shrink-0 rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>

              <h3
                id="tour-step-title"
                className="mt-4 text-[19px] font-semibold leading-snug tracking-tight text-white sm:text-[20px]"
              >
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.65] text-white/60">
                {step.body}
              </p>

              <div
                className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={stepIndex + 1}
                aria-valuemin={1}
                aria-valuemax={steps.length}
              >
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-tourAccent/60 to-tourAccent transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onSkip}
                  className="shrink-0 text-[13px] font-medium text-white/45 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Skip tour
                </button>

                <div className="flex items-center gap-2">
                  {stepIndex > 0 ? (
                    <button
                      type="button"
                      onClick={goPrev}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/5 px-3.5 text-[13px] font-medium text-white/80 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white active:scale-95"
                    >
                      <ArrowLeft size={15} />
                      Back
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={goNext}
                    autoFocus
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-tourAccent px-5 text-[13px] font-semibold text-[#1d1407] shadow-[0_8px_24px_-8px_rgb(var(--tour-accent-rgb)/0.8)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tourAccent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-tourSurface active:scale-95"
                  >
                    {isLast ? "Finish" : "Next"}
                    {isLast ? null : <ArrowRight size={15} />}
                  </button>
                </div>
              </div>

              {/* Keyboard shortcuts are desktop-only affordances. */}
              <div className="mt-4 hidden items-center gap-1.5 border-t border-white/10 pt-3 text-[10.5px] text-white/35 sm:flex">
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
                <span>to move</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <Kbd>Esc</Kbd>
                  <span>to exit</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-sans text-[10px] leading-none text-white/55">
      {children}
    </kbd>
  );
}
