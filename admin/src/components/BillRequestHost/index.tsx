import { useEffect, useMemo, useState } from "react";
import { Receipt, X } from "lucide-react";
import useWebSocket from "@/hooks/useWebSocket";
import { useAppSelector } from "@/redux/store/hooks";
import {
  useGetApiQuery,
  usePatchApiMutation,
} from "@/redux/services/crudApi";
import { handleError } from "@/utils/responseHandler";
import { getToken } from "@/utils/tokenHandler";

type OpenRequest = {
  id: number;
  message: string;
  createdAt?: string;
  table?: { id: number; tableNo: string } | null;
};

export default function BillRequestHost() {
  const token = getToken("token");
  const { connect, disconnect } = useWebSocket();
  const socketMessages = useAppSelector((state) => state.socket.message);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const { data, refetch } = useGetApiQuery(
    { url: "service-request/open" },
    { skip: !token, pollingInterval: 45000 },
  );
  const [markHandled] = usePatchApiMutation();

  useEffect(() => {
    if (!token) return;
    connect();
    return () => disconnect();
  }, [token, connect, disconnect]);

  useEffect(() => {
    const latest = socketMessages?.[socketMessages.length - 1] as
      | { type?: string }
      | undefined;
    if (
      latest?.type === "bill_requested" ||
      latest?.type === "bill_request_handled"
    ) {
      void refetch();
    }
  }, [socketMessages, refetch]);

  const requests: OpenRequest[] = useMemo(() => {
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.filter((row: OpenRequest) => !dismissed.has(row.id));
  }, [data, dismissed]);

  if (!token || requests.length === 0) return null;

  const top = requests[0];

  const handleDone = async (id: number) => {
    try {
      await markHandled({
        url: `service-request/${id}/handled`,
        body: {},
      }).unwrap();
      setDismissed((prev) => new Set(prev).add(id));
      void refetch();
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex justify-center px-3 md:top-4">
      <div className="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg shadow-amber-900/10">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <Receipt size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-950">
            {top.message ||
              `Table ${top.table?.tableNo || "?"} requested the bill`}
          </p>
          <p className="mt-0.5 text-xs text-amber-800/80">
            {requests.length > 1
              ? `${requests.length} open bill requests`
              : "Guest is waiting at the table"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDone(top.id)}
              className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-950"
            >
              Mark handled
            </button>
            {requests.length > 1 ? (
              <span className="self-center text-[11px] font-medium text-amber-800">
                +{requests.length - 1} more
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() =>
            setDismissed((prev) => new Set(prev).add(top.id))
          }
          className="rounded-lg p-1 text-amber-800/70 transition hover:bg-amber-100 hover:text-amber-950"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
