import Button from "@/components/Button";
import { CurrencySign } from "@/constants";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { StickyNote, UtensilsCrossed } from "lucide-react";
import React, { useMemo } from "react";

type ViewTakeawayOrdersProps = {
  id?: number | null;
  orderId?: number | null;
  onOpenCheckout?: (orderId: number, tableId?: number | null) => void;
};

function statusStyles(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-800";
    case "preparing":
      return "bg-sky-50 text-sky-800";
    case "ready":
    case "prepared":
      return "bg-emerald-50 text-emerald-800";
    case "served":
    case "completed":
      return "bg-slate-100 text-slate-700";
    case "cancelled":
      return "bg-rose-50 text-rose-800";
    default:
      return "bg-slate-50 text-slate-600";
  }
}

function formatMoney(value: string | number | undefined) {
  const n = Number(value ?? 0);
  return `${CurrencySign}${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}

function getUnitPrice(item: any) {
  if (Array.isArray(item.price)) {
    return item.price.reduce(
      (sum: number, priceObj: any) => sum + Number(priceObj.price || 0),
      0,
    );
  }
  return Number(item.price ?? item?.product?.price ?? 0);
}

function getAddonsTotal(item: any) {
  if (!Array.isArray(item.addons)) return 0;
  return item.addons.reduce(
    (sum: number, addonItem: any) =>
      sum +
      Number(addonItem?.addon?.price || 0) * Number(addonItem?.quantity || 0),
    0,
  );
}

function getItemName(item: any) {
  return item?.product?.name || item?.openItem?.name || "Item";
}

const ViewTakeawayOrders: React.FC<ViewTakeawayOrdersProps> = ({
  id,
  onOpenCheckout,
}) => {
  const {
    data: orderData,
    isLoading: loading,
    isSuccess: success,
  } = useGetApiQuery(
    { url: `${ORDER_URL}${id}` },
    { skip: id === null || id === undefined },
  );

  const items = (success ? orderData?.data?.orderItems : []) || [];
  const orderNo = orderData?.data?.id || id;
  const orderNote = String(orderData?.data?.orderNote || "").trim();
  const customerName =
    String(orderData?.data?.takeAwayName || "").trim() ||
    [orderData?.data?.customer?.firstName, orderData?.data?.customer?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Guest";

  const itemsTotal = useMemo(
    () =>
      items.reduce((sum: number, item: any) => {
        const qty = Number(item.quantity || 0);
        return sum + getUnitPrice(item) * qty + getAddonsTotal(item);
      }, 0),
    [items],
  );

  const grandTotal = Number(orderData?.data?.totalAmount ?? itemsTotal);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-3 border-b border-slate-100 px-5 pb-4 pt-5 pr-14">
        <h2 className="text-left text-base font-semibold text-slate-900">
          Takeaway Order
          {orderNo != null && (
            <span className="ml-1.5 font-medium text-slate-400">#{orderNo}</span>
          )}
        </h2>

        {success && (
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Customer
            </p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">
              {customerName}
            </p>
          </div>
        )}

        {success && orderNote && (
          <div className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-left text-sm text-amber-900">
            <StickyNote
              size={14}
              strokeWidth={2.2}
              className="mt-0.5 shrink-0 text-amber-700"
            />
            <p className="whitespace-pre-wrap leading-relaxed">{orderNote}</p>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        {loading && (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading order…
          </p>
        )}

        {success && items.length === 0 && (
          <div className="px-4 py-10 text-center">
            <UtensilsCrossed className="mx-auto mb-2 h-6 w-6 text-slate-300" />
            <p className="text-sm text-slate-500">No items</p>
          </div>
        )}

        {success && items.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {items.map((item: any) => {
              const unitPrice = getUnitPrice(item);
              const qty = Number(item.quantity || 0);
              const lineTotal = unitPrice * qty + getAddonsTotal(item);
              const status = String(item.status || "");

              return (
                <li key={item.id} className="py-3 text-left first:pt-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-slate-900">
                          {getItemName(item)}
                        </h3>
                        {status && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${statusStyles(status)}`}
                          >
                            {status}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {qty} × {formatMoney(unitPrice)}
                      </p>
                      {item.specialInstructions && (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.specialInstructions}
                        </p>
                      )}
                      {Array.isArray(item.addons) && item.addons.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {item.addons.map((addonItem: any, index: number) => (
                            <li
                              key={addonItem?.id ?? index}
                              className="text-xs text-slate-500"
                            >
                              + {addonItem?.addon?.name || "Addon"}
                              {addonItem?.quantity > 1
                                ? ` ×${addonItem.quantity}`
                                : ""}
                              {addonItem?.addon?.price != null &&
                                ` · ${formatMoney(addonItem.addon.price)}`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-medium text-slate-800">
                      {formatMoney(lineTotal)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {success && (
        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-base font-semibold text-slate-900">
              {formatMoney(grandTotal)}
            </span>
          </div>
          <Button
            className="h-10 w-full rounded-lg bg-primaryColor text-sm font-medium text-white hover:bg-primaryColor/90"
            handleClick={() => {
              const orderid = Number(orderData?.data?.id ?? id ?? 0);
              const tableid = orderData?.data?.table?.id ?? null;
              if (onOpenCheckout) onOpenCheckout(orderid, tableid);
            }}
            disabled={items.length === 0}
          >
            Checkout
          </Button>
        </div>
      )}
    </div>
  );
};

export default ViewTakeawayOrders;
