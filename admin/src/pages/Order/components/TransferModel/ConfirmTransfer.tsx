import { useState } from "react";
import Button from "@/components/Button";
import { useCreateApiMutation } from "@/redux/services/crudApi";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useMoveOrderItemsMutation } from "@/redux/services/orders";

interface ConfirmTransferProps {
  selectedOrders: number[];
  sourceTableId: number | null;
  destinationTableId: number | null;
  onSuccess: () => void;
}

function ConfirmTransfer({
  selectedOrders,
  sourceTableId,
  destinationTableId,
  onSuccess,
}: ConfirmTransferProps) {
  console.log(
    selectedOrders,
    sourceTableId,
    destinationTableId,
    "selectedOrders",
  );
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

      console.log(response, "response");

      handleResponse({
        res: response,
        onSuccess: onSuccess,
      });
    } catch (err) {
      console.log(err, "err");
      handleError({ error: err });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Transfer Confirmation
        </h3>
        <div className="text-sm text-blue-800">
          <p className="mb-2">
            <strong>Source Table:</strong> Table {sourceTableId}
          </p>
          <p className="mb-2">
            <strong>Destination Table:</strong> Table {destinationTableId}
          </p>
          <p className="mb-2">
            <strong>Orders to Move:</strong> {selectedOrders.length} order(s)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          className="bg-gray-500 text-white px-4 py-2"
          handleClick={onSuccess}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-primaryColor text-white px-4 py-2"
          handleClick={handleConfirmTransfer}
          disabled={isLoading}
        >
          {isLoading ? "Transferring..." : "Confirm Transfer"}
        </Button>
      </div>
    </div>
  );
}

export default ConfirmTransfer;
