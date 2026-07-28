import Checkbox from "@/components/Checkbox";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { StatusTag } from "../ViewTableOrder";
import CustomDialog from "@/components/Dialog";
import ConfirmTransfer from "./ConfirmTransfer";
import { useMemo, useState } from "react";
import { CurrencySign } from "@/constants";

function formatTableLabel(table?: {
  floor?: { name?: string } | null;
  tableNo?: string | number;
} | null) {
  if (!table) return "-";
  const floor = table.floor?.name ? `${table.floor.name} ` : "";
  return `${floor}Table ${table.tableNo ?? ""}`.trim() || "-";
}

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
  const { data: tableOrder, isLoading: loading } = useGetApiQuery({
    url: `${ORDER_URL}active-orders/${selectedTable}`,
  });

  const { data: selectedTableData } = useGetApiQuery(
    { url: `${TABLE_URL}${selectedTable}` },
    { skip: !selectedTable },
  );

  const { data: destinationTableData } = useGetApiQuery(
    { url: `${TABLE_URL}${selectedDesiredTable}` },
    { skip: !selectedDesiredTable },
  );

  const orders = tableOrder?.data?.orders || [];

  const selectedOrderDetails = useMemo(
    () => orders.filter((order: any) => selectedOrders.includes(order.id)),
    [orders, selectedOrders],
  );

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

  const sourceTableLabel = formatTableLabel(selectedTableData?.data);
  const destinationTableLabel = formatTableLabel(destinationTableData?.data);
  const tableLabel = selectedTableData?.data
    ? sourceTableLabel
    : "selected table";

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Active orders on{" "}
          <span className="font-medium text-slate-800">{tableLabel}</span>
        </p>

        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primaryColor" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No active orders found on this table.
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {orders.map((order: any) => (
              <label
                key={order.id}
                className={`flex cursor-pointer gap-3 rounded-xl border bg-white p-3.5 transition ${
                  selectedOrders.includes(order.id)
                    ? "border-primaryColor/40 ring-2 ring-primaryColor/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onChange={(e) =>
                    handleOrderSelect(order.id, e.target.checked)
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusTag status={order.status} orderId={order.id} />
                      <span className="text-sm font-medium text-slate-800">
                        Order #{order.orderNumber}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">
                        {CurrencySign}
                        {Number(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.orderItems.length} items
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                    {order.orderItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 text-xs text-slate-600"
                      >
                        <div className="min-w-0">
                          <span className="font-medium text-slate-700">
                            {item.product.name}
                          </span>
                          <span className="ml-2 text-slate-400">
                            × {item.quantity}
                          </span>
                          {item.specialInstructions && (
                            <p className="italic text-slate-400">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0">
                          {CurrencySign}
                          {Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={selectedOrders.length === 0}
            className={`inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium text-white transition ${
              selectedOrders.length > 0
                ? "bg-primaryColor hover:bg-primaryColor/90"
                : "cursor-not-allowed bg-slate-300"
            }`}
            onClick={handleComplete}
          >
            Continue ({selectedOrders.length} selected)
          </button>
        </div>
      </div>

      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Confirm Transfer"
        titleDescription="Review the transfer details before moving the selected orders."
        contentClassName="max-w-md"
      >
        <ConfirmTransfer
          selectedOrders={selectedOrders}
          selectedOrderDetails={selectedOrderDetails}
          sourceTableLabel={sourceTableLabel}
          destinationTableLabel={destinationTableLabel}
          sourceTableId={selectedTable}
          destinationTableId={selectedDesiredTable}
          onCancel={() => setDialogOpen(false)}
          onSuccess={() => {
            setDialogOpen(false);
            onComplete();
          }}
        />
      </CustomDialog>
    </>
  );
}
