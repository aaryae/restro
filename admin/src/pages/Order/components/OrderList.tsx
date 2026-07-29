import CancelOrderModal from "@/components/CancelOrderModal";
import Drawer from "@/components/Drawer";
import Table from "@/components/Table";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useUpdateOrderStatusMutation } from "@/redux/services/orders";
import { CurrencySign } from "@/constants";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { format } from "date-fns";
import { ReactNode, useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import ViewOrder from "../ViewOrder";
import OrderFilter from "./OrderFilter";
import { CircleCheckBig, Clock3, ReceiptText } from "lucide-react";

function formatOrderType(type?: string) {
  if (!type) return "-";
  if (type.toLowerCase() === "dinein") return "Dine In";
  if (type.toLowerCase() === "takeaway") return "Takeaway";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function StatusPill({
  value,
  tone = "slate",
}: {
  value: string;
  tone?: "slate" | "amber" | "emerald" | "rose" | "blue";
}) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${tones[tone]}`}
    >
      {value}
    </span>
  );
}

function paymentTone(status?: string) {
  const value = (status || "").toLowerCase().replace(/_/g, " ");
  if (value === "paid" || value === "completed") return "emerald";
  if (value === "pending") return "amber";
  if (value === "partially paid" || value === "partial") return "blue";
  if (value === "cancelled" || value === "failed") return "rose";
  return "slate";
}

function formatPaymentStatus(status?: string) {
  if (!status) return "-";
  return status.replace(/_/g, " ");
}

function orderStatusTone(status?: string) {
  const value = (status || "").toLowerCase();
  if (value === "completed") return "emerald";
  if (value === "pending") return "amber";
  if (value === "cancelled") return "rose";
  return "slate";
}

export default function OrderList() {
  const { query, handlePagination } = usePagination({ limit: 10, page: 1 });

  const [queryStringOptions, setQueryStringOptions] = useState({
    start: null,
    end: null,
    paymentStatus: null,
    orderStatus: null,
  });

  const url = buildQueryString("order/list", {
    page: query.page,
    limit: query.limit,
    search: queryStringOptions,
  });

  const {
    data: allOrders,
    isSuccess: success,
    refetch,
  } = useGetApiQuery({ url });
  useEffect(() => {
    // Reduce backend load on shared hosting; refresh less frequently.
    const interval = setInterval(refetch, 60000);
    return () => clearInterval(interval);
  }, []);
  const [patchStatus] = useUpdateOrderStatusMutation();

  const [orderId, setOrderId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const [openCancel, setOpenCancel] = useState<boolean>(false);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const handleViewOrder = (id: number) => {
    setOrderId(id);
    setOpen(true);
  };

  const handleCancelTrigger = (id: number) => {
    setCancelId(id);
    setOpenCancel(true);
  };

  async function hanldeOrderCancellation() {
    try {
      const response = await patchStatus({
        id: cancelId,
        body: { status: "cancelled" },
      }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpenCancel(false);
    }
  }

  const pagination = {
    page: allOrders?.data?.page ?? 1,
    limit: allOrders?.data?.limit ?? 10,
    total: allOrders?.data?.total ?? 0,
    totalPages: allOrders?.data?.totalPages ?? 0,
  };

  const tableHeader = [
    "Table No",
    "Order Type",
    "Order StartedAt",
    "Amount",
    "Payment Status",
    "Order Status",
    "Actions",
  ];

  const tableData =
    success && allOrders?.data?.data
      ? allOrders?.data?.data?.map(
          ({
            id,
            table,
            orderType,
            orderStartTime,
            paymentStatus,
            status,
            totalAmount,
          }) => [
            <span
              className={`inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-semibold text-slate-700 ${
                status === "cancelled" ? "line-through opacity-60" : ""
              }`}
            >
              {table?.tableNo || "—"}
            </span>,
            <span className={status === "cancelled" ? "line-through opacity-60" : ""}>
              <StatusPill value={formatOrderType(orderType)} tone="blue" />
            </span>,
            <span
              className={`text-[12px] text-slate-600 ${
                status === "cancelled" ? "line-through opacity-60" : ""
              }`}
            >
              {format(new Date(orderStartTime), "PPp")}
            </span>,
            <span
              className={`font-semibold text-slate-800 ${
                status === "cancelled" ? "line-through opacity-60" : ""
              }`}
            >
              {CurrencySign}
              {Number(totalAmount || 0).toFixed(2)}
            </span>,
            <span className={status === "cancelled" ? "line-through opacity-60" : ""}>
              <StatusPill
                value={formatPaymentStatus(paymentStatus)}
                tone={paymentTone(paymentStatus) as any}
              />
            </span>,
            <span className={status === "cancelled" ? "line-through opacity-60" : ""}>
              <StatusPill
                value={formatPaymentStatus(status)}
                tone={orderStatusTone(status) as any}
              />
            </span>,
            <div
              key={id}
              className="flex items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={() => handleViewOrder(id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sky-600 transition hover:border-sky-200 hover:bg-sky-50"
                title="View order"
              >
                <FaEye size={14} />
              </button>
              {status === "pending" ? (
                <CancelOrderModal
                  open={openCancel}
                  setOpen={setOpenCancel}
                  itemId={id}
                  activeId={cancelId}
                  handleCancelTrigger={() => handleCancelTrigger(id)}
                  handleConfirmCancel={hanldeOrderCancellation}
                />
              ) : null}
            </div>,
          ],
        )
      : [];

  const pendingCount =
    allOrders?.data?.data?.filter((item) => item.status === "pending")
      ?.length ?? 0;
  const completedCount =
    allOrders?.data?.data?.filter((item) => item.status === "completed")
      ?.length ?? 0;

  return (
    <>
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatCard
            label="Total"
            value={String(allOrders?.data?.total ?? 0)}
            icon={<ReceiptText size={14} />}
            tone="slate"
          />
          <StatCard
            label="Pending"
            value={String(pendingCount)}
            icon={<Clock3 size={14} />}
            tone="amber"
          />
          <StatCard
            label="Completed"
            value={String(completedCount)}
            icon={<CircleCheckBig size={14} />}
            tone="emerald"
          />
        </div>

        <div className="space-y-3">
          <OrderFilter
            queryStringOptions={queryStringOptions}
            setQueryStringOptions={setQueryStringOptions}
          />
          <Table
            headers={tableHeader}
            data={tableData}
            pagination={pagination}
            handlePagination={handlePagination}
          />
        </div>

        <Drawer isOpen={open} setIsOpen={setOpen} width="w-full lg:w-[50%]">
          <ViewOrder id={orderId} isOpen={open} setIsOpen={setOpen} />
        </Drawer>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "slate" | "amber" | "emerald";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-600",
    amber: "border-amber-100 bg-amber-50/70 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-700",
  };

  return (
    <div
      className={`inline-flex min-w-[118px] items-center gap-2.5 rounded-xl border px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone]}`}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90">
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-medium opacity-80">{label}</p>
        <p className="text-base font-bold leading-tight text-slate-800">{value}</p>
      </div>
    </div>
  );
}
