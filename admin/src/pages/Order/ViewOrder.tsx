import PageTitle from "@/components/PageTitle";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { SetStateAction } from "react";
import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import { format } from "date-fns";
import { StickyNote, UtensilsCrossed } from "lucide-react";

interface Addon {
  id: number;
  name: string;
  price: string;
}

type OrderItem = {
  id: string | number;
  product?: {
    name: string;
    mediaArr?: Array<{ imageUrl: string }>;
  };
  openItem?: {
    name: string;
  };
  quantity: number;
  price: string | number;
  subtotal: string | number;
  discount?: number;
  status: string;
  department?: {
    name: string;
  };
  specialInstructions?: string;
  addons?: any[];
};

type ViewCustomerProps = {
  id: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<SetStateAction<boolean>>;
};

function getProductImageSrc(item: OrderItem) {
  const imageUrl = item?.product?.mediaArr?.[0]?.imageUrl;
  if (!imageUrl) return DishPlaceHolder;
  return `${IMAGE_BASE_URL}${imageUrl}`;
}

function getItemName(item: OrderItem) {
  return item.product?.name || item.openItem?.name || "Unknown item";
}

function statusStyles(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "border-amber-400 bg-amber-50 text-amber-800";
    case "preparing":
      return "border-sky-400 bg-sky-50 text-sky-800";
    case "ready":
    case "prepared":
      return "border-emerald-400 bg-emerald-50 text-emerald-800";
    case "served":
      return "border-violet-400 bg-violet-50 text-violet-800";
    case "completed":
      return "border-slate-400 bg-slate-100 text-slate-700";
    case "cancelled":
      return "border-rose-400 bg-rose-50 text-rose-800";
    default:
      return "border-slate-300 bg-slate-50 text-slate-600";
  }
}

function itemAccent(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "bg-amber-400";
    case "preparing":
      return "bg-sky-400";
    case "ready":
    case "prepared":
      return "bg-emerald-400";
    case "served":
      return "bg-violet-400";
    case "cancelled":
      return "bg-rose-400";
    default:
      return "bg-slate-300";
  }
}

function formatMoney(value: string | number | undefined) {
  const n = Number(value ?? 0);
  return `${CurrencySign}${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return String(value).replace(/_/g, " ");
}

function getAddonsTotal(item: OrderItem) {
  if (!Array.isArray(item.addons) || item.addons.length === 0) return 0;
  return item.addons.reduce((sum, addonItem: any) => {
    const unit = Number(addonItem?.price ?? addonItem?.addon?.price ?? 0);
    const qty = Number(addonItem?.quantity ?? 1);
    return sum + unit * qty;
  }, 0);
}

function getLineTotal(item: OrderItem) {
  const base = Number(item.subtotal ?? 0);
  const addons = getAddonsTotal(item);
  const productOnly = Number(item.price ?? 0) * Number(item.quantity ?? 0);
  if (Math.abs(base - (productOnly + addons)) < 0.01) return base;
  if (Math.abs(base - productOnly) < 0.01) return base + addons;
  return base + (addons > 0 && base < productOnly + addons ? addons : 0);
}

export default function ViewOrder({ id }: ViewCustomerProps) {
  const { data: orderData, isSuccess: success, isLoading } = useGetApiQuery(
    { url: `order/${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  const order = orderData?.data;
  const items: OrderItem[] = order?.orderItems || [];
  const orderNote = String(order?.orderNote || "").trim();

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-4">
      <div className="shrink-0 space-y-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <PageTitle title="Order Details" />
            {order?.orderNumber && (
              <p className="mt-1 text-left text-xs font-medium text-slate-400">
                #{String(order.orderNumber).replace(/^ORD-/, "ORD · ")}
              </p>
            )}
          </div>
          {order?.status && (
            <span
              className={`mt-1 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusStyles(order.status)}`}
            >
              {formatLabel(order.status)}
            </span>
          )}
        </div>

        {success && order && (
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-left text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Type
              </p>
              <p className="mt-0.5 font-medium capitalize text-slate-800">
                {formatLabel(order.orderType)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Payment
              </p>
              <p className="mt-0.5 font-medium capitalize text-slate-800">
                {formatLabel(order.paymentStatus)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Table
              </p>
              <p className="mt-0.5 font-medium text-slate-800">
                {order.table?.tableNo ||
                  (order.orderType === "takeaway"
                    ? order.takeAwayName || "Takeaway"
                    : "—")}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Started
              </p>
              <p className="mt-0.5 font-medium text-slate-800">
                {order.orderStartTime
                  ? format(new Date(order.orderStartTime), "dd MMM, hh:mm a")
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {success && orderNote && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 p-3 text-left">
            <div className="mb-1.5 flex items-center gap-2 text-amber-800">
              <StickyNote size={15} strokeWidth={2.2} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Order notes
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-950/90">
              {orderNote}
            </p>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-4 pr-1">
        {isLoading && (
          <p className="py-10 text-center text-sm text-slate-500">
            Loading order…
          </p>
        )}

        {success && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <UtensilsCrossed className="mx-auto mb-2 h-7 w-7 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No items</p>
          </div>
        )}

        {success &&
          items.map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm"
            >
              <div
                className={`absolute bottom-0 left-0 top-0 w-1 ${itemAccent(item.status)}`}
                aria-hidden
              />
              <div className="flex gap-3 p-3 pl-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80">
                  <img
                    src={getProductImageSrc(item)}
                    alt={getItemName(item)}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.dataset.fallbackApplied === "true") return;
                      target.dataset.fallbackApplied = "true";
                      target.src = DishPlaceHolder;
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-[15px] font-semibold text-slate-900">
                      {getItemName(item)}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusStyles(item.status)}`}
                    >
                      {formatLabel(item.status)}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm text-slate-600">
                    <span>
                      Qty{" "}
                      <span className="font-semibold text-slate-800">
                        {item.quantity}
                      </span>
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>Item {formatMoney(item.price)} each</span>
                  </div>

                  {Array.isArray(item.addons) && item.addons.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {item.addons.map((addonItem: any, index: number) => (
                        <li
                          key={addonItem?.id ?? index}
                          className="flex items-center justify-between gap-2 text-xs text-slate-500"
                        >
                          <span>
                            +{" "}
                            {addonItem?.addon?.name ||
                              addonItem?.name ||
                              "Addon"}
                            {addonItem?.quantity > 1
                              ? ` ×${addonItem.quantity}`
                              : ""}
                          </span>
                          <span className="shrink-0 font-medium text-slate-600">
                            {formatMoney(
                              addonItem?.price ?? addonItem?.addon?.price,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    Line total {formatMoney(getLineTotal(item))}
                  </p>

                  {item.department?.name && (
                    <p className="mt-1 text-xs text-slate-400">
                      {item.department.name}
                    </p>
                  )}

                  {item.specialInstructions && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Note: </span>
                      {item.specialInstructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {success && order && (
        <div className="shrink-0 border-t border-slate-200/80 bg-white pt-3 pb-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
            <span className="text-sm font-medium text-white/70">Total</span>
            <span className="text-lg font-semibold tracking-tight">
              {formatMoney(order.totalAmount)}
            </span>
          </div>
          {order.payableAmount != null &&
            Number(order.payableAmount) !== Number(order.totalAmount) && (
              <p className="mt-2 text-right text-xs text-slate-500">
                Payable {formatMoney(order.payableAmount)}
              </p>
            )}
        </div>
      )}
    </div>
  );
}
