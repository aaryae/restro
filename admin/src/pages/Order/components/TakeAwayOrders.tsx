import Drawer from "@/components/Drawer";
import PageTitle from "@/components/PageTitle";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { buildCheckoutPath } from "@/utils/checkoutNavigation";
import { CurrencySign } from "@/constants";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Eye, ShoppingBag, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ViewTakeawayOrders from "./ViewTakeawayOrders";
import "../posBrand.css";

function getCustomerName(order: any): string {
  const takeAway = String(order?.takeAwayName || "").trim();
  if (takeAway) return takeAway;

  const customer = order?.customer;
  if (customer) {
    const fromParts = [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (fromParts) return fromParts;
    if (customer.name) return String(customer.name).trim();
  }

  return "Guest";
}

function statusStyles(status: string) {
  switch (status) {
    case "prepared":
      return {
        badge: "pos-pill-navy ring-1 ring-inset",
        accent: "pos-accent-navy",
      };
    case "preparing":
      return {
        badge: "pos-pill-navy ring-1 ring-inset",
        accent: "pos-accent-navy",
      };
    case "pending":
      return {
        badge: "pos-pill-gold ring-1 ring-inset",
        accent: "pos-accent-gold",
      };
    default:
      return {
        badge: "bg-slate-50 text-slate-600 ring-slate-200 ring-1 ring-inset",
        accent: "bg-slate-400",
      };
  }
}

function TakeAwayOrders() {
  const navigate = useNavigate();
  const { query, handlePagination } = usePagination({ limit: 6, page: 1 });
  const [orderId, setOrderId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [queryStringOptions, _setQueryStringOptions] = useState({
    orderType: "takeaway",
    status: "pending,preparing,prepared", // Exclude completed orders
  });

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

  const url = useMemo(() => {
    return buildQueryString("order/list", {
      page: query.page,
      limit: query.limit,
      search: queryStringOptions,
    });
  }, [query.page, query.limit, queryStringOptions]);
  const {
    data: allOrders,
    isSuccess: success,
    isLoading: loading,
    refetch: _refetch,
  } = useGetApiQuery({ url });

  const items = (success ? allOrders?.data?.data : []) || [];
  const total = allOrders?.data?.total ?? 0;
  const totalPages =
    allOrders?.data?.totalPages ||
    (total && query.limit ? Math.ceil(total / query.limit) : 0);
  const canGoNext = totalPages
    ? query.page < totalPages
    : items.length === query.limit;

  useEffect(() => {
    if (allOrders?.data) {
      handlePagination({
        total: allOrders.data.total,
        totalPages: allOrders.data.totalPages,
      });
    }
  }, [allOrders, handlePagination]);

  useEffect(() => {
    handlePagination({ page: 1 });
  }, [queryStringOptions, handlePagination]);

  const handlePrev = () => {
    if (query.page > 1) handlePagination({ page: query.page - 1 });
  };

  return (
    <>
      <PageTitle title="Take Away Orders" />
      <div className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <div className="col-span-full py-10 text-center text-slate-500">
              Loading take-away orders...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="font-medium text-slate-700">No take-away orders</p>
              <p className="mt-1 text-sm text-slate-500">
                Active takeaway orders will show up here.
              </p>
            </div>
          )}

          {items.map((order: any) => {
            const {
              id,
              orderNumber,
              orderStartTime,
              status,
              totalAmount,
            } = order;
            const customerName = getCustomerName(order);
            const theme = statusStyles(status);
            const cancelled = status === "cancelled";

            return (
              <div
                key={id}
                className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-primaryColor/25 hover:shadow-md ${
                  cancelled ? "opacity-60" : ""
                }`}
              >
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1 ${theme.accent}`}
                  aria-hidden
                />

                <div className="flex flex-col gap-3 p-4 pl-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Takeaway
                        {orderNumber ? ` · #${orderNumber}` : ` · #${id}`}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primaryColor/10 text-primaryColor">
                          <User size={16} strokeWidth={2} />
                        </span>
                        <h3
                          className={`truncate text-lg font-semibold text-slate-900 ${
                            cancelled ? "line-through" : ""
                          }`}
                          title={customerName}
                        >
                          {customerName}
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${theme.badge}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">
                        Started
                      </p>
                      <p className="mt-0.5 font-medium text-slate-700">
                        {orderStartTime
                          ? format(new Date(orderStartTime), "dd MMM, hh:mm a")
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">
                        Amount
                      </p>
                      <p className="mt-0.5 font-semibold text-primaryColor">
                        {CurrencySign}
                        {Number(totalAmount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg bg-primaryColor px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                      onClick={() => handleViewOrder(id)}
                    >
                      <Eye size={15} />
                      View order
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {allOrders?.data?.data?.length > 0 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
              onClick={handlePrev}
              disabled={query.page <= 1}
            >
              Prev
            </button>
            <div className="text-sm text-slate-500">
              Page {query.page} of {totalPages || 1}
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
              onClick={() =>
                handlePagination({
                  page: totalPages
                    ? Math.min(totalPages, query.page + 1)
                    : query.page + 1,
                })
              }
              disabled={!canGoNext}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Drawer
        isOpen={open}
        setIsOpen={setOpen}
        width="w-full max-w-md sm:w-[400px]"
        contentClassName="p-0"
      >
        <ViewTakeawayOrders id={orderId} onOpenCheckout={handleOpenCheckout} />
      </Drawer>
    </>
  );
}

export default TakeAwayOrders;
