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
import { useUpdateKotMutation } from "@/redux/services/kot";

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
  });

  const url = useMemo(() => {
    return buildQueryString("kot/list", {
      page: query.page,
      limit: query.limit,
      search: queryStringOptions,
    });
  }, [query, queryStringOptions]);

  const { data: kots, isSuccess } = useGetApiQuery({ url });

  useEffect(() => {
    if (kots?.data) {
      handlePagination({
        total: kots.data.total,
        totalPages: kots.data.totalPages,
      });
    }
  }, [kots, handlePagination]);

  const totalPages = kots?.data?.totalPages ?? 1;
  const offset = (query.page - 1) * query.limit;

  return (
    <>
      <div className="md:flex md:gap-2 my-4 grid grid-cols-4 gap-2 pb-8">
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
            queryStringOptions.status === "preparing"
              ? "bg-blue-500 text-white"
              : ""
          }`}
          onClick={() =>
            setQueryStringOptions((cur) => ({ ...cur, status: "preparing" }))
          }
        >
          Preparing
        </button>
        <button
          className={`px-3 py-2 rounded border ${
            queryStringOptions.status === "ready"
              ? "bg-blue-500 text-white"
              : ""
          }`}
          onClick={() =>
            setQueryStringOptions((cur) => ({ ...cur, status: "ready" }))
          }
        >
          Ready
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
        {isSuccess && kots?.data?.data?.length > 0 ? (
          kots?.data?.data?.map((kot, idx) => (
            <KotCard
              key={kot.id}
              kot={kot}
              // Name older KOT earlier: sequential queue number across pages
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No kot found
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {kots?.data?.data?.length > 0 && (
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
      )}
    </>
  );
}

function KotCard({ kot }) {
  const [updateKot] = useUpdateKotMutation();
  const items = kot?.orderItems || [];

  const contentRef = useRef<HTMLDivElement>(null);
  const printedBy = useSelector((s: RootState) => s.auth.username);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: `KOT-${kot.kotNumber}`,
    pageStyle: `
      @page { size: 80mm auto; margin: 4mm; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .kot-print { width: 80mm !important; font-size: 10px !important; line-height: 1.25 !important; }
        .kot-print * { font-size: 10px !important; line-height: 1.25 !important; }
        .kot-print .kot-title { font-size: 14px !important; font-weight: 800 !important; }
        .kot-print .tight { margin: 4px 0 !important; padding: 0 !important; }
        .kot-print .section-gap { margin: 6px 0 !important; }
        .kot-print .border-dashed { border-color: #000 !important; }
        .kot-print .border-t { border-top-width: .5008px !important; border-top-style: dashed !important; border-top-color: #000 !important; }
        .kot-print .divider-dashed {
          border: 0 !important;
          height: 1px !important;
          background-image: repeating-linear-gradient(to right, #000 0, #000 8px, transparent 8px, transparent 12px) !important;
          background-repeat: repeat-x !important;
          background-size: 100% 1px !important;
          background-position: 0 .5008px !important;
        }
        .no-print { display: none !important; }
      }
    `,
  });

  const totalDish = items.length;
  console.log("totalDish", items);
  const totalQty = items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

  const [openCheckout, setOpenCheckout] = useState(false);

  return (
    <>
      <div
        className={`relative bg-white border border-gray-200 rounded-xl shadow-sm ${kot.status === "preparing" ? "border-blue-600" : kot.status === "ready" ? "border-green-500" : kot.status === "pending" ? "border-yellow-500" : kot.status === "cancelled" ? "border-red-500" : "border-gray-500"}`}
      >
        {/* Status Ribbon - top right corner (screen only) */}
        <div
          className="no-print absolute top-[1rem] -right-[0.5rem] "
          title={`Status: ${kot.status ?? "-"}`}
        >
          <div
            className={`px-3 py-1 shadow-sm border rounded-br-full ${
              kot.status === "ready"
                ? "bg-green-600 border-green-700 text-white"
                : kot.status === "pending"
                  ? "bg-yellow-400 border-yellow-500 text-black"
                  : kot.status === "preparing"
                    ? "bg-blue-600 border-blue-700 text-white"
                    : kot.status === "cancelled"
                      ? "bg-red-600 border-red-700 text-white"
                      : "bg-gray-500 border-gray-600 text-white"
            }`}
          >
            <span className="uppercase text-[10px] font-semibold tracking-wide">
              {kot.status ?? "-"}
            </span>
          </div>
        </div>
        <div ref={contentRef} className="p-5 h-fit kot-print ">
          <div className="text-center kot-title text-[20px] font-bold tracking-wide mb-3">
            KOT {kot.kotNumber}
          </div>
          <div className="flex justify-between text-[12px] text-gray-800">
            <div className="flex flex-col gap-[2px]">
              <div className="flex">
                <span className="font-semibold">Type:</span>{" "}
                {formatOrderType(kot?.order?.orderType)}
              </div>
              <div className="flex">
                <span className="font-semibold">Order By:</span>{" "}
                {kot?.order?.createdBy?.table?.name ||
                  kot?.order?.table?.tableNo ||
                  "-"}
              </div>
              <div>
                <span className="font-semibold">Order At:</span>{" "}
                {kot?.order?.orderStartTime
                  ? format(
                      new Date(kot?.order?.orderStartTime),
                      "dd LLL yyyy hh:mm a",
                    )
                  : "-"}
              </div>
            </div>
            <div className="text-right">
              <div>
                <span className="font-semibold">
                  {kot?.order?.orderType === "dineIn" ? "Table:" : "Customer:"}
                </span>{" "}
                {kot?.order?.orderType === "dineIn" &&
                  kot?.order?.table?.tableNo}
                {kot?.order?.orderType === "takeaway" &&
                  kot?.order?.takeAwayName}
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
            {items.map((it, index) => (
              <>
                <div key={String(it.id)} className="grid grid-cols-12 ">
                  <div className="col-span-8 flex gap-2">
                    <span>{index + 1}.</span>
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
              <p>
                Printed By: {printedBy || kot?.order?.createdBy?.name || "-"}
              </p>
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

          {kot.status === "ready" && (
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

          {kot.status === "pending" && (
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-[10px] rounded-[4px]"
              handleClick={async () => {
                try {
                  const response = await updateKot({
                    body: { status: "preparing" },
                    id: kot.id,
                  }).unwrap();
                  handleResponse({ res: response });
                } catch (error) {
                  handleError({ error });
                }
              }}
            >
              Move to Preparing
            </Button>
          )}
          {kot.status === "preparing" && (
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-[10px] rounded-[4px]"
              handleClick={async () => {
                try {
                  const response = await updateKot({
                    body: { status: "ready" },
                    id: kot.id,
                  }).unwrap();
                  handleResponse({ res: response });
                } catch (error) {
                  handleError({ error });
                }
              }}
            >
              Move to Ready
            </Button>
          )}
        </div>
        {openCheckout && <CheckoutModal
          isOpen={openCheckout}
          onClose={() => setOpenCheckout(false)}
          tableId={Number(kot?.order?.table?.id || 0)}
          orderId={kot.id}
        />}
      </div>
    </>
  );
}

function formatOrderType(v?: string) {
  if (!v) return "-";
  if (v.toLowerCase() === "dinein") return "Dine In";
  return v.charAt(0).toUpperCase() + v.slice(1);
}
