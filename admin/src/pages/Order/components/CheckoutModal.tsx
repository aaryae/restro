import QR_IMAGE from "@/assets/qr-code.png";
import Bill from "@/components/Bill";
import CustomDialog from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import Input from "@/components/Input";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { ACCOUNT_URL, ORDER_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useCheckoutOrderMutation } from "@/redux/services/orders";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { Contact, Mail, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import AddEditCustomer from "../../Customer/AddEditCustomer";
import styles from "./CheckoutModal.module.css";
import SplitPayment from "./SplitPayment";

// Define interfaces
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  specialInstructions: string;
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: "dineIn" | "takeaway" | "delivery";
  tableId: string | null;
  tableName: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress?: string;
  orderItems: OrderItem[];
  totalAmount: number;
  status: "preparing" | "ready" | "completed";
  orderNote: string;
  estimatedTime: number;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
}

interface Table {
  id: number;
  floor: { id: number; floorNo: string };
  tableNo: string;
  name: string | null;
  type: "indoor" | "outdoor" | "vip" | "regular";
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentSessionId: string | null;
  sessionStartTime: string | null;
  isActive: boolean;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: number | null;
  orderId: number | null | [number];
  selectedItemIds?: number[];
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  tableId,
  orderId,
  selectedItemIds,
}) => {
  const [paymentType, setPaymentType] = useState<
    "cash" | "qr" | "bank" | "split"
  >("cash");
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [checkoutType, setCheckoutType] = useState<"guest" | "member">("guest");
  const [selectedMember, setSelectedMember] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedQrCategory, setSelectedQrCategory] = useState<
    "bank" | "wallet"
  >("bank");
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [tenderAmount, setTenderAmount] = useState<string>("");

  const [checkoutOrderApi] = useCheckoutOrderMutation();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [splitOpen, setSplitOpen] = useState<boolean>(false);
  const [splitPaymentData, setSplitPaymentData] = useState<any>(null);

  // Placeholder for Bill ref; print handler defined after data hooks
  const billRef = useRef<HTMLDivElement>(null);

  const customerUrl = buildQueryString("customer-auth/list", {
    page: 1,
    limit: 5,
    search: {
      isCombo: true,
      phone: customerSearchTerm,
    },
  });

  const { data: order } = useGetApiQuery(
    { url: `order/${orderId}?itemStatus=active` },
    {
      skip:
        orderId === null ||
        orderId === undefined ||
        (Array.isArray(orderId) && orderId.length > 1),
    },
  );

  // When checking out ALL (multiple orderIds), read active orders for the table
  const { data: activeOrdersResp } = useGetApiQuery(
    { url: `${ORDER_URL}active-orders/${tableId}` },
    { skip: !Array.isArray(orderId) || !tableId },
  );

  const { data: table } = useGetApiQuery(
    { url: `table/${tableId}` },
    {
      skip: orderId === null || orderId === undefined,
    },
  );

  // Printing setup for Bill (react-to-print)
  const printBill = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Bill-${order?.data?.orderNumber || "Invoice"}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 5mm 3mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
        }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        /* Ensure only the bill area is printed nicely for 80mm */
        #bill-print {
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
          background: #fff !important;
        }

        #bill-print h1 { font-size: 14px !important; }
        #bill-print h2 { font-size: 12px !important; }
        #bill-print h3, #bill-print p, #bill-print span { font-size: 10px !important; }

        #bill-print table { width: 100% !important; border-collapse: collapse !important; }
        #bill-print th, #bill-print td { padding: 4px 6px !important; }
        #bill-print th { font-weight: 600 !important; }

        /* Prevent awkward page breaks */
        #bill-print tr { page-break-inside: avoid; }
        #bill-print thead { display: table-header-group; }
        #bill-print tfoot { display: table-footer-group; }

        .no-print { display: none !important; }
      }
    `,
  });

  // Fetch all accounts to populate bank and wallet dropdowns
  const { data: accountsResp } = useGetApiQuery({
    url: buildQueryString("account/list", { page: 1, limit: 100 }),
  });

  const bankAccounts: Array<any> = Array.isArray(accountsResp?.data?.data)
    ? accountsResp?.data?.data.filter((a: any) => a?.accountType === "bank")
    : [];
  const walletAccounts: Array<any> = Array.isArray(accountsResp?.data?.data)
    ? accountsResp?.data?.data.filter((a: any) => a?.accountType === "wallet")
    : [];

  // Fetch selected account details to fetch staticQr
  const { data: selectedBankDetail } = useGetApiQuery(
    selectedBankId ? { url: `${ACCOUNT_URL}${selectedBankId}` } : ({} as any),
    { skip: !selectedBankId },
  );
  const { data: selectedWalletDetail } = useGetApiQuery(
    selectedWalletId
      ? { url: `${ACCOUNT_URL}${selectedWalletId}` }
      : ({} as any),
    { skip: !selectedWalletId },
  );

  // Prefer media array image when present, otherwise fall back to staticQrUrl fields
  console.log(selectedBankDetail?.data, "HELLO");
  const bankQrUrl =
    (selectedBankDetail?.data as any)?.mediaArr?.[0]?.imageUrl ||
    (selectedBankDetail?.data as any)?.bankAccount?.staticQrUrl ||
    (selectedBankDetail?.data as any)?.walletAccount?.staticQrUrl ||
    null;
  const walletQrUrl =
    (selectedWalletDetail?.data as any)?.mediaArr?.[0]?.imageUrl ||
    (selectedWalletDetail?.data as any)?.walletAccount?.staticQrUrl ||
    (selectedWalletDetail?.data as any)?.bankAccount?.staticQrUrl ||
    null;

  const {
    data: allCustomers,
    isSuccess: customerSuccess,
    isLoading: customerDataLoading,
    refetch: customerRefetch,
  } = useGetApiQuery({ url: customerUrl });

  const closeDialog = () => {
    setDialogOpen(false);
  };

  const handleCheckoutTypeChange = (type: "guest" | "member") => {
    setCheckoutType(type);
    if (type === "guest") {
      setSelectedMember(null);
    }
  };

  const handlePayment = async () => {
    try {
      // Expand selected orderItemIds to include child addon item IDs
      const selectedSet = new Set(selectedIds);
      const addonIdsForSelected = (previewData.items || [])
        .filter((it: any) => selectedSet.has(String(it.id)))
        .flatMap((it: any) => (Array.isArray(it.addons) ? it.addons : []))
        .map((a: any) => Number(a.id))
        .filter((n: any) => !isNaN(n));

      // Map UI payment types
      const mapPaymentMethod = (
        t: typeof paymentType,
      ): "cash" | "card" | "online" => {
        if (t === "cash") return "cash";
        if (t === "qr") return "online";
        if (t === "bank") return "card";
        return "cash"; // fallback, split handled separately
      };

      const isSelective = selectedIds.length > 0;
      const isCheckoutAll = Array.isArray(orderId) && selectedIds.length === 0;
      const isTakeaway =
        !Array.isArray(orderId) &&
        (order?.data?.orderType === "takeaway" || !tableId);

      // Selective checkout
      let payload: any;
      if (isSelective) {
        if (isTakeaway) {
          payload = {
            paymentMethod: mapPaymentMethod(paymentType),
            orderId,
            ...(checkoutType === "member" && selectedMember
              ? { customerId: selectedMember.id }
              : {}),
          };
        } else {
          payload = {
            paymentMethod: mapPaymentMethod(paymentType),
            orderItemIds: [...selectedIds.map(Number), ...addonIdsForSelected],
            ...(checkoutType === "member" && selectedMember
              ? { customerId: selectedMember.id }
              : {}),
          };
        }
      }

      // Checkout all:
      if (!
        isSelective && isCheckoutAll) {
        payload = {
          checkoutAll: true,
          sessionId: table?.data?.sessionId,
          paymentMethod: mapPaymentMethod(
            paymentType === "bank" ? "qr" : paymentType,
          ), // only cash|online allowed
          cashOrCredit: paymentType === "cash" ? "cash" : "credit",
          ...(checkoutType === "member" && selectedMember
            ? { customerId: selectedMember.id }
            : {}),
        };
      }

      // Fallback:
      if (!payload && Array.isArray(items) && items.length > 0) {
        payload = {
          paymentMethod: mapPaymentMethod(paymentType),
          orderItemIds: items.map((it: any) => Number(it.id)),
          ...(checkoutType === "member" && selectedMember
            ? { customerId: selectedMember.id }
            : {}),
        };
      }

      if (paymentType === "cash") {
        const response = await checkoutOrderApi({
          id: tableId,
          body: payload,
        }).unwrap();

        if (response?.success) {
          handleResponse({ res: response });
          setIsPaymentSuccess(true);
        }
      }

      if (paymentType === "qr") {
        // For QR code payments
        let qrPayload;
        if (isTakeaway) {
          qrPayload = {
            paymentMethod: "online",
            orderId,
            accountId: selectedBankId,
            ...(checkoutType === "member" && selectedMember
              ? { customerId: selectedMember.id }
              : {}),
          };
        } else {
          qrPayload = {
            checkoutAll: true,
            sessionId: table?.data?.sessionId,
            paymentMethod: "online",
            cashOrCredit: "cash",
            accountId: selectedBankId || selectedWalletId,
            ...(checkoutType === "member" && selectedMember
              ? { customerId: selectedMember.id }
              : {}),
          };
        }

        const response = await checkoutOrderApi({
          id: tableId,
          body: qrPayload,
        }).unwrap();

        if (response?.success) {
          handleResponse({ res: response });
          setIsPaymentSuccess(true);
        }
      }

      if (paymentType === "split") {
        const response = await checkoutOrderApi({
          id: tableId,
          body: { checkoutAll: true, payments: splitPaymentData },
        }).unwrap();

        if (response?.success) {
          handleResponse({ res: response });
          setIsPaymentSuccess(true);
        }
      }

      setTimeout(() => {
        setIsPaymentSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      handleError({ error });
    }
  };

  const handleOpenPreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleSubmitAndPrint = async () => {
    try {
      setShowPreview(true);
      await new Promise((res) => setTimeout(res, 300));
      await handlePayment();
      await printBill();
    } catch (e) {
      handleError({ error: e });
    }
  };

  const displayCustomerName = useMemo(() => {
    if (checkoutType === "member" && selectedMember) {
      const name =
        `${selectedMember.firstName || ""} ${selectedMember.lastName || ""}`.trim();
      return name || "Guest";
    }
    return "Guest";
  }, [checkoutType, selectedMember]);

  const previewData = useMemo(() => {
    const getItemAddons = (parent: any, raw: any[]) => {
      const embedded = Array.isArray(parent?.addons)
        ? parent.addons.map((ad: any, idx: number) => {
            const name = ad?.addon?.name ?? ad?.name ?? `Addon #${idx + 1}`;
            const price = Number(ad?.price ?? ad?.addon?.price ?? 0);
            const quantity = Number(ad?.quantity ?? 1);
            return {
              id:
                ad?.id ??
                ad?.orderItemId ??
                ad?.addonId ??
                `${parent.id}_ad_${idx}`,
              name,
              quantity,
              price,
              subtotal: Number(ad?.subtotal ?? price),
            };
          })
        : [];
      if (embedded.length > 0) return embedded;
      return raw
        .filter((it) => it.parentOrderItemId === parent.id)
        .map((a: any) => ({
          id: a.id,
          name: a?.product?.name ?? `Addon #${a.id}`,
          quantity: Number(a.quantity ?? 0),
          price: Number(a.price ?? 0),
          subtotal: Number(a.subtotal ?? 0),
        }));
    };

    // Single order
    if (!Array.isArray(orderId)) {
      const orderData: any = order?.data || {};
      const raw: any[] = Array.isArray(orderData.orderItems)
        ? orderData.orderItems
        : [];
      const parents = raw.filter((it) => !it.parentOrderItemId);
      const items = parents.map((parent: any) => {
        const addons = getItemAddons(parent, raw);
        const addonsTotal = addons.reduce(
          (s: number, a: any) => s + (Number(a.subtotal) || 0),
          0,
        );
        const baseSubtotal = Number(
          parent.subtotal ??
            Number(parent?.product?.price ?? parent.price ?? 0) *
              Number(parent.quantity ?? 0),
        );
        return {
          id: parent.id,
          productName: parent?.product?.name ?? parent.productName ?? "Item",
          quantity: Number(parent.quantity ?? 0),
          productPrice: Number(parent?.product?.price ?? parent.price ?? 0),
          subtotal: baseSubtotal,
          addons,
          totalWithAddons: baseSubtotal + addonsTotal,
        };
      });

      return {
        orderNumber: orderData.orderNumber,
        tableNo: orderData?.table?.tableNo ?? table?.data?.tableNo ?? null,
        orderType: orderData.orderType,
        deliveryAddress: orderData.deliveryAddress,
        orderNote: orderData.orderNote,
        customerInfo: { name: displayCustomerName },
        items,
        totalAmount: Number(orderData.totalAmount ?? 0),
      };
    }

    // Checkout all (multiple orders)
    const orders = Array.isArray(activeOrdersResp?.data?.orders)
      ? activeOrdersResp?.data?.orders
      : [];
    const items = orders.flatMap((o: any) => {
      const raw: any[] = Array.isArray(o?.orderItems) ? o.orderItems : [];
      const parents = raw.filter((it) => !it.parentOrderItemId);
      return parents.map((parent: any) => {
        const addons = getItemAddons(parent, raw);
        const addonsTotal = addons.reduce(
          (s: number, a: any) => s + (Number(a.subtotal) || 0),
          0,
        );
        const baseSubtotal = Number(
          parent.subtotal ??
            Number(
              parent?.product?.price ??
                parent.productPrice ??
                parent.price ??
                0,
            ) * Number(parent.quantity ?? 0),
        );
        return {
          id: parent.id,
          productName: parent?.product?.name ?? parent.productName ?? "Item",
          quantity: Number(parent.quantity ?? 0),
          productPrice: Number(
            parent?.product?.price ?? parent.productPrice ?? parent.price ?? 0,
          ),
          subtotal: baseSubtotal,
          addons,
          totalWithAddons: baseSubtotal + addonsTotal,
        };
      });
    });
    const totalAmount = orders.reduce(
      (sum: number, o: any) => sum + Number(o?.totalAmount ?? 0),
      0,
    );

    return {
      orderNumber: undefined,
      tableNo: table?.data?.tableNo ?? null,
      orderType: undefined,
      deliveryAddress: undefined,
      orderNote: undefined,
      customerInfo: { name: displayCustomerName },
      items,
      totalAmount,
    };
  }, [
    orderId,
    order,
    table,
    activeOrdersResp,
    displayCustomerName,
    checkoutType,
    selectedMember,
  ]);

  const items = previewData.items as any[];
  const allSelected = items?.length > 0 && selectedIds.length === items.length;

  useEffect(() => {
    const itemIds = (items || []).map((it) => String(it.id));
    if (itemIds.length === 0) {
      setSelectedIds([]);
      return;
    }
    if (selectedItemIds && selectedItemIds.length > 0) {
      const incoming = selectedItemIds.map((n) => String(n));
      const filtered = itemIds.filter((id) => incoming.includes(id));
      setSelectedIds(filtered);
    } else {
      // Default to all selected if nothing provided
      setSelectedIds(itemIds);
    }
  }, [orderId, items, selectedItemIds]);
  const toggleSelectAll = () => {
    if (!items || items.length === 0) return;
    setSelectedIds((prev) =>
      prev.length === items.length ? [] : items.map((it) => String(it.id)),
    );
  };
  const toggleRow = (id: any) => {
    const sid = String(id);
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    );
  };

  // Subtotal of only selected items
  const selectedSubtotal = useMemo(() => {
    if (!items || items.length === 0) return 0;
    const set = new Set(selectedIds);
    return items
      .filter((it: any) => set.has(String(it.id)))
      .reduce((sum: number, it: any) => {
        const base = Number(it.subtotal) || 0;
        const addonsTotal = Array.isArray(it.addons)
          ? it.addons.reduce(
              (s: number, a: any) => s + (Number(a.subtotal) || 0),
              0,
            )
          : 0;
        const combined = Number(it.totalWithAddons ?? base + addonsTotal);
        return sum + combined;
      }, 0);
  }, [items, selectedIds]);

  const orderIdForBill = Array.isArray(orderId) ? null : orderId;

  const billData = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    const filteredItems = (previewData.items || []).filter((it: any) =>
      selectedSet.has(String(it.id)),
    );
    return {
      ...previewData,
      items: filteredItems,
      totalAmount: selectedSubtotal,
    } as typeof previewData;
  }, [previewData, selectedIds, selectedSubtotal]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          {isPaymentSuccess ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className={`${styles.successContainer} text-center`}>
                <div className={styles.checkmarkContainer}>
                  <svg
                    className={styles.checkmark}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 52 52"
                  >
                    <circle
                      className={styles.checkmarkCircle}
                      cx="26"
                      cy="26"
                      r="25"
                      fill="none"
                    />
                    <path
                      className={styles.checkmarkCheck}
                      fill="none"
                      d="M14.1 27.2l7.1 7.2 16.7-16.8"
                    />
                  </svg>
                </div>
                <p className={styles.successMessage}>Payment Successful!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="sticky top-0 bg-white pb-2 pt-[24px]">
                <div className="flex justify-between items-center">
                  <h2 className={styles.modalTitle}>
                    Checkout - Table{" "}
                    {order?.data?.table?.tableNo || table?.data?.tableNo}
                  </h2>
                  <button onClick={onClose} className="p-1 -mr-1">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                {/* Left column: Order details and member section */}
                <div className="flex flex-col gap-4 lg:col-span-2">
                  <div className="mt-4 border border-1 rounded p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 ">
                      <h2 className="font-semibold text-[17px]">
                        Order Details
                      </h2>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          aria-label="Select all order items"
                        />
                        <span>Select All</span>
                      </label>
                    </div>
                    <div className="overflow-x-auto rounded border">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-[15px]">
                            <th className="p-2 border text-center w-12">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                aria-label="Select all order items"
                              />
                            </th>
                            <th className="p-2 sm:p-4 border text-left w-12">
                              S.N
                            </th>
                            <th className="p-2 sm:p-4 border text-left">
                              Item
                            </th>
                            <th className="p-2 sm:p-4 border text-right w-24">
                              Quantity
                            </th>
                            <th className="p-2 sm:p-4 border text-right w-28">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(!items || items.length === 0) && (
                            <tr>
                              <td
                                className="p-3 text-center text-gray-500"
                                colSpan={5}
                              >
                                No items
                              </td>
                            </tr>
                          )}
                          {items?.map((it: any, idx) => {
                            const sid = String(it.id);
                            return (
                              <tr
                                key={sid}
                                className="odd:bg-white even:bg-gray-50 text-[15px]"
                              >
                                <td className="p-2 sm:p-4 border text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(sid)}
                                    onChange={() => toggleRow(it.id)}
                                    aria-label={`Select item ${it.productName}`}
                                  />
                                </td>
                                <td className="p-2 sm:p-4 border">{idx + 1}</td>
                                <td className="p-2 sm:p-4 border">
                                  <div className="flex flex-col gap-1">
                                    <div className="font-medium">
                                      {it.productName}
                                    </div>
                                    {Array.isArray(it.addons) &&
                                    it.addons.length > 0 ? (
                                      <div className="text-xs text-gray-600 flex flex-col gap-1">
                                        {it.addons.map((addon: any) => (
                                          <div
                                            key={`${sid}_addon_${addon.id}`}
                                            className="flex items-center justify-between"
                                          >
                                            <span>{`+ ${addon.name} (x${addon.quantity})`}</span>
                                            <span>
                                              {Number(
                                                addon.subtotal || 0,
                                              ).toFixed(2)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-500 text-left">
                                        No addons
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2 sm:p-4 border text-right">
                                  {it.quantity}
                                </td>
                                <td className="p-2 sm:p-4 border text-right">
                                  {(
                                    Number(it.totalWithAddons ?? 0) ||
                                    Number(it.subtotal ?? 0) +
                                      (Array.isArray(it.addons)
                                        ? it.addons.reduce(
                                            (s: number, a: any) =>
                                              s + (Number(a.subtotal) || 0),
                                            0,
                                          )
                                        : 0)
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Selected: {selectedIds.length} / {items?.length || 0}
                    </div>
                  </div>
                  <div className="flex flex-col border border-1 rounded p-4 sm:p-6 gap-4 sm:gap-6 font-semibold">
                    <div className="flex justify-between">
                      <h3 className="text-[17px]">Sub Total</h3>
                      <h3 className="text-[17px]">
                        {CurrencySign} {selectedSubtotal.toFixed(2)}
                      </h3>
                    </div>
                    <div className="flex justify-between">
                      <h3 className="text-[17px]">Total</h3>
                      <h3 className="text-[17px]">
                        {CurrencySign} {selectedSubtotal.toFixed(2)}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-col border border-1 rounded p-4 gap-4 sm:gap-6 font-bold ">
                    <div className="flex justify-between">
                      <h2 className="text-[17px]">Checkout As:</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="guest"
                          checked={checkoutType === "guest"}
                          onChange={() => handleCheckoutTypeChange("guest")}
                          className="mr-2"
                        />
                        <span className={styles.paymentText}>Guest</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="member"
                            checked={checkoutType === "member"}
                            onChange={() => handleCheckoutTypeChange("member")}
                            className="mr-2"
                          />
                          <span className={styles.paymentText}>Member</span>
                        </label>
                        {checkoutType === "member" && (
                          <CustomDialog
                            buttonTitle={
                              <button
                                type="button"
                                className="flex gap-[0.5rem] items-center py-[0.25rem] px-[0.75rem] bg-primaryColor text-white rounded-[0.25rem]"
                              >
                                <FaPlus />
                                Add
                              </button>
                            }
                            dialogOpen={dialogOpen}
                            setDialogOpen={setDialogOpen}
                            title="Add User"
                          >
                            <AddEditCustomer
                              isComponent={true}
                              closeModal={closeDialog}
                            />
                          </CustomDialog>
                        )}
                      </div>
                    </div>
                    {checkoutType === "member" && (
                      <div>
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
                          <label
                            className={`${styles.paymentLabel} block mb-1 w-[12rem]`}
                          >
                            Search Member:
                          </label>
                          <Input
                            value={customerSearchTerm}
                            onChange={(e) => {
                              setCustomerSearchTerm(e.target.value);
                            }}
                            className="w-full sm:w-[75%]"
                          />
                          <button
                            onClick={customerRefetch}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Search
                          </button>
                        </div>
                        {customerDataLoading ? (
                          <p className="text-gray-500">Loading members...</p>
                        ) : customerSuccess &&
                          customerSearchTerm.trim().length > 0 ? (
                          <div className="mt-2 max-h-60 overflow-y-auto">
                            {allCustomers?.data?.data?.map((customer: any) => (
                              <p
                                key={customer.id}
                                className={`mt-1 py-2 px-3 cursor-pointer rounded-sm ${
                                  customer.id === selectedMember?.id
                                    ? "bg-blue-50 text-blue-700"
                                    : "hover:bg-gray-100"
                                }`}
                                onClick={() => {
                                  setSelectedMember(customer);
                                  setCustomerSearchTerm(""); // Clear search term to hide the list
                                }}
                              >
                                {`${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                                  `Member ${customer.id}`}
                                <br />
                                <span className="text-sm text-gray-500">
                                  {customer.mobileNo || "No phone"}
                                </span>
                              </p>
                            ))}
                          </div>
                        ) : customerSearchTerm.trim().length > 0 ? (
                          <div>
                            <p className="text-red-500">No members found</p>
                            <button
                              onClick={customerRefetch}
                              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Retry
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                    {selectedMember && (
                      <div className="p-4 sm:p-6 lg:p-10 bg-gray-100 rounded-md flex flex-col sm:flex-row gap-4 sm:gap-8 lg:gap-11">
                        <p className={styles.paymentLabel}>Selected Member:</p>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 lg:gap-[8rem]">
                          <p className="flex items-center justify-start gap-2 font-medium">
                            <Contact size={17} />
                            <span className={styles.paymentLabel}>Name: </span>

                            {selectedMember.firstName +
                              " " +
                              selectedMember.lastName || "N/A"}
                          </p>
                          <p className="flex items-center justify-start gap-2 font-medium">
                            <Mail size={17} />
                            <span className={styles.paymentLabel}>
                              Email:{" "}
                            </span>{" "}
                            {selectedMember.email || "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Payment Method panel */}
                <div className="mt-4 lg:mt-4">
                  <div className="border border-1 rounded px-4 py-6 sm:py-8 md:sticky md:top-4">
                    <h2 className="font-semibold mb-4 text-[17px]">
                      Payment Method
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentType("cash")}
                        className={`border rounded-md p-3 text-[14px] font-medium transition ${
                          paymentType === "cash"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType("qr")}
                        className={`border rounded-md p-3 text-[14px] font-medium transition ${
                          paymentType === "qr"
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        QR / E-Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentType("split");
                          setSplitOpen(true);
                        }}
                        className={`border rounded-md p-3 text-[14px] font-medium transition ${
                          paymentType === "split"
                            ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        Split payment
                      </button>
                    </div>

                    {paymentType === "cash" && (
                      <div className="mt-4 flex flex-col gap-8">
                        <div>
                          <label className="text-[14px] flex items-center font-medium mb-2 block">
                            Tender Amount:
                          </label>
                          <input
                            type="number"
                            value={tenderAmount}
                            onChange={(e) => setTenderAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <p className="text-[14px] flex font-medium mb-2">
                            Quick Amount:
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {[100, 500, 1000, 2000, 5000, "Exact"].map(
                              (amount) => (
                                <button
                                  key={amount}
                                  type="button"
                                  onClick={() => {
                                    if (amount === "Exact") {
                                      setTenderAmount(
                                        previewData.totalAmount.toString(),
                                      );
                                    } else {
                                      setTenderAmount(amount.toString());
                                    }
                                  }}
                                  className="border rounded-md p-4 text-sm font-medium transition bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                                >
                                  {amount === "Exact"
                                    ? "Exact"
                                    : `${CurrencySign}${amount}`}
                                </button>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-md">
                          {/* <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Total Amount:
                            </span>
                            <span className="text-sm">
                              ₹{previewData.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm font-medium">
                              Tender Amount:
                            </span>
                            <span className="text-sm">
                              ₹{tenderAmount || "0.00"}
                            </span>
                          </div> */}
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                            <span className="text-[16px] font-semibold">
                              Change Due:
                            </span>
                            <span
                              className={`text-[16px] font-semibold ${
                                (parseFloat(tenderAmount) || 0) -
                                  selectedSubtotal >=
                                0
                                  ? "text-black"
                                  : "text-green-600"
                              }`}
                            >
                              {CurrencySign}
                              {Math.max(
                                0,
                                (parseFloat(tenderAmount) || 0) -
                                  selectedSubtotal,
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentType === "qr" && (
                      <div className="mt-4">
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">
                            Select QR Type:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {(["bank", "wallet"] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => {
                                  setSelectedQrCategory(
                                    type as "bank" | "wallet",
                                  );
                                  setSelectedBankId(null);
                                  setSelectedWalletId(null);
                                }}
                                className={`border rounded-md p-2 text-sm font-medium transition ${
                                  selectedQrCategory === type
                                    ? "bg-blue-50 border-blue-300 text-blue-700"
                                    : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                                }`}
                                aria-pressed={selectedQrCategory === type}
                              >
                                {type === "bank" ? "Bank" : "Wallet"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Dropdown for selected type */}
                        {selectedQrCategory === "bank" ? (
                          <div className="mb-4">
                            <label
                              htmlFor="qr-bank-select"
                              className="text-sm font-medium mb-2 block"
                            >
                              Select Bank Account:
                            </label>
                            <select
                              className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                              id="qr-bank-select"
                              value={selectedBankId ?? ""}
                              onChange={(e) =>
                                setSelectedBankId(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                            >
                              <option value="">-- Choose --</option>
                              {bankAccounts.map((acc: any) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc?.name ||
                                    acc?.accountName ||
                                    `Bank #${acc.id}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="mb-4">
                            <label
                              htmlFor="qr-wallet-select"
                              className="text-sm font-medium mb-2 block"
                            >
                              Select Wallet Account:
                            </label>
                            <select
                              className="w-full bg-white px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryColor focus:border-transparent"
                              id="qr-wallet-select"
                              value={selectedWalletId ?? ""}
                              onChange={(e) =>
                                setSelectedWalletId(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                            >
                              <option value="">-- Choose --</option>
                              {walletAccounts.map((acc: any) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc?.name ||
                                    acc?.accountName ||
                                    `Wallet #${acc.id}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* QR Preview */}
                        <div className="flex flex-col items-center ">
                          {selectedQrCategory === "bank" && selectedBankId && (
                            <>
                              <img
                                src={
                                  `${IMAGE_BASE_URL}${bankQrUrl}` || QR_IMAGE
                                }
                                alt="Bank Static QR"
                                className="w-full max-w-[280px] rounded-md border"
                              />
                              <p className="mt-2 text-xs text-gray-500">
                                Scan to pay via selected bank account.
                              </p>
                            </>
                          )}
                          {selectedQrCategory === "wallet" &&
                            selectedWalletId && (
                              <>
                                <img
                                  src={
                                    `${IMAGE_BASE_URL}${walletQrUrl}` ||
                                    QR_IMAGE
                                  }
                                  alt="Wallet Static QR"
                                  className="w-full max-w-[280px] rounded-md border"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                  Scan to pay via selected wallet account.
                                </p>
                              </>
                            )}
                          {((selectedQrCategory === "bank" &&
                            !selectedBankId) ||
                            (selectedQrCategory === "wallet" &&
                              !selectedWalletId)) && (
                            <p className="text-xs text-gray-500">
                              Select an account to view its static QR.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {paymentType === "split" && (
                      <div className="flex flex-col gap-3 mt-6">
                        {accountsResp?.data?.data?.map((account) => {
                          const paymentAccount = splitPaymentData?.find(
                            (acc: any) => acc.accountId === account.id,
                          );
                          if (paymentAccount) {
                            return (
                              <div
                                key={account.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                              >
                                <div className="flex items-center space-x-3">
                                  <p className="text-lg font-semibold text-gray-900 cursor-pointer">
                                    {account.name}
                                  </p>
                                </div>

                                <div className="w-32">
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                                      {CurrencySign}
                                    </span>
                                    <input
                                      type="number"
                                      disabled
                                      className="pl-6 text-right border rounded-md p-2 w-full bg-white"
                                      placeholder="0.00"
                                      value={paymentAccount.amount}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}

                    <div className="mt-6 gap-3 flex justify-center flex-wrap">
                      <div className="flex gap-3">
                        <button
                          onClick={handleOpenPreview}
                          disabled={
                            checkoutType === "member" && !selectedMember
                          }
                          className={`p-2 border rounded text-[14px] font-medium transition ${
                            checkoutType === "member" && !selectedMember
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-50"
                          }`}
                          title="Preview bill"
                        >
                          Preview Bill
                        </button>
                        <button
                          disabled={
                            paymentType === "split" && splitPaymentData === null
                          }
                          onClick={handlePayment}
                          className="p-2 bg-primaryColor text-white rounded text-[14px] font-medium hover:bg-opacity-90"
                          title={
                            paymentType === "cash"
                              ? "Submit"
                              : "Complete QR payment"
                          }
                        >
                          {paymentType === "cash"
                            ? "Submit"
                            : "Complete Payment"}
                        </button>
                        <button
                          disabled={
                            paymentType === "split" && splitPaymentData === null
                          }
                          onClick={handleSubmitAndPrint}
                          className="p-2 bg-emerald-600 text-white rounded text-[14px] font-medium hover:bg-emerald-700"
                          title="Submit and print the bill"
                        >
                          Submit & Print
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          <Drawer
            isOpen={splitOpen}
            setIsOpen={setSplitOpen}
            width="w-[90%] lg:w-[30%]"
          >
            <SplitPayment
              id={tableId}
              setSplitPaymentData={setSplitPaymentData}
              closeSplitPayment={() => setSplitOpen(false)}
            />
          </Drawer>
        </div>
      </div>
      {/* Preview Modal */}
      {/* <CheckoutPreview
        isOpen={showPreview}
        onClose={handleClosePreview}
        data={previewData}
        onCompletePayment={async () => {
          await handlePayment();
          handleClosePreview();
        }}
      /> */}
      <Bill
        ref={billRef}
        isOpen={showPreview}
        onClose={handleClosePreview}
        orderId={orderIdForBill}
        data={billData}
        customerInfo={previewData.customerInfo}
        onPrintBill={printBill}
        onCompletePayment={async () => {
          await handlePayment();
          handleClosePreview();
        }}
        className="bill-print"
      />
    </>
  );
};

export default CheckoutModal;
