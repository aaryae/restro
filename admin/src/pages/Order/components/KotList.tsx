import { useEffect, useMemo } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { format } from "date-fns";
import usePagination from "@/hooks/usePagination";

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
};

export default function KotList() {
  // pagination (fixed limit: 6)
  const { query, handlePagination } = usePagination({ limit: 6, page: 1 });

  // fetch a reasonable chunk of recent orders
  const url = useMemo(() => {
    return buildQueryString("order/list", {
      page: query.page,
      limit: query.limit,
    });
  }, [query]);

  const { data, isSuccess } = useGetApiQuery({ url });

  // update pagination totals from API response
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
    // optionally filter out cancelled orders entirely if needed
    return raw as Order[];
  }, [data]);

  const totalPages = data?.data?.totalPages ?? 1;
  const offset = (query.page - 1) * query.limit;

  return (
    <>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isSuccess && orders?.length > 0 ? (
          orders.map((order, idx) => (
            <KotCard key={order.id} order={order} kotNo={offset + idx + 1} />
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

function KotCard({ order, kotNo }: { order: Order; kotNo: number }) {
  const items = (order?.orderItems || []).filter(
    (i) => i.status !== "cancelled",
  );

  const totalDish = items.length;
  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div>
        <div className="text-center text-2xl font-extrabold tracking-wide mb-3">
          KOT {kotNo}
        </div>
        <div className="flex justify-between text-[15px] text-gray-800">
          <div className="flex flex-col gap-2">
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

        <div className="my-3 border-t border-dashed border-gray-400"></div>

        <div className="grid grid-cols-12 text-[15px] font-semibold">
          <div className="col-span-8 flex">S.N Dishes</div>
          <div className="col-span-4 text-right">QTY</div>
        </div>

        <div className="my-2 border-t border-dashed border-gray-300"></div>

        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={String(it.id)} className="grid grid-cols-12 text-[15px]">
              <div className="col-span-8 flex gap-2">
                <span>{i + 1}.</span>
                <span>{it.product?.name || "-"}</span>
              </div>
              <div className="col-span-4 text-right">{it.quantity}</div>
            </div>
          ))}
        </div>

        <div className="my-3 border-t border-dashed border-gray-400"></div>
        <div className="grid grid-cols-12 font-semibold text-[15px]">
          <div className="col-span-8 flex">Total (Dish/QTY)</div>
          <div className="col-span-4 text-right">
            {totalDish}/{totalQty}
          </div>
          <div className="col-span-8 flex">Total Amount</div>
          <div className="col-span-4 text-right text-green-600">
            Rs.{Number(order.totalAmount).toFixed(2)}
          </div>
        </div>

        <div className="text-center mt-6 text-gray-700">Thank You!</div>
      </div>
    </div>
  );
}

function formatOrderType(v?: string) {
  if (!v) return "-";
  if (v.toLowerCase() === "dinein") return "Dine In";
  return v.charAt(0).toUpperCase() + v.slice(1);
}
