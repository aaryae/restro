import type { PaymentIntentData } from "@/redux/services/payment";
import { useEffect } from "react";
import { handleResponse } from "@/utils/responseHandler";

type FetchQrStatus = (
  id: number,
  silent: boolean,
) => Promise<{ success?: boolean; data?: PaymentIntentData }>;

type UseQrPaymentPollingOptions = {
  isOpen: boolean;
  dynamicIntent: PaymentIntentData | null;
  fetchQrStatus: FetchQrStatus;
  onIntentUpdate: (intent: PaymentIntentData) => void;
  onPaid: () => void;
  onSessionError: (message: string) => void;
};

export function useQrPaymentPolling({
  isOpen,
  dynamicIntent,
  fetchQrStatus,
  onIntentUpdate,
  onPaid,
  onSessionError,
}: UseQrPaymentPollingOptions) {
  useEffect(() => {
    if (!isOpen || !dynamicIntent || dynamicIntent.status !== "pending") return;

    const POLL_INTERVAL_MS = 5000;
    const MAX_POLL_ATTEMPTS = 60;
    let attempts = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const res = await fetchQrStatus(dynamicIntent.id, false);
        if (res.success && res.data) {
          onIntentUpdate(res.data);
          if (res.data.status === "paid") {
            if (intervalId) clearInterval(intervalId);
            handleResponse({
              res: { success: true, message: "NEPALPAY payment received" },
            });
            onPaid();
          }
        }
      } catch (error: unknown) {
        const err = error as { status?: number; originalStatus?: number };
        const status = err?.status ?? err?.originalStatus;
        if (status === 401 || status === 403) {
          onSessionError(
            "Session expired while waiting for payment. Refresh the page and check order status.",
          );
        }
      }
    };

    intervalId = setInterval(() => {
      attempts += 1;
      if (attempts > MAX_POLL_ATTEMPTS) {
        if (intervalId) clearInterval(intervalId);
        return;
      }
      void poll();
    }, POLL_INTERVAL_MS);

    void poll();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isOpen,
    dynamicIntent?.id,
    dynamicIntent?.status,
    fetchQrStatus,
    onIntentUpdate,
    onPaid,
    onSessionError,
  ]);
}
