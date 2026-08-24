import { useMemo, useState } from "react";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useMoveOrderItemsMutation } from "@/redux/services/orders";
import { ArrowRightLeft } from "lucide-react";
import { CurrencySign } from "@/constants";

export type TransferOrderSummary = {
  id: number;
  orderNumber?: string | null;
  totalAmount?: number | string | null;
  paymentStatus?: string | null;
  orderItems?: { id?: number; quantity?: number; status?: string }[];
};

interface ConfirmTransferProps {
  selectedOrders: number[];
  selectedOrderDetails: TransferOrderSummary[];
  sourceTableLabel: string;
  destinationTableLabel: string;
  sourceTableId: number | null;
  destinationTableId: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function formatPaymentStatus(status?: string | null) {
  if (!status) return "-";
  switch (status) {
    case "pending":
      return "Unpaid";
    case "partially_paid":
      return "Partially paid";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    default:
      return status.replace(/_/g, " ");
  }
}

function ConfirmTransfer({
  selectedOrders,
  selectedOrderDetails,
  sourceTableLabel,
  destinationTableLabel,
  sourceTableId,
  destinationTableId,
  onSuccess,
  onCancel,
}: ConfirmTransferProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveOrderItems] = useMoveOrderItemsMutation();

  const summary = useMemo(() => {
    const totalItems = selectedOrderDetails.reduce((sum, order) => {
      const items = Array.isArray(order.orderItems) ? order.orderItems : [];
      return (
        sum +
        items
          .filter((item) => item.status !== "cancelled")
          .reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0)
      );
    }, 0);

    const grandTotal = selectedOrderDetails.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    const paymentStatuses = [
      ...new Set(
        selectedOrderDetails.map((o) =>
          formatPaymentStatus(o.paymentStatus),
        ),
      ),
    ];

    return {
      totalItems,
      grandTotal,
      paymentStatus: paymentStatuses.join(", ") || "-",
    };
  }, [selectedOrderDetails]);

  const handleConfirmTransfer = async () => {
    if (!sourceTableId || !destinationTableId || selectedOrders.length === 0) {
      setError("Missing required information for transfer");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await moveOrderItems({
        body: {
          sourceTableId,
          destinationTableId,
          orderIds: selectedOrders,
        },
      }).unwrap();

      handleResponse({
        res: response,
        onSuccess,
      });
    } catch (err) {
      handleError({ error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const rows = [
    {
      label: "Source Table",
      value:
        sourceTableLabel !== "-"
          ? sourceTableLabel
          : sourceTableId
            ? `Table ID ${sourceTableId}`
            : "-",
    },
    {
      label: "Destination Table",
      value:
        destinationTableLabel !== "-"
          ? destinationTableLabel
          : destinationTableId
            ? `Table ID ${destinationTableId}`
            : "-",
    },
    { label: "Total Items", value: String(summary.totalItems) },
    {
      label: "Grand total",
      value: `${CurrencySign}${summary.grandTotal.toFixed(2)}`,
    },
    { label: "Payment Status", value: summary.paymentStatus },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ArrowRightLeft size={16} className="text-primaryColor" />
          Transfer summary
        </div>
        <dl className="space-y-2 text-sm text-slate-600">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-3">
              <dt>{row.label}</dt>
              <dd className="max-w-[60%] text-right font-medium text-slate-800">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:gap-3">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primaryColor px-5 text-sm font-medium text-white transition hover:bg-primaryColor/90 disabled:opacity-60"
          onClick={handleConfirmTransfer}
          disabled={isLoading}
        >
          {isLoading ? "Transferring..." : "Confirm Transfer"}
        </button>
      </div>
    </div>
  );
}

export default ConfirmTransfer;
