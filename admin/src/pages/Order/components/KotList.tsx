import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { format } from "date-fns";
import usePagination from "@/hooks/usePagination";
import Button from "@/components/Button";
import CheckoutModal from "./CheckoutModal";
import { useReactToPrint } from "react-to-print";
import { useUpdateOrderStatusMutation } from "@/redux/services/orders";
import { handleError, handleResponse } from "@/utils/responseHandler";

type OrderItem = {
  id: number | string;
  quantity: number;
  status?: string;
  product?: { name?: string };
  subtotal?: number;
};

type Order = {
  id: number;
  orderType?: string;
  orderStartTime?: string | Date;
  table?: { id?: number; tableNo?: string; name?: string } | null;
  createdBy?: { name?: string; table?: { name?: string } } | null;
  orderItems?: OrderItem[];
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  takeAwayName?: string;
};

export default function KotList() {
  const { query, handlePagination } = usePagination({ limit: 6, page: 1 });
  const [queryStringOptions, setQueryStringOptions] = useState({
    status: "all",
    sort: "oldest",
  });

  const url = useMemo(() => {
    return buildQueryString("order/list", {
      page: query.page,
      limit: query.limit,
      search: queryStringOptions,
    });
  }, [query, queryStringOptions]);

  const { data, isSuccess } = useGetApiQuery({ url });

  useEffect(() => {
    if (data?.data) {
      handlePagination({
        total: data.data.total,
        totalPages: data.data.totalPages,
      });
    }
  }, [data, handlePagination]);

  const orders: Order[] = useMemo(() => {
    const raw = data?.data?.data ?? [];
    return raw as Order[];
  }, [data]);

  const totalPages = data?.data?.totalPages ?? 1;
  const offset = (query.page - 1) * query.limit;

  return (
    <>
      <div className="flex gap-2 my-4">
        <button
          className={`px-3 py-2 rounded border ${
            queryStringOptions.status === "all" ? "bg-blue-500 text-white" : ""
          }`}
          onClick={() =>
            setQueryStringOptions((prev) => ({ ...prev, status: "all" }))
          }
        >
          All
        </button>
        <button
          className={`px-3 py-2 rounded border ${
            queryStringOptions.status === "pending"
              ? "bg-blue-500 text-white"
              : ""
          }`}
          onClick={() =>
            setQueryStringOptions((cur) => ({ ...cur, status: "pending" }))
          }
        >
          Pending
        </button>
        <button
          className={`px-3 py-2 rounded border ${
            queryStringOptions.status === "prepared"
              ? "bg-blue-500 text-white"
              : ""
          }`}
          onClick={() =>
            setQueryStringOptions((cur) => ({ ...cur, status: "prepared" }))
          }
        >
          Prepared
        </button>
        <button
          className={`px-3 py-2 rounded border ${
            queryStringOptions.status === "completed"
              ? "bg-blue-500 text-white"
              : ""
          }`}
          onClick={() =>
            setQueryStringOptions((cur) => ({ ...cur, status: "completed" }))
          }
        >
          Completed
        </button>
        <button
          className={`px-3 py-2 rounded border ${
            queryStringOptions.status === "cancelled"
              ? "bg-blue-500 text-white"
              : ""
          }`}
          onClick={() =>
            setQueryStringOptions((cur) => ({ ...cur, status: "cancelled" }))
          }
        >
          Cancelled
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {isSuccess && orders?.length > 0 ? (
          orders.map((order, idx) => (
            <KotCard
              key={order.id}
              order={order}
              // Name older KOT earlier: sequential queue number across pages
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No orders found
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="mt-4 flex items-center justify-between">
        <button
          className={`px-3 py-2 rounded border ${
            query.page === 1
              ? "text-gray-400 cursor-not-allowed bg-gray-100"
              : "bg-white hover:bg-gray-50"
          }`}
          disabled={query.page === 1}
          onClick={() =>
            handlePagination({ page: Math.max(1, query.page - 1) })
          }
        >
          Prev
        </button>
        <div className="text-sm text-gray-700">
          Page {query.page} of {totalPages}
        </div>
        <button
          className={`px-3 py-2 rounded border ${
            query.page >= totalPages
              ? "text-gray-400 cursor-not-allowed bg-gray-100"
              : "bg-white hover:bg-gray-50"
          }`}
          disabled={query.page >= totalPages}
          onClick={() =>
            handlePagination({ page: Math.min(totalPages, query.page + 1) })
          }
        >
          Next
        </button>
      </div>
    </>
  );
}

function KotCard({ order }: { order: Order }) {
  const [patchStatus] = useUpdateOrderStatusMutation();
  const items = (order?.orderItems || []).filter(
    (i) => i.status !== "cancelled",
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const printedBy = useSelector((s: RootState) => s.auth.username);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `KOT-${order.kotNo}`,
    pageStyle: `
      @page { size: 80mm auto; margin: 4mm; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .kot-print { width: 80mm !important; font-size: 12px !important; line-height: 1.25 !important; }
        .kot-print * { font-size: 12px !important; line-height: 1.25 !important; }
        .kot-print .kot-title { font-size: 16px !important; font-weight: 800 !important; }
        .kot-print .tight { margin: 4px 0 !important; padding: 0 !important; }
        .kot-print .section-gap { margin: 6px 0 !important; }
        .kot-print .border-dashed { border-color: #000 !important; }
        .kot-print .border-t { border-top-width: 0.5px !important; border-top-style: dashed !important; border-top-color: #000 !important; }
        .kot-print .divider-dashed {
          border: 0 !important;
          height: 1px !important;
          background-image: repeating-linear-gradient(to right, #000 0, #000 8px, transparent 8px, transparent 12px) !important;
          background-repeat: repeat-x !important;
          background-size: 100% 1px !important;
          background-position: 0 0.5px !important;
        }
        .no-print { display: none !important; }
      }
    `,
  });

  const totalDish = items.length;
  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

  const [openCheckout, setOpenCheckout] = useState(false);

  return (
    <>
      <div
        className={`relative bg-white border border-gray-200 rounded-xl shadow-sm ${order.status === "completed" ? "border-green-500" : order.status === "pending" ? "border-yellow-500" : order.status === "cancelled" ? "border-red-500" : "border-blue-500"}`}
      >
        {/* Status Ribbon - top right corner (screen only) */}
        <div
          className="no-print absolute top-[1rem] -right-[0.5rem] "
          title={`Status: ${order.status ?? "-"}`}
        >
          <div
            className={`px-3 py-1 shadow-sm border rounded-br-full ${
              order.status === "completed"
                ? "bg-green-600 border-green-700 text-white"
                : order.status === "pending"
                  ? "bg-yellow-400 border-yellow-500 text-black"
                  : order.status === "prepared"
                    ? "bg-blue-600 border-blue-700 text-white"
                    : order.status === "cancelled"
                      ? "bg-red-600 border-red-700 text-white"
                      : "bg-gray-500 border-gray-600 text-white"
            }`}
          >
            <span className="uppercase text-[10px] font-semibold tracking-wide">
              {order.status ?? "-"}
            </span>
          </div>
        </div>
        <div ref={contentRef} className="p-5 h-fit kot-print ">
          <div className="text-center kot-title text-[20px] font-bold tracking-wide mb-3">
            KOT {order.kotNo}
          </div>
          <div className="flex justify-between text-[12px] text-gray-800">
            <div className="flex flex-col gap-[2px]">
              <div className="flex">
                <span className="font-semibold">Type:</span>{" "}
                {formatOrderType(order?.orderType)}
              </div>
              <div className="flex">
                <span className="font-semibold">Order By:</span>{" "}
                {order?.createdBy?.table?.name || order?.table?.tableNo || "-"}
              </div>
              <div>
                <span className="font-semibold">Order At:</span>{" "}
                {order?.orderStartTime
                  ? format(
                      new Date(order.orderStartTime),
                      "dd LLL yyyy hh:mm a",
                    )
                  : "-"}
              </div>
            </div>
            <div className="text-right">
              <div>
                <span className="font-semibold">
                  {order?.orderType === "dineIn" ? "Table:" : "Customer:"}
                </span>{" "}
                {order?.orderType === "dineIn" && order?.table?.tableNo}
                {order?.orderType === "takeaway" && order?.takeAwayName}
              </div>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-gray-400 divider-dashed"></div>

          <div className="grid grid-cols-12 text-[12px] font-semibold">
            <div className="col-span-8 flex">S.N Dishes</div>
            <div className="col-span-4 text-right">QTY</div>
          </div>

          <div className="my-2 border-t border-dashed border-gray-300 divider-dashed"></div>

          <div className="space-y-3 leading-[10px]">
            {items.map((it, i) => (
              <>
                <div key={String(it.id)} className="grid grid-cols-12 ">
                  <div className="col-span-8 flex gap-2">
                    <span>{i + 1}.</span>
                    <span>{it.product?.name || "-"}</span>
                  </div>
                  <div className="col-span-4 text-right">{it.quantity}</div>
                </div>
              </>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-gray-400 divider-dashed"></div>
          <div className="grid grid-cols-12 font-semibold text-[12px]">
            <div className="col-span-8 flex">Total (Dish/QTY)</div>
            <div className="col-span-4 text-right">
              {totalDish}/{totalQty}
            </div>
          </div>

          <div className="flex mt-4">
            <div className="flex flex-col items-start">
              <p>Printed By: {printedBy || order?.createdBy?.name || "-"}</p>
              <p>Printed At: {format(new Date(), "dd LLL yyyy hh:mm a")}</p>
            </div>
          </div>

          <div className="text-center mt-6 text-gray-700">Thank You!</div>
        </div>
        <div className="flex justify-center gap-3 mb-4 no-print">
          <Button
            className="bg-primaryColor text-white px-6 py-[10px] rounded-[4px]"
            handleClick={reactToPrintFn}
          >
            Print
          </Button>

          {order.status === "prepared" && (
            <>
              <div></div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-[10px] rounded-[4px]"
                handleClick={() => setOpenCheckout(true)}
              >
                Checkout
              </Button>
            </>
          )}

          {order.status === "pending" && (
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-[10px] rounded-[4px]"
              handleClick={async () => {
                try {
                  const response = await patchStatus({
                    body: { status: "prepared" },
                    id: order.id,
                  }).unwrap();
                  handleResponse({ res: response });
                } catch (error) {
                  handleError({ error });
                }
              }}
            >
              Move to Prepared
            </Button>
          )}
        </div>
        <CheckoutModal
          isOpen={openCheckout}
          onClose={() => setOpenCheckout(false)}
          tableId={Number(order?.table?.id || 0)}
          orderId={order.id}
        />
      </div>
    </>
  );
}

function formatOrderType(v?: string) {
  if (!v) return "-";
  if (v.toLowerCase() === "dinein") return "Dine In";
  return v.charAt(0).toUpperCase() + v.slice(1);
}
