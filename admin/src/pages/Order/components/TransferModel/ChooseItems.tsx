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
}: {
  selectedTable: number | null;
  selectedDesiredTable: number | null;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    data: tableOrder,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery({ url: `${ORDER_URL}active-orders/${selectedTable}` });

  const { data: selectedTableData } = useGetApiQuery({
    url: `${TABLE_URL}${selectedTable}`,
  });

  const orders = tableOrder?.data?.orders;

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
              <StatusTag status={order.status} orderId={order.id} />

              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <>
                    <div
                      key={item.id}
                      className=" border-b border-gray-200 py-2 gap-6 flex items-center"
                    >
                      <Checkbox
                        key={item.id}
                        checked={item.selected}
                        onChange={(e) => {}}
                      />
                      <div className="flex justify-between items-center w-full">
                        <div className="leading-[1.5] text-gray-600 ">
                          <p className="font-medium text-[14px]">
                            Item: {item.product.name}
                          </p>
                          <p className="flex text-[13px]">
                            Qty: {item.quantity}
                          </p>
                          {item.specialInstructions && (
                            <p className="text-xs italic">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="leading-[1.5] text-gray-600 text-right">
                          <p className="text-[14px]">
                            Rs. {Number(item.product.price).toFixed(2)} each
                          </p>
                          <p className="text-[13px]">
                            Subtotal: Rs.
                            {Number(item.subtotal).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-lg font-semibold text-gray-800">
                  Total: Rs.{Number(order.totalAmount).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          className="bg-primaryColor text-white px-4 py-2 mt-6"
          handleClick={() => setDialogOpen(true)}
        >
          Complete
        </Button>
      </div>
      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Confirm Transfer"
        contentClassName="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-auto p-2 sm:p-4"
      >
        <ConfirmTransfer />
      </CustomDialog>
    </>
  );
}
