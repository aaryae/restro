import { ORDER_CHECKOUT_ROUTE } from "@/routes/routeNames";

type CheckoutNavArgs = {
  tableId?: number | null;
  orderId: number | number[] | null;
  selectedItemIds?: number[];
};

/** Build `/admin/order/checkout?...` for table, takeaway, or checkout-all. */
export function buildCheckoutPath({
  tableId,
  orderId,
  selectedItemIds,
}: CheckoutNavArgs): string {
  const params = new URLSearchParams();

  if (tableId != null && Number.isFinite(Number(tableId))) {
    params.set("tableId", String(tableId));
  }

  if (orderId != null) {
    const ids = Array.isArray(orderId) ? orderId : [orderId];
    const cleaned = ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (cleaned.length > 0) {
      params.set("orderId", cleaned.join(","));
    }
  }

  if (selectedItemIds?.length) {
    params.set(
      "itemIds",
      selectedItemIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
        .join(","),
    );
  }

  const qs = params.toString();
  return qs ? `${ORDER_CHECKOUT_ROUTE}?${qs}` : ORDER_CHECKOUT_ROUTE;
}

export function parseCheckoutSearchParams(search: string): {
  tableId: number | null;
  orderId: number | null | number[];
  selectedItemIds?: number[];
} {
  const params = new URLSearchParams(search);

  const tableRaw = params.get("tableId");
  const tableId =
    tableRaw != null && tableRaw !== ""
      ? Number(tableRaw)
      : null;
  const resolvedTableId =
    tableId != null && Number.isFinite(tableId) && tableId > 0 ? tableId : null;

  const orderRaw = params.get("orderId");
  let orderId: number | null | number[] = null;
  if (orderRaw) {
    const ids = orderRaw
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (ids.length === 1) orderId = ids[0];
    else if (ids.length > 1) orderId = ids;
  }

  const itemRaw = params.get("itemIds");
  const selectedItemIds = itemRaw
    ? itemRaw
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((id) => Number.isFinite(id) && id > 0)
    : undefined;

  return {
    tableId: resolvedTableId,
    orderId,
    selectedItemIds:
      selectedItemIds && selectedItemIds.length > 0
        ? selectedItemIds
        : undefined,
  };
}
