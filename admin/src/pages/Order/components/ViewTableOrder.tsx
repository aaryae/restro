import Button from "@/components/Button";
import { CurrencySign } from "@/constants";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery, useUpdateApiMutation } from "@/redux/services/crudApi";
import React, { useEffect } from "react";
import { LuChefHat } from "react-icons/lu";
import { Link } from "react-router-dom";
import { handleError, handleResponse } from "@/utils/responseHandler";
import styles from "./ViewTableOrder.module.css";

interface ViewTableOrderProps {
  id: number | null;
  tableNo?: number | null;
  orderId?: number | null;
  handleCheckout: (
    tableId: number,
    orderId: number | null | number[],
  ) => void;
  onOpenTransfer?: (tableId: number) => void;
  onTableCleared?: () => void;
  onClose?: () => void;
}

function paymentStatusClass(status: string) {
  switch (status) {
    case "paid":
      return styles.statusPaid;
    case "partially_paid":
      return styles.statusPartial;
    case "failed":
      return styles.statusFailed;
    default:
      return styles.statusUnpaid;
  }
}

function formatPaymentStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Unpaid";
    case "partially_paid":
      return "Partially paid";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    default:
      return status.replace(/_/g, " ");
  }
}

function shouldShowPaymentStatus(
  orderStatus: string,
  paymentStatus?: string | null,
) {
  if (!paymentStatus) return false;
  // Default unpaid state is redundant while the order is still in progress.
  if (paymentStatus === "pending" && orderStatus === "pending") return false;
  return true;
}

function orderStatusClass(status: string) {
  switch (status) {
    case "completed":
      return styles.statusCompleted;
    case "cancelled":
      return styles.statusCancelled;
    case "pending":
      return styles.statusPending;
    case "prepared":
    case "ready":
      return styles.statusPrepared;
    default:
      return styles.statusDefault;
  }
}

const ViewTableOrder: React.FC<ViewTableOrderProps> = ({
  id,
  handleCheckout,
  onOpenTransfer,
  onTableCleared,
  onClose,
}) => {
  const [updateTable, { isLoading: clearingTable }] = useUpdateApiMutation();
  const {
    data: tableOrder,
    isSuccess: success,
    isLoading: loading,
    refetch: refetchOrders,
  } = useGetApiQuery(
    { url: `${ORDER_URL}active-orders/${id}` },
    {
      skip: id == null || Number.isNaN(Number(id)),
    },
  );
  const { data: table } = useGetApiQuery(
    { url: `${TABLE_URL}${id}` },
    {
      skip: id == null || Number.isNaN(Number(id)),
    },
  );

  const orders = tableOrder?.data?.orders ?? [];
  const allOrderIds = orders.map(({ id: orderId }: { id: number }) => orderId);
  const tableStatus =
    tableOrder?.data?.table?.status ?? table?.data?.status ?? null;
  const hasOrders = orders.length > 0;
  const isStuckOccupied =
    success && !hasOrders && tableStatus === "occupied";
  const tableLabel = table?.data?.tableNo || id;

  useEffect(() => {
    if (!success || hasOrders) return;

    onTableCleared?.();

    if (tableOrder?.data?.table?.status === "available") {
      onClose?.();
    }
  }, [
    success,
    hasOrders,
    tableOrder?.data?.table?.status,
    onTableCleared,
    onClose,
  ]);

  const handleMarkAvailable = async () => {
    if (id == null) return;

    try {
      const response = await updateTable({
        url: `${TABLE_URL}${id}`,
        body: { status: "available" },
      }).unwrap();

      handleResponse({
        res: response,
        onSuccess: () => {
          refetchOrders();
          onTableCleared?.();
          onClose?.();
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.tableBadge}>
            <span className={styles.tableBadgeDot} aria-hidden />
            {tableLabel}
          </div>
          <div className={styles.actions}>
            <Link to={`/admin/order/${id}`} className={styles.addOrderBtn}>
              <LuChefHat className="h-4 w-4" />
              <span>Add Order</span>
            </Link>
            <Button
              className={`${styles.transferBtn} w-fit text-white disabled:cursor-not-allowed disabled:opacity-50`}
              handleClick={() => id != null && onOpenTransfer?.(id)}
              disabled={!hasOrders}
            >
              Transfer Table
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.loading}>Loading orders...</div>
        ) : (
          <div className={styles.ordersList}>
            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>No active orders for this table</p>
                {isStuckOccupied ? (
                  <div className={styles.stuckCard}>
                    <p className={styles.stuckText}>
                      This table is still marked as occupied but has no orders.
                      Free it so new customers can be seated here.
                    </p>
                    <Button
                      className="mx-auto bg-green-600 px-5 py-2 text-white hover:bg-green-700"
                      handleClick={handleMarkAvailable}
                      disabled={clearingTable}
                    >
                      {clearingTable ? "Freeing table..." : "Free Table"}
                    </Button>
                  </div>
                ) : (
                  <p className={styles.emptyHint}>
                    The table should now be available for the next customer.
                  </p>
                )}
              </div>
            ) : (
              orders.map((order: any) => (
                <article key={order.id} className={styles.orderCard}>
                  <div className={styles.orderCardHeader}>
                    <p className={styles.orderNumber}>Order No: {order.id}</p>
                    <div className={styles.statusGroup}>
                      <span
                        className={`${styles.statusPill} ${orderStatusClass(order.status)}`}
                      >
                        {(order.status || "unknown").charAt(0).toUpperCase() +
                          (order.status || "unknown").slice(1)}
                      </span>
                      {shouldShowPaymentStatus(order.status, order.paymentStatus) && (
                        <span
                          className={`${styles.statusPill} ${paymentStatusClass(order.paymentStatus)}`}
                        >
                          {formatPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      )}
                    </div>
                  </div>

                  {String(order.orderNote || "").trim() && (
                    <div className={styles.orderNote}>
                      <span className={styles.orderNoteLabel}>Order notes: </span>
                      {String(order.orderNote).trim()}
                    </div>
                  )}

                  <div className={styles.itemsList}>
                    {order.orderItems.map((item: any) => {
                      const itemName =
                        item?.product?.name ||
                        item?.openItem?.name ||
                        "Unknown item";
                      const unitPrice = Number(
                        item?.product?.price ??
                          item?.openItem?.price ??
                          item?.price ??
                          0,
                      );
                      return (
                        <div key={item.id} className={styles.itemRow}>
                          <div className={styles.itemMain}>
                            <p className={styles.itemName}>{itemName}</p>
                            <p className={styles.itemMeta}>Qty: {item.quantity}</p>
                            {item.specialInstructions && (
                              <p className={styles.itemNote}>
                                Note: {item.specialInstructions}
                              </p>
                            )}
                            {item.addons && item.addons.length > 0 ? (
                              <div className={styles.addons}>
                                <p>Addons ({item.addons.length}):</p>
                                <ul>
                                  {item.addons.map(
                                    (addonItem: any, index: number) => (
                                      <li key={index}>
                                        {addonItem?.addon?.name || "No name"}
                                        {addonItem?.addon?.price !== undefined &&
                                          `(+Rs.${Number(addonItem.addon.price).toFixed(2)})`}
                                        {addonItem?.quantity > 1 &&
                                          ` (x${addonItem.quantity})`}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                          <div className={styles.itemPricing}>
                            <p className={styles.unitPrice}>
                              Rs. {unitPrice.toFixed(2)} each
                            </p>
                            {item.addons && item.addons.length > 0 && (
                              <p className={styles.unitPrice}>
                                + {CurrencySign}
                                {item.addons
                                  .reduce(
                                    (sum: number, addonItem: any) =>
                                      sum +
                                      Number(addonItem?.addon?.price || 0) *
                                        Number(addonItem?.quantity || 1),
                                    0,
                                  )
                                  .toFixed(2)}{" "}
                                addons
                              </p>
                            )}
                            <p className={styles.subtotal}>
                              Rs.{" "}
                              {Number(
                                item.itemTotal ?? item.subtotal ?? 0,
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.orderFooter}>
                    <div className={styles.orderActions}>
                      {order.status !== "completed" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCheckout(id!, order.id)}
                            className={styles.checkoutBtn}
                          >
                            Checkout
                          </button>
                          {order.status !== "prepared" &&
                            order.status !== "completed" && (
                              <Link
                                to={`/admin/order/${id}/${order.id}`}
                                className={styles.updateBtn}
                              >
                                Update
                              </Link>
                            )}
                        </>
                      )}
                    </div>
                    <p className={styles.orderTotal}>
                      Total: Rs. {Number(order.calculatedTotal).toFixed(2)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {hasOrders && (
          <div className={styles.footerBar}>
            <Button
              className={`${styles.checkoutAllBtn} bg-primaryColor text-white hover:bg-primaryColor/80`}
              handleClick={() => handleCheckout(id!, allOrderIds)}
            >
              Checkout ALL
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewTableOrder;

export function StatusTag({
  status,
  orderId,
}: {
  status: string;
  orderId: number;
}) {
  return (
    <div className={styles.orderCardHeader}>
      <p className={styles.orderNumber}>Order No: {orderId}</p>
      <span
        className={`${styles.statusPill} ${orderStatusClass(status)}`}
      >
        {(status || "unknown").charAt(0).toUpperCase() +
          (status || "unknown").slice(1)}
      </span>
    </div>
  );
}
