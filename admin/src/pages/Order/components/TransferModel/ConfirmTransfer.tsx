import { useState } from "react";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useMoveOrderItemsMutation } from "@/redux/services/orders";
import { ArrowRightLeft } from "lucide-react";

interface ConfirmTransferProps {
  selectedOrders: number[];
  sourceTableId: number | null;
  destinationTableId: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function ConfirmTransfer({
  selectedOrders,
  sourceTableId,
  destinationTableId,
  onSuccess,
  onCancel,
}: ConfirmTransferProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveOrderItems] = useMoveOrderItemsMutation();

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

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ArrowRightLeft size={16} className="text-primaryColor" />
          Transfer summary
        </div>
        <dl className="space-y-2 text-sm text-slate-600">
          <div className="flex justify-between gap-3">
            <dt>Source table ID</dt>
            <dd className="font-medium text-slate-800">{sourceTableId}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Destination table ID</dt>
            <dd className="font-medium text-slate-800">{destinationTableId}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Orders to move</dt>
            <dd className="font-medium text-slate-800">
              {selectedOrders.length}
            </dd>
          </div>
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
