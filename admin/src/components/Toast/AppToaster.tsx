import { useEffect, useState } from "react";
import { Check, AlertTriangle, X as XIcon, Info } from "lucide-react";
import { dismissToast, subscribeToasts } from "@/components/Toast";

type ToastItem = {
  id: number;
  message: string;
  variant: "success" | "warning" | "error" | "info";
};

const mobileTone = {
  success: "bg-[var(--primary-color)]",
  warning: "bg-[#b54708]",
  error: "bg-[#b42318]",
  info: "bg-[var(--primary-color)]",
} as const;

const desktopIcon = {
  success: { Icon: Check, className: "text-emerald-400" },
  warning: { Icon: AlertTriangle, className: "text-amber-400" },
  error: { Icon: AlertTriangle, className: "text-rose-400" },
  info: { Icon: Info, className: "text-slate-300" },
} as const;

export default function AppToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  const current = toasts[toasts.length - 1];
  if (!current) return null;

  const DesktopIcon = desktopIcon[current.variant]?.Icon ?? Check;
  const desktopIconClass =
    desktopIcon[current.variant]?.className ?? "text-slate-300";

  return (
    <>
      {/* Mobile: centered pill at top */}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex justify-center px-4 md:hidden"
        aria-live="polite"
      >
        <div
          key={`mobile-${current.id}`}
          role="status"
          className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-full ${mobileTone[current.variant]} px-4 py-2.5 text-white shadow-lg shadow-black/10 animate-[toast-in_220ms_ease-out]`}
        >
          <p className="min-w-0 flex-1 text-center text-[13px] font-medium leading-snug tracking-tight">
            {current.message}
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(current.id)}
            className="shrink-0 rounded-full px-1.5 text-[15px] leading-none text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>

      {/* Desktop: compact dark toast, bottom-right */}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[9999] hidden md:block"
        aria-live="polite"
      >
        <div
          key={`desktop-${current.id}`}
          role="status"
          className="pointer-events-auto flex w-[min(20rem,calc(100vw-3rem))] items-center gap-3 rounded-lg bg-slate-900 px-3.5 py-3 text-white shadow-lg shadow-slate-900/25 animate-[toast-in-desktop_200ms_ease-out]"
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 ${desktopIconClass}`}
          >
            <DesktopIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <p className="min-w-0 flex-1 text-left text-[13px] font-medium leading-snug text-white/95">
            {current.message}
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismissToast(current.id)}
            className="shrink-0 rounded p-0.5 text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toast-in-desktop {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
