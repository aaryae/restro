import Checkbox from "@/components/Checkbox";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { StatusTag } from "../ViewTableOrder";
import CustomDialog from "@/components/Dialog";
import ConfirmTransfer from "./ConfirmTransfer";
import { useState } from "react";
import Button from "@/components/Button";

export default function ChooseItems({
  selectedTable,
  selectedDesiredTable,
  onComplete,
}: {
  selectedTable: number | null;
  selectedDesiredTable: number | null;
  onComplete: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const {
    data: tableOrder,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery({ url: `${ORDER_URL}active-orders/${selectedTable}` });

  const { data: selectedTableData } = useGetApiQuery({
    url: `${TABLE_URL}${selectedTable}`,
  });

  const orders = tableOrder?.data?.orders;

  const handleOrderSelect = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  const handleComplete = () => {
    if (selectedOrders.length > 0) {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <div>
        <p className="text-lg font-semibold mb-4">
          Orders in {selectedTableData?.data?.floor?.name} Table
          {selectedTableData?.data?.tableNo}
        </p>
        <div className="space-y-2">
          {orders?.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onChange={(e) =>
                      handleOrderSelect(order.id, e.target.checked)
                    }
                  />
                  <div>
                    <StatusTag status={order.status} orderId={order.id} />
                    <p className="text-sm text-gray-600">
                      Order #{order.orderNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-800">
                    Total: Rs.{Number(order.totalAmount).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.orderItems.length} items
                  </p>
                </div>
              </div>

              <div className="space-y-1 ml-7">
                {order.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-1 text-sm text-gray-600"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-gray-500 ml-2">
                        Qty: {item.quantity}
                      </span>
                      {item.specialInstructions && (
                        <p className="text-xs italic text-gray-500">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p>Rs. {Number(item.subtotal).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          className="bg-primaryColor text-white px-4 py-2 mt-6"
          handleClick={handleComplete}
          disabled={selectedOrders.length === 0}
        >
          Complete ({selectedOrders.length} orders selected)
        </Button>
      </div>
      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Confirm Transfer"
        contentClassName="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-auto p-2 sm:p-4"
      >
        <ConfirmTransfer
          selectedOrders={selectedOrders}
          sourceTableId={selectedTable}
          destinationTableId={selectedDesiredTable}
          onSuccess={() => {
            setDialogOpen(false);
            onComplete();
          }}
        />
      </CustomDialog>
    </>
  );
}
