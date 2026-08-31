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
import { kotPrintPageStyle } from "@/utils/printPageStyles";
import { buildCheckoutPath } from "@/utils/checkoutNavigation";
import "../posBrand.css";

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
        border: "border-slate-200",
        stripe: "pos-accent-navy",
        badge: "pos-pill-navy border",
        tint: "bg-white",
        label: "All",
        dot: "pos-dot-navy",
      };
    case "pending":
      return {
        border: "border-slate-200",
        stripe: "pos-accent-gold",
        badge: "pos-pill-gold border",
        tint: "bg-white",
        label: "Pending",
        dot: "pos-dot-gold",
      };
    case "preparing":
      return {
        border: "border-slate-200",
        stripe: "pos-accent-navy",
        badge: "pos-pill-navy border",
        tint: "bg-white",
        label: "Preparing",
        dot: "pos-dot-navy",
      };
    case "ready":
      return {
        border: "border-slate-200",
        stripe: "pos-accent-navy",
        badge: "border-primaryColor bg-primaryColor text-white",
        tint: "bg-primaryColor/[0.03]",
        label: "Ready · Checkout",
        dot: "pos-dot-navy",
      };
    case "completed":
      return {
        border: "border-slate-200",
        stripe: "bg-slate-400",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        tint: "bg-slate-50/80",
        label: "Completed",
        dot: "bg-slate-400",
      };
    case "cancelled":
      return {
        border: "border-rose-200",
        stripe: "bg-rose-500",
        badge: "bg-rose-50 text-rose-800 border-rose-200",
        tint: "bg-white",
        label: "Cancelled",
        dot: "bg-rose-500",
      };
    default:
      return {
        border: "border-slate-200",
        stripe: "bg-slate-400",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        tint: "bg-white",
        label: status ?? "-",
        dot: "bg-slate-400",
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
      <div className="inline-flex w-full flex-wrap rounded-lg border border-slate-200 bg-slate-50/80 p-1 md:w-auto">
          {statusTabs.map((status) => {
            const isActive = queryStringOptions.status === status;
            const theme = getKotStatusTheme(status);
            return (
              <button
                key={status}
                type="button"
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium capitalize transition md:flex-none ${
                  isActive
                    ? "bg-primaryColor text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-800"
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
    pageStyle: kotPrintPageStyle,
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
        className={`relative flex w-full max-w-[280px] flex-col overflow-hidden rounded-xl border font-mono text-xs shadow-sm ${statusTheme.border} ${statusTheme.tint}`}
      >
        <div
          className={`no-print absolute bottom-0 left-0 top-0 w-1.5 ${statusTheme.stripe}`}
        />

        <div
          ref={contentRef}
          className="print-surface kot-print flex flex-1 flex-col bg-white p-3 pl-4 text-black"
        >
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

        <div className="no-print flex flex-wrap justify-center gap-2 border-t border-slate-200 bg-white/90 p-2 pl-3">
          <Button
            className="submit-button px-3 py-1.5 text-[11px]"
            handleClick={reactToPrintFn}
          >
            Print
          </Button>

          {kot.status === "ready" && (
            <Button
              className="border border-primaryColor bg-primaryColor px-3 py-1.5 text-[11px] text-white hover:bg-primaryColor/90"
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
              className="border border-primaryColor bg-primaryColor px-3 py-1.5 text-[11px] text-white hover:bg-primaryColor/90"
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
              className="border border-primaryColor bg-primaryColor px-3 py-1.5 text-[11px] text-white hover:bg-primaryColor/90"
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
