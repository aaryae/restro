import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { format } from "date-fns";
import usePagination from "@/hooks/usePagination";
import Button from "@/components/Button";
import { useReactToPrint } from "react-to-print";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useUpdateKotMutation } from "@/redux/services/kot";
import { ChefHat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { buildCheckoutPath } from "@/utils/checkoutNavigation";

type OrderItem = {
  id: number | string;
  quantity: number;
  status?: string;
  product?: {
    id?: number | string;
    name?: string;
    price?: number | string;
  };
  specialInstructions?: string;
  addons?: Array<{
    quantity?: number;
    addon?: { name?: string };
  }>;
};

function getKotStatusTheme(status?: string) {
  switch (status) {
    case "all":
      return {
        border: "border-slate-300",
        stripe: "bg-slate-400",
        badge: "bg-slate-100 text-slate-700 border-slate-300",
        tint: "bg-white",
        label: "All",
        dot: "bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500",
        filterActive: "border-primaryColor bg-primaryColor text-white",
        filterInactive:
          "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      };
    case "pending":
      return {
        border: "border-amber-400",
        stripe: "bg-amber-500",
        badge: "bg-amber-100 text-amber-800 border-amber-300",
        tint: "bg-amber-50/60",
        label: "Pending",
        dot: "bg-amber-500",
        filterActive: "border-amber-500 bg-amber-500 text-white",
        filterInactive:
          "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
      };
    case "preparing":
      return {
        border: "border-sky-500",
        stripe: "bg-sky-500",
        badge: "bg-sky-100 text-sky-800 border-sky-300",
        tint: "bg-sky-50/60",
        label: "Preparing",
        dot: "bg-sky-500",
        filterActive: "border-sky-500 bg-sky-500 text-white",
        filterInactive: "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100",
      };
    case "ready":
      return {
        border: "border-emerald-500",
        stripe: "bg-emerald-500",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
        tint: "bg-emerald-50/60",
        label: "Ready · Checkout",
        dot: "bg-emerald-500",
        filterActive: "border-emerald-500 bg-emerald-500 text-white",
        filterInactive:
          "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
      };
    case "completed":
      return {
        border: "border-slate-400",
        stripe: "bg-slate-500",
        badge: "bg-slate-100 text-slate-700 border-slate-300",
        tint: "bg-slate-50/80",
        label: "Completed",
        dot: "bg-slate-500",
        filterActive: "border-slate-500 bg-slate-500 text-white",
        filterInactive:
          "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
      };
    case "cancelled":
      return {
        border: "border-rose-500",
        stripe: "bg-rose-500",
        badge: "bg-rose-100 text-rose-800 border-rose-300",
        tint: "bg-rose-50/60",
        label: "Cancelled",
        dot: "bg-rose-500",
        filterActive: "border-rose-500 bg-rose-500 text-white",
        filterInactive: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
      };
    default:
      return {
        border: "border-gray-400",
        stripe: "bg-gray-400",
        badge: "bg-gray-100 text-gray-700 border-gray-300",
        tint: "bg-white",
        label: status ?? "-",
        dot: "bg-gray-400",
        filterActive: "border-primaryColor bg-primaryColor text-white",
        filterInactive:
          "border-slate-200 bg-white text-slate-600 hover:border-primaryColor/30",
      };
  }
}

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

  const { data: kots, isSuccess, isFetching } = useGetApiQuery({ url });

  useEffect(() => {
    if (kots?.data) {
      handlePagination({
        total: kots.data.total,
        totalPages: kots.data.totalPages,
      });
    }
  }, [kots, handlePagination]);

  const totalPages = kots?.data?.totalPages ?? 1;
  const statusTabs = [
    "all",
    "pending",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ];

  return (
    <>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2">
          {statusTabs.map((status) => {
            const isActive = queryStringOptions.status === status;
            const theme = getKotStatusTheme(status);
            return (
              <button
                key={status}
                type="button"
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition ${
                  isActive ? theme.filterActive : theme.filterInactive
                }`}
                onClick={() =>
                  setQueryStringOptions((cur) => ({ ...cur, status }))
                }
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    isActive ? "bg-white" : theme.dot
                  }`}
                />
                {status === "ready" ? "Ready" : status}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {isSuccess && kots?.data?.data?.length > 0 ? (
          kots?.data?.data?.map((kot) => <KotCard key={kot.id} kot={kot} />)
        ) : isFetching ? (
          <div className="col-span-full flex min-h-[320px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primaryColor" />
          </div>
        ) : (
          <div className="col-span-full flex min-h-[320px] w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primaryColor/10 text-primaryColor">
              <ChefHat size={28} strokeWidth={1.75} />
            </span>
            <h3 className="text-base font-semibold text-slate-800">
              No KOTs found
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-slate-500">
              {queryStringOptions.status === "all"
                ? "Kitchen tickets will show up here once orders are sent to the kitchen."
                : `There are no ${queryStringOptions.status} kitchen tickets right now. Try another status filter.`}
            </p>
          </div>
        )}
      </div>

      {kots?.data?.data?.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <button
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              query.page === 1
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            disabled={query.page === 1}
            onClick={() =>
              handlePagination({ page: Math.max(1, query.page - 1) })
            }
          >
            Prev
          </button>
          <div className="text-sm text-slate-600">
            Page {query.page} of {totalPages}
          </div>
          <button
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              query.page >= totalPages
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
          .kot-print .number {margin:0 !important; }
        
        .no-print { display: none !important; }
        .screen-compact {
          max-height: none !important;
          overflow: visible !important;
        }
      }
    `,
  });

  const totalDish = items.length;
  const totalQty = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const navigate = useNavigate();
  const statusTheme = getKotStatusTheme(kot.status);

  const tableOrCustomer =
    kot?.order?.orderType === "dineIn"
      ? kot?.order?.table?.tableNo || "-"
      : kot?.order?.takeAwayName || "-";

  const orderBy =
    kot?.order?.createdBy?.table?.name ||
    kot?.order?.table?.tableNo ||
    kot?.order?.createdBy?.name ||
    "-";

  return (
    <>
      <div
        className={`relative flex w-full max-w-[280px] flex-col overflow-hidden border border-dashed font-mono text-xs shadow-sm ${statusTheme.border} ${statusTheme.tint}`}
      >
        <div
          className={`no-print absolute bottom-0 left-0 top-0 w-1.5 ${statusTheme.stripe}`}
        />

        <div ref={contentRef} className="kot-print flex flex-1 flex-col p-3 pl-4">
          <div className="flex items-start justify-between gap-2">
            <p className="kot-title text-sm font-bold">KOT {kot.kotNumber}</p>
            <span
              className={`no-print shrink-0 rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${statusTheme.badge}`}
            >
              {statusTheme.label}
            </span>
          </div>

          <div className="divider-dashed my-2 border-t border-dashed border-gray-400" />

          <div className="space-y-0.5 text-[11px] leading-relaxed">
            <p>
              {kot?.order?.orderType === "dineIn" ? "Table" : "Customer"}:{" "}
              {tableOrCustomer}
            </p>
            <p>Type: {formatOrderType(kot?.order?.orderType)}</p>
            <p>Order By: {orderBy}</p>
            <p>
              Time:{" "}
              {kot?.order?.orderStartTime
                ? format(new Date(kot.order.orderStartTime), "dd MMM hh:mm a")
                : "-"}
            </p>
          </div>

          <div className="divider-dashed my-2 border-t border-dashed border-gray-400" />

          <div className="grid grid-cols-12 text-[11px] font-bold">
            <div className="col-span-8">Item</div>
            <div className="col-span-4 text-right">Qty</div>
          </div>

          <div className="divider-dashed my-1 border-t border-dashed border-gray-300" />

          <div className="screen-compact min-h-[80px] flex-1 space-y-1.5 py-1">
            {items.length === 0 ? (
              <p className="text-center text-gray-400">No items</p>
            ) : (
              items.map((item: OrderItem, index: number) => (
                <div key={String(item.id)} className="text-[11px]">
                  <div className="grid grid-cols-12">
                    <div className="col-span-8">
                      {index + 1}. {item.product?.name || "-"}
                    </div>
                    <div className="col-span-4 text-right">{item.quantity}</div>
                  </div>
                  {item.specialInstructions && (
                    <p className="pl-3 text-[10px] italic text-gray-600">
                      * {item.specialInstructions}
                    </p>
                  )}
                  {item.addons?.map((addonItem, addonIndex) => {
                    const addonQty = Number(
                      addonItem?.quantity ?? (addonItem as any)?.qty ?? 1,
                    );
                    return (
                      <div
                        key={addonIndex}
                        className="grid grid-cols-12 text-[10px]"
                      >
                        <div className="col-span-8 pl-3">
                          + {addonItem?.addon?.name || "Addon"}
                        </div>
                        <div className="col-span-4 text-right font-medium">
                          {Number.isFinite(addonQty) && addonQty > 0
                            ? addonQty
                            : 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="divider-dashed my-2 border-t border-dashed border-gray-400" />

          <div className="flex justify-between text-[11px] font-bold">
            <span>Total (Dish/Qty)</span>
            <span>
              {totalDish}/{totalQty}
            </span>
          </div>

          <div className="mt-2 hidden print:block">
            <p>Printed By: {printedBy || kot?.order?.createdBy?.name || "-"}</p>
            <p>Printed At: {format(new Date(), "dd LLL yyyy hh:mm a")}</p>
          </div>

          <p className="mt-3 hidden text-center print:block">Thank You!</p>
        </div>

        <div className="no-print flex flex-wrap justify-center gap-2 border-t border-dashed border-gray-300 bg-white/80 p-2 pl-3">
          <Button
            className="submit-button px-3 py-1.5 text-[11px]"
            handleClick={reactToPrintFn}
          >
            Print
          </Button>

          {kot.status === "ready" && (
            <Button
              className="border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] text-white hover:bg-emerald-700"
              handleClick={() =>
                navigate(
                  buildCheckoutPath({
                    tableId: kot?.order?.table?.id ?? null,
                    orderId: kot?.order?.id ?? kot?.orderId ?? null,
                  }),
                )
              }
            >
              Checkout
            </Button>
          )}

          {kot.status === "pending" && (
            <Button
              className="border border-sky-500 bg-sky-500 px-3 py-1.5 text-[11px] text-white hover:bg-sky-600"
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
              Start Preparing
            </Button>
          )}
          {kot.status === "preparing" && (
            <Button
              className="border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-[11px] text-white hover:bg-emerald-600"
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
              Mark Ready
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function formatOrderType(v?: string) {
  if (!v) return "-";
  if (v.toLowerCase() === "dinein") return "Dine In";
  return v.charAt(0).toUpperCase() + v.slice(1);
}
