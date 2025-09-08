import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { format } from "date-fns";
import usePagination from "@/hooks/usePagination";
import Button from "@/components/Button";
import { useReactToPrint } from "react-to-print";

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
  table?: { tableNo?: string; name?: string } | null;
  createdBy?: { name?: string; table?: { name?: string } } | null;
  orderItems?: OrderItem[];
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
};

export default function KotList() {
  const { query, handlePagination } = usePagination({ limit: 6, page: 1 });
  const [activeTab, setActiveTab] = useState<"active" | "paid">("active");

  const url = useMemo(() => {
    return buildQueryString("order/list", {
      page: query.page,
      limit: query.limit,
    });
  }, [query]);

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

  const filteredOrders = useMemo(() => {
    if (!orders) return [] as Order[];
    if (activeTab === "paid") {
      return orders.filter((o) => o.paymentStatus?.toLowerCase() === "paid");
    }
    // Active = unpaid or not yet paid
    return orders.filter((o) => o.paymentStatus?.toLowerCase() !== "paid");
  }, [orders, activeTab]);

  const totalPages = data?.data?.totalPages ?? 1;
  const offset = (query.page - 1) * query.limit;

  return (
    <>
      {/* Tabs */}
      <div className="mt-4 mb-2 flex items-center gap-2">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-md border text-sm ${
            activeTab === "active"
              ? "bg-primaryColor text-white border-primaryColor"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`px-4 py-2 rounded-md border text-sm ${
            activeTab === "paid"
              ? "bg-primaryColor text-white border-primaryColor"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Paid
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {isSuccess && filteredOrders?.length > 0 ? (
          filteredOrders.map((order) => (
            <KotCard key={order.id} order={order} kotNo={order.id} />
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
        <div className="text-sm text-gray-700">Page {query.page} of {totalPages}</div>
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

function KotCard({ order, kotNo }: { order: Order; kotNo: number }) {
  const items = (order?.orderItems || []).filter(
    (i) => i.status !== "cancelled",
  );

  const contentRef = useRef<HTMLDivElement>(null);
  const printedBy = useSelector((s: RootState) => s.auth.username);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `KOT-${order.id}`,
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

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm ">
      <div ref={contentRef} className="p-5 h-fit kot-print ">
        <div className="text-center kot-title text-[20px] font-bold tracking-wide mb-3">
          KOT {kotNo}
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
                ? format(new Date(order.orderStartTime), "dd LLL yyyy hh:mm a")
                : "-"}
            </div>
          </div>
          <div className="text-right">
            <div>
              <span className="font-semibold">Table:</span>{" "}
              {order?.table?.tableNo || order?.table?.name || "-"}
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
      <div className="flex justify-center mb-4 no-print">
        <Button
          className="bg-primaryColor text-white px-8 py-[10px] rounded-[4px]"
          handleClick={reactToPrintFn}
        >
          {" "}
          Print
        </Button>
      </div>
    </div>
  );
}

function formatOrderType(v?: string) {
  if (!v) return "-";
  if (v.toLowerCase() === "dinein") return "Dine In";
  return v.charAt(0).toUpperCase() + v.slice(1);
}
