import { useEffect, useState } from "react";
import { dismissToast, subscribeToasts } from "@/components/Toast";

type ToastItem = {
  id: number;
  message: string;
  variant: "success" | "warning" | "error" | "info";
};

export default function AppToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  const current = toasts[toasts.length - 1];
  if (!current) return null;

  const tone =
    current.variant === "error"
      ? "bg-[#b42318]"
      : current.variant === "warning"
        ? "bg-[#b54708]"
        : "bg-[var(--primary-color)]";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex justify-center px-4"
      aria-live="polite"
    >
      <div
        key={current.id}
        role="status"
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-full ${tone} px-4 py-2.5 text-white shadow-lg shadow-black/10 animate-[toast-in_220ms_ease-out]`}
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
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
