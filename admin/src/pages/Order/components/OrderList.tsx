import CancelOrderModal from "@/components/CancelOrderModal";
import Drawer from "@/components/Drawer";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useUpdateOrderStatusMutation } from "@/redux/services/orders";
import { CurrencySign } from "@/constants";
import { buildQueryString } from "@/utils/generalHelper";
import { buildCheckoutPath } from "@/utils/checkoutNavigation";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { format } from "date-fns";
import { ReactNode, useEffect, useState } from "react";
import { Eye, Banknote, CircleCheckBig, Clock3, ReceiptText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ViewOrder from "../ViewOrder";
import OrderFilter from "./OrderFilter";
import "../posBrand.css";

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
  tone?: "slate" | "gold" | "navy" | "rose";
}) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    gold: "pos-pill-gold border",
    navy: "pos-pill-navy border",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${tones[tone]}`}
    >
      {value}
    </span>
  );
}

function paymentTone(status?: string): "slate" | "gold" | "navy" | "rose" {
  const value = (status || "").toLowerCase().replace(/_/g, " ");
  if (value === "paid" || value === "completed") return "navy";
  if (value === "pending") return "gold";
  if (value === "partially paid" || value === "partial") return "gold";
  if (value === "cancelled" || value === "failed") return "rose";
  return "slate";
}

function formatPaymentStatus(status?: string) {
  if (!status) return "-";
  return status.replace(/_/g, " ");
}

function orderStatusTone(status?: string): "slate" | "gold" | "navy" | "rose" {
  const value = (status || "").toLowerCase();
  if (value === "completed") return "navy";
  if (value === "pending") return "gold";
  if (value === "cancelled") return "rose";
  return "slate";
}

function canCheckoutOrder(status?: string, paymentStatus?: string) {
  const orderStatus = String(status || "").toLowerCase();
  const pay = String(paymentStatus || "").toLowerCase();
  if (orderStatus === "completed" || orderStatus === "cancelled") return false;
  if (pay === "paid") return false;
  return true;
}

export default function OrderList() {
  const navigate = useNavigate();
  const { query, handlePagination } = usePagination({ limit: 10, page: 1 });

  const [queryStringOptions, setQueryStringOptions] = useState({
    start: null,
    end: null,
    paymentStatus: null,
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

  const handleOpenCheckout = (
    orderIdForCheckout: number,
    tableIdForCheckout?: number | null,
  ) => {
    setOpen(false);
    navigate(
      buildCheckoutPath({
        orderId: orderIdForCheckout,
        tableId: tableIdForCheckout ?? null,
      }),
    );
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
    "Table",
    "Type",
    "Started",
    "Amount",
    "Payment",
    "Status",
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
              <StatusPill value={formatOrderType(orderType)} tone="navy" />
            </span>,
            <span
              className={`whitespace-nowrap text-[12px] text-slate-600 ${
                status === "cancelled" ? "line-through opacity-60" : ""
              }`}
            >
              {format(new Date(orderStartTime), "MMM d, h:mm a")}
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
                tone={paymentTone(paymentStatus)}
              />
            </span>,
            <span className={status === "cancelled" ? "line-through opacity-60" : ""}>
              <StatusPill
                value={formatPaymentStatus(status)}
                tone={orderStatusTone(status)}
              />
            </span>,
            <TableRowActions>
              <button
                type="button"
                onClick={() => handleViewOrder(id)}
                className="pos-action-btn"
                title="View order"
              >
                <Eye size={16} strokeWidth={2.25} />
              </button>
              {canCheckoutOrder(status, paymentStatus) ? (
                <button
                  type="button"
                  onClick={() => handleOpenCheckout(id, table?.id)}
                  className="pos-action-btn pos-action-btn--checkout"
                  title="Checkout"
                >
                  <Banknote size={16} strokeWidth={2.25} />
                </button>
              ) : null}
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
            </TableRowActions>,
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
            tone="gold"
          />
          <StatCard
            label="Completed"
            value={String(completedCount)}
            icon={<CircleCheckBig size={14} />}
            tone="navy"
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
          <ViewOrder
            id={orderId}
            isOpen={open}
            setIsOpen={setOpen}
            onOpenCheckout={handleOpenCheckout}
          />
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
  tone: "slate" | "gold" | "navy";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-600",
    gold: "pos-card-gold border",
    navy: "pos-card-navy border",
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
