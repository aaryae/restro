import {
  CreditCard,
  LayoutDashboard,
  Play,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";
import { INTRO_VIDEO_URL } from "@/onboarding/video";
import VideoEmbed from "./VideoEmbed";

const HIGHLIGHTS = [
  {
    icon: LayoutDashboard,
    title: "See the day",
    body: "Revenue, costs and cash, updated as your floor works.",
  },
  {
    icon: UtensilsCrossed,
    title: "Build your menu",
    body: "Add items one by one, or bulk upload the sheet you already have.",
  },
  {
    icon: CreditCard,
    title: "Take orders",
    body: "Tables, KOTs and checkout — cash, card or NepalPay QR.",
  },
];

interface WelcomeModalProps {
  onStartTour: () => void;
  onDismiss: () => void;
}

export default function WelcomeModal({
  onStartTour,
  onDismiss,
}: WelcomeModalProps) {
  const firstName = useAppSelector((state) => state.profile.firstName);
  const username = useAppSelector((state) => state.profile.username);
  const greetingName = firstName || username || "there";

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-md"
        onClick={onDismiss}
      />

      {/* Shares the coach-mark identity: dark chrome, lit by the brand accent,
          so first-run clearly reads as a guided layer over the app. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-xl animate-tour-in rounded-2xl bg-gradient-to-b from-white/25 via-white/10 to-white/5 p-px shadow-[0_40px_100px_-24px_rgba(0,0,0,0.9)] motion-reduce:animate-none"
      >
        <div className="relative max-h-[86vh] overflow-y-auto overflow-x-hidden rounded-[15px] bg-tourSurface">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-28 left-1/2 h-52 w-[24rem] -translate-x-1/2 rounded-full bg-tourAccent/25 blur-3xl"
          />

          <div className="relative px-5 pb-6 pt-7 sm:px-7 sm:pb-7 sm:pt-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tourAccent/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-tourAccent ring-1 ring-inset ring-tourAccent/30">
              <Sparkles size={12} />
              Welcome to Serve
            </span>

            <h2
              id="welcome-title"
              className="mt-3 text-[22px] font-semibold leading-snug tracking-tight text-white sm:text-[26px]"
            >
              Hi {greetingName}, let’s get your cafe running
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60 sm:text-[15px]">
              Serve runs your floor, your menu and your books in one place.
              Here’s a two-minute tour of where everything lives.
            </p>

            {INTRO_VIDEO_URL ? (
              <div className="mt-5">
                <VideoEmbed url={INTRO_VIDEO_URL} title="Introduction to Serve" />
              </div>
            ) : null}

            <ul className="mt-5 space-y-2">
              {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="group flex items-start gap-3 rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.07] hover:ring-tourAccent/30"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tourAccent/15 text-tourAccent ring-1 ring-inset ring-tourAccent/25 transition group-hover:bg-tourAccent/25">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">
                      {title}
                    </span>
                    <span className="block text-[13px] leading-relaxed text-white/55">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Primary action first on phones, where thumbs start at the bottom. */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onDismiss}
                className="h-11 rounded-xl bg-white/5 px-4 text-sm font-semibold text-white/80 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white active:scale-[0.98]"
              >
                Explore on my own
              </button>
              <button
                type="button"
                onClick={onStartTour}
                autoFocus
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-tourAccent px-5 text-sm font-semibold text-[#1d1407] shadow-[0_10px_30px_-8px_rgb(var(--tour-accent-rgb)/0.8)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tourAccent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-tourSurface active:scale-[0.98]"
              >
                <Play size={15} />
                Take the tour
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-white/35">
              You can replay this any time from the help button in the top bar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
