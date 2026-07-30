import QR_IMAGE from "@/assets/qr-code.png";
import Bill from "@/components/Bill";
import CustomDialog from "@/components/Dialog";
import Input from "@/components/Input";
import { CurrencySign } from "@/constants";
import { ACCOUNT_URL, ORDER_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useCheckoutOrderMutation } from "@/redux/services/orders";
import {
  PaymentIntentData,
  useCancelQrPaymentMutation,
  useInitiateQrPaymentMutation,
  useLazyGetQrPaymentStatusQuery,
} from "@/redux/services/payment";
import { useGetActiveIntegrationAccountsQuery } from "@/redux/services/paymentIntegration";
import { buildAssetUrl } from "@/utils/buildAssetUrl";
import {
  amountsMatchWithinEpsilon,
  buildSplitCheckoutBody,
  CHECKOUT_ROUND_EPS,
  resolvePositiveId,
  roundMoney,
  sanitizeSplitPayments,
} from "@/utils/checkoutPayload";
import { buildQueryString } from "@/utils/generalHelper";
import { isNepalPayAccount } from "@/utils/paymentAccount";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { ArrowLeft, Banknote, Mail, Phone, Printer, QrCode, Split, X } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaPlus } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import AddEditCustomer from "../../Customer/AddEditCustomer";
import styles from "./CheckoutModal.module.css";
import DynamicQrDisplay from "./DynamicQrDisplay";
import SplitPayment from "./SplitPayment";

interface PaymentSource {
  id: number;
  name: string;
  accountType: "cash" | "bank" | "wallet";
  supportsDynamicQr: boolean;
}

// Define interfaces
interface Customer {
  id: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: number | null;
  orderId: number | null | number[];
  selectedItemIds?: number[];
  /** page = full route; modal kept for compatibility but unused by callers */
  variant?: "modal" | "page";
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  tableId,
  orderId,
  selectedItemIds,
  variant = "page",
}) => {
  const [paymentType, setPaymentType] = useState<"cash" | "qr" | "split">(
    "cash",
  );
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [checkoutType, setCheckoutType] = useState<"guest" | "member">("guest");
  const [selectedMember, setSelectedMember] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [selectedCashId, setSelectedCashId] = useState<number | null>(null);
  const [dynamicIntent, setDynamicIntent] =
    useState<PaymentIntentData | null>(null);
  const [dynamicQrError, setDynamicQrError] = useState<string | null>(null);
  const [tenderAmount, setTenderAmount] = useState<string>("");

  const [checkoutOrderApi] = useCheckoutOrderMutation();
  const [initiateQrPayment] = useInitiateQrPaymentMutation();
  const [cancelQrPayment] = useCancelQrPaymentMutation();
  const [fetchQrStatus] = useLazyGetQrPaymentStatusQuery();

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [splitPaymentData, setSplitPaymentData] = useState<any>(null);

  // Placeholder for Bill ref; print handler defined after data hooks
  const billRef = useRef<HTMLDivElement>(null);
  const dynamicIntentRef = useRef<PaymentIntentData | null>(null);
  const qrRefreshSeqRef = useRef(0);

  const customerUrl = buildQueryString("customer-auth/list", {
    page: 1,
    limit: 5,
    search: {
      isCombo: true,
      phone: customerSearchTerm,
    },
  });

  const resolvedOrderId = useMemo(() => {
    if (Array.isArray(orderId)) {
      return orderId.length === 1 ? Number(orderId[0]) : null;
    }
    if (orderId == null) return null;
    const n = Number(orderId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [orderId]);

  const { data: order } = useGetApiQuery(
    { url: `order/${resolvedOrderId}?itemStatus=active` },
    {
      skip: !isOpen || resolvedOrderId == null,
    },
  );

  // When checking out ALL (multiple orderIds), read active orders for the table
  const { data: activeOrdersResp } = useGetApiQuery(
    { url: `${ORDER_URL}active-orders/${tableId}` },
    {
      skip:
        !isOpen ||
        !Array.isArray(orderId) ||
        orderId.length <= 1 ||
        tableId == null ||
        !Number(tableId),
    },
  );

  const { data: table } = useGetApiQuery(
    { url: `table/${tableId}` },
    {
      skip: !isOpen || tableId == null || !Number(tableId),
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
  const { data: accountsResp } = useGetApiQuery(
    {
      url: buildQueryString("account/list", { page: 1, limit: 100 }),
    },
    { skip: !isOpen },
  );

  const allActiveAccounts: Array<any> = Array.isArray(accountsResp?.data?.data)
    ? accountsResp?.data?.data.filter((a: any) => a?.status === "active")
    : [];
  // Primary (isDefault) accounts are the ones shown in checkout payment options
  const primaryAccounts: Array<any> = allActiveAccounts.filter((a: any) =>
    Boolean(a?.isDefault),
  );
  const cashAccounts: Array<any> = primaryAccounts.filter(
    (a: any) => a?.accountType === "cash",
  );
  const qrAccounts: Array<any> = primaryAccounts.filter((a: any) =>
    ["bank", "wallet"].includes(a?.accountType),
  );

  useEffect(() => {
    if (!selectedCashId && cashAccounts.length > 0) {
      setSelectedCashId(Number(cashAccounts[0].id));
    }
  }, [cashAccounts, selectedCashId]);

  useEffect(() => {
    if (!selectedBankId && qrAccounts.length > 0) {
      setSelectedBankId(Number(qrAccounts[0].id));
    }
  }, [qrAccounts, selectedBankId]);

  // Fetch selected account details to fetch staticQr
  const { data: selectedBankDetail } = useGetApiQuery(
    selectedBankId ? { url: `${ACCOUNT_URL}${selectedBankId}` } : ({} as any),
    { skip: !selectedBankId },
  );

  const selectedQrAccount = useMemo(
    () =>
      primaryAccounts.find(
        (a: any) => Number(a.id) === Number(selectedBankId),
      ) ?? null,
    [primaryAccounts, selectedBankId],
  );

  // Accounts linked to an active NepalPay integration drive the dynamic-QR flow.
  // Name-based detection is kept only as a backward-compatible fallback.
  const { data: nepalPayAccountsResp } = useGetActiveIntegrationAccountsQuery(
    undefined,
    { skip: !isOpen },
  );
  const nepalPayAccountIds: number[] = nepalPayAccountsResp?.data || [];
  const isNepalPaySelected =
    !!selectedQrAccount &&
    (nepalPayAccountIds.includes(Number(selectedQrAccount.id)) ||
      isNepalPayAccount(selectedQrAccount));

  const checkoutOrderId = useMemo(() => {
    if (resolvedOrderId != null) return resolvedOrderId;
    const id = order?.data?.id;
    return id != null && Number(id) > 0 ? Number(id) : null;
  }, [resolvedOrderId, order]);

  // Prefer media array image when present, otherwise fall back to staticQrUrl fields
  const bankQrUrl =
    (selectedBankDetail?.data as any)?.mediaArr?.[0]?.imageUrl ||
    (selectedBankDetail?.data as any)?.bankAccount?.staticQrUrl ||
    (selectedBankDetail?.data as any)?.walletAccount?.staticQrUrl ||
    null;

  const paymentSources = useMemo<PaymentSource[]>(
    () =>
      primaryAccounts
        .filter((a: any) => ["cash", "bank", "wallet"].includes(a?.accountType))
        .map((a: any) => ({
          id: Number(a.id),
          name: String(a.name || "Unnamed account"),
          accountType: a.accountType,
          supportsDynamicQr:
            a.accountType !== "cash" &&
            (nepalPayAccountIds.includes(Number(a.id)) || isNepalPayAccount(a)),
        })),
    [primaryAccounts, nepalPayAccountIds],
  );
  const selectedPaymentSource = useMemo(
    () =>
      paymentType === "cash"
        ? paymentSources.find((s) => s.id === selectedCashId) ?? null
        : paymentSources.find((s) => s.id === selectedBankId) ?? null,
    [paymentSources, paymentType, selectedCashId, selectedBankId],
  );

  const {
    data: allCustomers,
    isSuccess: customerSuccess,
    isLoading: customerDataLoading,
    isError: customerSearchError,
    refetch: customerRefetch,
  } = useGetApiQuery(
    { url: customerUrl },
    { skip: !isOpen || checkoutType !== "member" },
  );

  const customerResults = useMemo(
    () => allCustomers?.data?.data ?? [],
    [allCustomers],
  );
  const isSearchingMember = customerSearchTerm.trim().length > 0;

  const getMemberDisplayName = useCallback((customer: Customer) => {
    const name =
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    return name || `Member ${customer.id}`;
  }, []);

  const getMemberInitials = useCallback(
    (customer: Customer) => {
      const name = getMemberDisplayName(customer);
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    },
    [getMemberDisplayName],
  );

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchTerm(value);
    if (value.trim()) {
      setSelectedMember(null);
    }
  };

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
      if (paymentType === "cash") {
        const tendered = parseFloat(tenderAmount) || 0;
        if (tendered + CHECKOUT_ROUND_EPS < selectedSubtotal) {
          handleError({
            error: {
              data: {
                message: `Cash received must be at least ${CurrencySign}${selectedSubtotal.toFixed(2)}`,
              },
            },
          });
          return;
        }
        if (tendered > selectedSubtotal + CHECKOUT_ROUND_EPS) {
          handleError({
            error: {
              data: {
                message: `Cash received cannot exceed ${CurrencySign}${selectedSubtotal.toFixed(2)}`,
              },
            },
          });
          return;
        }
      }

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
        return "cash"; // fallback, split handled separately
      };

      const isPartialSelection =
        selectedIds.length > 0 &&
        Array.isArray(items) &&
        selectedIds.length < items.length;
      // Any item selection uses selective item checkout; partial leaves unpaid items
      const isSelective = selectedIds.length > 0;
      const isCheckoutAll = Array.isArray(orderId) && selectedIds.length === 0;
      const isTakeaway =
        !Array.isArray(orderId) &&
        (order?.data?.orderType === "takeaway" || !tableId);

      const selectedPaymentAccountId =
        paymentType === "cash" ? selectedCashId : selectedBankId;

      const withAccountId = (body: Record<string, unknown>) =>
        selectedPaymentAccountId
          ? { ...body, accountId: selectedPaymentAccountId }
          : body;

      // Only send customerId for members. Do not send isGuestOrder — older
      // production APIs use .unknown(false) and reject it with
      // "valid checkout types". Backend infers guest from missing customerId.
      const memberFields =
        checkoutType === "member" && selectedMember
          ? { customerId: selectedMember.id }
          : {};

      const selectiveItemIds = [
        ...selectedIds.map(Number),
        ...addonIdsForSelected,
      ];

      // Selective / partial item checkout — always use orderItemIds so unpaid
      // items remain and paymentStatus becomes partially_paid.
      let payload: any;
      if (isSelective && isPartialSelection) {
        payload = withAccountId({
          paymentMethod: mapPaymentMethod(paymentType),
          orderItemIds: selectiveItemIds,
          ...memberFields,
        });
      } else if (isSelective && isTakeaway && orderId) {
        // All takeaway items selected → settle whole order
        payload = withAccountId({
          paymentMethod: mapPaymentMethod(paymentType),
          orderId,
          ...memberFields,
        });
      } else if (isSelective) {
        payload = withAccountId({
          paymentMethod: mapPaymentMethod(paymentType),
          orderItemIds: selectiveItemIds,
          ...memberFields,
        });
      } else if (!Array.isArray(orderId) && orderId && isTakeaway) {
        payload = withAccountId({
          paymentMethod: mapPaymentMethod(paymentType),
          orderId,
          ...memberFields,
        });
      }

      // Checkout all:
      if (!isSelective && isCheckoutAll) {
        payload = withAccountId({
          checkoutAll: true,
          sessionId: table?.data?.sessionId,
          paymentMethod: mapPaymentMethod(paymentType),
          cashOrCredit: paymentType === "cash" ? "cash" : "credit",
          ...memberFields,
        });
      }

      // Fallback:
      if (!payload && Array.isArray(items) && items.length > 0) {
        payload = withAccountId({
          paymentMethod: mapPaymentMethod(paymentType),
          orderItemIds: items.map((it: any) => Number(it.id)),
          ...memberFields,
        });
      }

      if (paymentType === "cash") {
        if (!selectedCashId) {
          handleError({
            error: {
              data: {
                message:
                  "Select a primary cash account, or mark a cash account as primary in Cash & Banks.",
              },
            },
          });
          return;
        }
        if (!payload) {
          handleError({
            error: {
              data: {
                message:
                  "Unable to prepare payment. Select items and try again.",
              },
            },
          });
          return;
        }
        const response = await checkoutOrderApi({
          id: tableId ?? 0,
          body: payload,
        }).unwrap();

        if (response?.success) {
          handleResponse({ res: response });
          setIsPaymentSuccess(true);
        }
      }

      if (paymentType === "qr") {
        if (isNepalPaySelected) {
          if (dynamicIntent?.status === "paid") {
            setIsPaymentSuccess(true);
            setTimeout(() => {
              setIsPaymentSuccess(false);
              onClose();
            }, 2000);
            return;
          }
          handleError({
            error: {
              data: {
                message:
                  "Waiting for NEPALPAY payment. Customer must scan the dynamic QR first.",
              },
            },
          });
          return;
        }

        // Static QR — manual confirm via checkout API
        let qrPayload;
        if (isSelective && isPartialSelection) {
          qrPayload = withAccountId({
            paymentMethod: "online",
            orderItemIds: selectiveItemIds,
            ...memberFields,
          });
        } else if (isTakeaway) {
          qrPayload = {
            paymentMethod: "online",
            orderId,
            accountId: selectedBankId,
            ...memberFields,
          };
        } else if (isSelective) {
          qrPayload = withAccountId({
            paymentMethod: "online",
            orderItemIds: selectiveItemIds,
            ...memberFields,
          });
        } else {
          qrPayload = {
            checkoutAll: true,
            sessionId: table?.data?.sessionId,
            paymentMethod: "online",
            cashOrCredit: "cash",
            accountId: selectedBankId,
            ...memberFields,
          };
        }

        const response = await checkoutOrderApi({
          id: tableId ?? 0,
          body: qrPayload,
        }).unwrap();

        if (response?.success) {
          handleResponse({ res: response });
          setIsPaymentSuccess(true);
        }
      }

      if (paymentType === "split") {
        const payments = sanitizeSplitPayments(splitPaymentData);
        if (!payments) {
          handleError({
            error: {
              data: {
                message:
                  "Set up split payment before completing the sale. Each line needs a valid account and amount.",
              },
            },
          });
          return;
        }

        const splitTotal = roundMoney(
          payments.reduce((sum, payment) => sum + payment.amount, 0),
        );
        if (!amountsMatchWithinEpsilon(splitTotal, selectedSubtotal)) {
          handleError({
            error: {
              data: {
                message: `Split payments (${splitTotal.toFixed(2)}) must equal the amount due (${selectedSubtotal.toFixed(2)}).`,
              },
            },
          });
          return;
        }

        const memberCustomerId =
          checkoutType === "member" && selectedMember?.id != null
            ? Number(selectedMember.id)
            : null;

        const resolvedOrderId = resolvePositiveId(
          !Array.isArray(orderId) ? orderId : null,
          Array.isArray(orderId) && orderId.length === 1 ? orderId[0] : null,
          checkoutOrderId,
        );

        const splitBody = buildSplitCheckoutBody({
          payments,
          orderId:
            isSelective && isPartialSelection
              ? null
              : isSelective && !isTakeaway
                ? null
                : resolvedOrderId,
          orderItemIds:
            isSelective && (isPartialSelection || !isTakeaway)
              ? selectiveItemIds
              : undefined,
          checkoutAll: !isSelective && (isCheckoutAll || !resolvedOrderId),
          customerId: memberCustomerId,
          sessionId: table?.data?.sessionId ?? null,
        });

        // Takeaway full-order settle uses orderId path (not partial item pay)
        if (isTakeaway && resolvedOrderId && !isPartialSelection) {
          splitBody.orderId = resolvedOrderId;
          delete splitBody.orderItemIds;
          delete splitBody.checkoutAll;
          delete splitBody.sessionId;
        }

        const response = await checkoutOrderApi({
          id: tableId ?? 0,
          body: splitBody,
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
        totalAmount:
          orderData.calculatedTotal ?? Number(orderData.totalAmount ?? 0),
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

  // Checkout-all (multiple orders on a table) supports dynamic QR only when the
  // whole bill is selected — partial item selection across orders isn't a
  // single combined QR payment.
  const canDynamicCheckoutAll =
    Array.isArray(orderId) && allSelected && tableId != null;

  const canUseDynamicQr =
    isNepalPaySelected &&
    selectedSubtotal > 0 &&
    paymentType === "qr" &&
    !!selectedBankId &&
    (checkoutOrderId != null || canDynamicCheckoutAll);

  const tenderValue = parseFloat(tenderAmount) || 0;
  const changeDue = Math.max(0, tenderValue - selectedSubtotal);
  const amountDue = Math.max(0, selectedSubtotal - tenderValue);
  const cashTenderShort =
    paymentType === "cash" &&
    tenderAmount.trim() !== "" &&
    tenderValue + CHECKOUT_ROUND_EPS < selectedSubtotal;
  const cashTenderExcessive =
    paymentType === "cash" &&
    tenderValue > selectedSubtotal + CHECKOUT_ROUND_EPS;

  const handleTenderAmountChange = (value: string) => {
    if (value === "" || value === ".") {
      setTenderAmount(value);
      return;
    }

    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;

    if (parsed > selectedSubtotal) {
      setTenderAmount(selectedSubtotal.toFixed(2));
      return;
    }

    setTenderAmount(value);
  };

  useEffect(() => {
    if (paymentType === "cash") {
      setTenderAmount(selectedSubtotal.toFixed(2));
    }
  }, [paymentType, selectedSubtotal]);

  useEffect(() => {
    dynamicIntentRef.current = dynamicIntent;
  }, [dynamicIntent]);

  /** Cancel/stop the active dynamic QR when leaving checkout or leaving NepalPay QR. */
  const abandonPendingQr = useCallback(() => {
    qrRefreshSeqRef.current += 1;
    const pending = dynamicIntentRef.current;
    setDynamicIntent(null);
    setDynamicQrError(null);
    if (pending?.status !== "pending") return;
    void cancelQrPayment(pending.id)
      .unwrap()
      .catch(() => {
        /* already settled, expired, or replaced */
      });
  }, [cancelQrPayment]);

  useEffect(() => {
    setDynamicIntent(null);
    setDynamicQrError(null);
  }, [selectedBankId]);

  useEffect(() => {
    if (isOpen && canUseDynamicQr) return;
    abandonPendingQr();
  }, [isOpen, canUseDynamicQr, abandonPendingQr]);

  useEffect(() => {
    if (!isOpen || !canUseDynamicQr) return;

    const seq = ++qrRefreshSeqRef.current;
    setDynamicQrError(null);

    const timer = setTimeout(() => {
      const refreshQr = async () => {
        const previous = dynamicIntentRef.current;

        if (
          previous?.status === "pending" &&
          Math.abs(Number(previous.amount) - selectedSubtotal) >= 0.01
        ) {
          try {
            await cancelQrPayment(previous.id).unwrap();
          } catch {
            /* backend may already have replaced it */
          }
          if (seq !== qrRefreshSeqRef.current) return;
          setDynamicIntent(null);
        }

        const fetchFreshQr = async (attempt = 0): Promise<void> => {
          const body =
            checkoutOrderId != null
              ? {
                  orderId: checkoutOrderId,
                  amount: selectedSubtotal,
                  accountId: selectedBankId ?? undefined,
                }
              : {
                  tableId: tableId!,
                  checkoutAll: true,
                  amount: selectedSubtotal,
                  accountId: selectedBankId ?? undefined,
                };

          const res = await initiateQrPayment(body).unwrap();

          if (seq !== qrRefreshSeqRef.current) return;

          if (!res.success || !res.data) {
            setDynamicIntent(null);
            setDynamicQrError(
              res.message || "Unable to generate dynamic QR. Try again.",
            );
            return;
          }

          const intent = res.data;
          const amountMatches =
            Math.abs(Number(intent.amount) - selectedSubtotal) < 0.01;

          if (!amountMatches) {
            if (intent.status === "pending" && attempt < 2) {
              try {
                await cancelQrPayment(intent.id).unwrap();
              } catch {
                /* retry initiate anyway */
              }
              if (seq !== qrRefreshSeqRef.current) return;
              return fetchFreshQr(attempt + 1);
            }

            setDynamicIntent(null);
            setDynamicQrError(
              "QR amount is out of date. Change the total and try again.",
            );
            return;
          }

          setDynamicIntent(intent);
          setDynamicQrError(null);
        };

        try {
          await fetchFreshQr();
        } catch (error: any) {
          if (seq !== qrRefreshSeqRef.current) return;
          setDynamicIntent(null);
          setDynamicQrError(
            error?.data?.msg ||
              error?.data?.message ||
              "Unable to generate dynamic QR. Try again or use static QR.",
          );
        }
      };

      void refreshQr();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isOpen,
    canUseDynamicQr,
    checkoutOrderId,
    tableId,
    selectedSubtotal,
    selectedBankId,
    cancelQrPayment,
    initiateQrPayment,
  ]);

  useEffect(() => {
    if (!isOpen || !dynamicIntent || dynamicIntent.status !== "pending") return;

    const POLL_INTERVAL_MS = 5000;
    const MAX_POLL_ATTEMPTS = 60; // ~5 minutes — bank inquiry can lag on shared hosting
    let attempts = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const res = await fetchQrStatus(dynamicIntent.id, false).unwrap();
        if (res.success && res.data) {
          setDynamicIntent(res.data);
          if (res.data.status === "paid") {
            if (intervalId) clearInterval(intervalId);
            handleResponse({
              res: { success: true, message: "NEPALPAY payment received" },
            });
            setIsPaymentSuccess(true);
            setTimeout(() => {
              setIsPaymentSuccess(false);
              onClose();
            }, 2000);
          }
        }
      } catch (error: any) {
        const status = error?.status ?? error?.originalStatus;
        if (status === 401 || status === 403) {
          setDynamicQrError(
            "Session expired while waiting for payment. Refresh the page and check order status.",
          );
        }
      }
    };

    intervalId = setInterval(() => {
      attempts += 1;
      if (attempts > MAX_POLL_ATTEMPTS) {
        if (intervalId) clearInterval(intervalId);
        return;
      }
      void poll();
    }, POLL_INTERVAL_MS);

    // First poll immediately for faster UX.
    void poll();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    isOpen,
    dynamicIntent?.id,
    dynamicIntent?.status,
    fetchQrStatus,
    onClose,
  ]);

  const paymentSubmitDisabled =
    selectedSubtotal <= CHECKOUT_ROUND_EPS ||
    (paymentType === "split" && splitPaymentData === null) ||
    (paymentType === "cash" && !selectedCashId) ||
    (paymentType === "cash" &&
      (cashTenderShort ||
        cashTenderExcessive ||
        tenderValue + CHECKOUT_ROUND_EPS < selectedSubtotal)) ||
    (paymentType === "qr" && !selectedBankId) ||
    (paymentType === "qr" &&
      isNepalPaySelected &&
      dynamicIntent?.status !== "paid");

  const paymentSubmitLabel =
    paymentType === "cash" || paymentType === "split"
      ? `Complete Sale · ${CurrencySign}${selectedSubtotal.toFixed(2)}`
      : paymentType === "qr" &&
          isNepalPaySelected &&
          dynamicIntent?.status === "paid"
        ? "Done"
        : paymentType === "qr" && isNepalPaySelected
          ? "Waiting for QR payment…"
          : "Confirm QR Payment";

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

  const tableLabel =
    order?.data?.table?.tableNo || table?.data?.tableNo || null;
  const pageTitle = tableLabel
    ? `Checkout — Table ${tableLabel}`
    : "Checkout";

  const body = (
    <>
      {isPaymentSuccess ? (
        <div className="flex min-h-[60vh] items-center justify-center">
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
          <div
            className={
              variant === "page" ? styles.pageHeader : styles.modalHeader
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {variant === "page" && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h2
                  className={
                    variant === "page" ? styles.pageTitle : styles.modalTitle
                  }
                >
                  {pageTitle}
                </h2>
              </div>
              {variant !== "page" && (
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-1 p-1"
                  aria-label="Close checkout"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          <div
            className={variant === "page" ? styles.pageBody : styles.modalBody}
          >
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
                              handleCustomerSearchChange(e.target.value);
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
                        {customerDataLoading && isSearchingMember ? (
                          <p className="text-gray-500">Loading members...</p>
                        ) : isSearchingMember ? (
                          customerSuccess && customerResults.length > 0 ? (
                            <div className={styles.memberSearchResults}>
                              {customerResults.map((customer: Customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  className={styles.memberSearchResult}
                                  onClick={() => {
                                    setSelectedMember(customer);
                                    setCustomerSearchTerm("");
                                  }}
                                >
                                  <span className={styles.memberSearchResultName}>
                                    {getMemberDisplayName(customer)}
                                  </span>
                                  <span className={styles.memberSearchResultMeta}>
                                    {customer.mobileNo || "No phone"}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : customerSuccess ? (
                            <p className={styles.memberSearchEmpty}>
                              No members found
                            </p>
                          ) : customerSearchError ? (
                            <div>
                              <p className={styles.memberSearchEmpty}>
                                Could not search members
                              </p>
                              <button
                                type="button"
                                onClick={customerRefetch}
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                Retry
                              </button>
                            </div>
                          ) : null
                        ) : null}
                      </div>
                    )}
                    {selectedMember && !isSearchingMember && (
                      <div className={styles.selectedMemberCard}>
                        <div className={styles.selectedMemberAvatar}>
                          {getMemberInitials(selectedMember)}
                        </div>
                        <div className={styles.selectedMemberInfo}>
                          <p className={styles.selectedMemberLabel}>
                            Selected Member
                          </p>
                          <p className={styles.selectedMemberName}>
                            {getMemberDisplayName(selectedMember)}
                          </p>
                          <div className={styles.selectedMemberMeta}>
                            {selectedMember.email ? (
                              <span className={styles.selectedMemberMetaItem}>
                                <Mail size={14} />
                                {selectedMember.email}
                              </span>
                            ) : null}
                            {selectedMember.mobileNo ? (
                              <span className={styles.selectedMemberMetaItem}>
                                <Phone size={14} />
                                {selectedMember.mobileNo}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.selectedMemberClear}
                          onClick={() => setSelectedMember(null)}
                          aria-label="Remove selected member"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Payment Method panel */}
                <div className="mt-4 lg:mt-4">
                  <div className={styles.payPanel}>
                    <div className={styles.payPanelHeader}>
                      <h3 className={styles.paySectionTitle}>
                        {paymentType === "split"
                          ? "Split payment"
                          : "How are they paying?"}
                      </h3>
                      <button
                        type="button"
                        className={`${styles.splitLinkBtn} ${
                          paymentType === "split" ? styles.splitLinkBtnActive : ""
                        }`}
                        onClick={() =>
                          setPaymentType((prev) =>
                            prev === "split" ? "cash" : "split",
                          )
                        }
                      >
                        <Split size={14} />
                        {paymentType === "split" ? "Single payment" : "Split"}
                      </button>
                    </div>

                    {paymentType === "split" ? (
                      <SplitPayment
                        key={selectedSubtotal.toFixed(2)}
                        grandTotal={selectedSubtotal}
                        setSplitPaymentData={setSplitPaymentData}
                        isMemberAssigned={
                          checkoutType === "member" && !!selectedMember
                        }
                      />
                    ) : (
                      <>
                        <div className={styles.paymentSourceGrid}>
                          {paymentSources.length === 0 ? (
                            <p className={styles.payHintError}>
                              No active payment accounts found.
                            </p>
                          ) : (
                            paymentSources.map((source) => {
                              const isCash = source.accountType === "cash";
                              const isActive =
                                (isCash &&
                                  paymentType === "cash" &&
                                  selectedCashId === source.id) ||
                                (!isCash &&
                                  paymentType === "qr" &&
                                  selectedBankId === source.id);
                              return (
                                <button
                                  key={source.id}
                                  type="button"
                                  className={`${styles.paymentSourceBtn} ${
                                    isActive
                                      ? styles.paymentSourceBtnActive
                                      : ""
                                  }`}
                                  onClick={() => {
                                    if (isCash) {
                                      setPaymentType("cash");
                                      setSelectedCashId(source.id);
                                    } else {
                                      setPaymentType("qr");
                                      setSelectedBankId(source.id);
                                    }
                                  }}
                                >
                                  {isCash ? (
                                    <Banknote size={16} />
                                  ) : (
                                    <QrCode size={16} />
                                  )}
                                  <span className={styles.paymentSourceName}>
                                    {source.name}
                                  </span>
                                  <span className={styles.paymentSourceMeta}>
                                    {isCash
                                      ? "Cash counter"
                                      : source.supportsDynamicQr
                                        ? "Dynamic QR"
                                        : "Static QR"}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>

                        {paymentType === "cash" && (
                          <div className={styles.cashPanel}>
                            <p className={styles.payHint}>
                              {selectedPaymentSource?.name ??
                                "Select a cash counter"}
                            </p>
                            <label
                              className={styles.fieldLabel}
                              htmlFor="cash-received"
                            >
                              Cash received
                            </label>
                            <input
                              id="cash-received"
                              type="number"
                              value={tenderAmount}
                              onChange={(e) =>
                                handleTenderAmountChange(e.target.value)
                              }
                              placeholder="0.00"
                              className={`${styles.tenderInput} ${
                                cashTenderShort || cashTenderExcessive
                                  ? styles.tenderInputError
                                  : ""
                              }`}
                              min="0"
                              max={selectedSubtotal}
                              step="0.01"
                            />
                            {cashTenderShort ? (
                              <p className={styles.payHintError}>
                                Cash received must be at least {CurrencySign}{" "}
                                {selectedSubtotal.toFixed(2)}
                              </p>
                            ) : null}
                            <div className={styles.changeBox}>
                              <span className={styles.changeLabel}>
                                {tenderValue >= selectedSubtotal
                                  ? "Change"
                                  : "Short"}
                              </span>
                              <span
                                className={`${styles.changeValue} ${
                                  tenderValue >= selectedSubtotal
                                    ? styles.changeValueGood
                                    : styles.changeValueWarn
                                }`}
                              >
                                {CurrencySign}{" "}
                                {(tenderValue >= selectedSubtotal
                                  ? changeDue
                                  : amountDue
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {paymentType === "qr" && (
                          <div className={styles.payBlockBody}>
                            <p className={styles.payHint}>
                              {selectedPaymentSource?.name ??
                                "Select a bank or wallet"}
                            </p>

                            <div className={styles.qrPreview}>
                              {selectedBankId && isNepalPaySelected && (
                                <>
                                  {dynamicQrError && (
                                    <p className={styles.payHintError}>
                                      {dynamicQrError}
                                    </p>
                                  )}
                                  {!dynamicQrError &&
                                    (!dynamicIntent ||
                                      Math.abs(
                                        dynamicIntent.amount - selectedSubtotal,
                                      ) >= 0.01) && (
                                      <p className={styles.payHint}>
                                        Updating QR…
                                      </p>
                                    )}
                                  {dynamicIntent &&
                                    Math.abs(
                                      dynamicIntent.amount - selectedSubtotal,
                                    ) < 0.01 && (
                                      <DynamicQrDisplay
                                        qrImageUrl={dynamicIntent.qrImageUrl}
                                        qrPayload={dynamicIntent.qrPayload}
                                        amount={dynamicIntent.amount}
                                        merchantTxnRef={
                                          dynamicIntent.merchantTxnRef
                                        }
                                        expiresAt={dynamicIntent.expiresAt}
                                        status={dynamicIntent.status}
                                      />
                                    )}
                                </>
                              )}
                              {selectedBankId && !isNepalPaySelected && (
                                <img
                                  src={
                                    bankQrUrl
                                      ? buildAssetUrl(bankQrUrl)
                                      : QR_IMAGE
                                  }
                                  alt="Scan to pay"
                                  className={styles.qrImage}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      QR_IMAGE;
                                  }}
                                />
                              )}
                              {!selectedBankId && (
                                <p className={styles.payHint}>
                                  Choose a QR account to continue
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className={styles.payActions}>
                      <button
                        type="button"
                        disabled={paymentSubmitDisabled}
                        onClick={handlePayment}
                        className={styles.completeBtn}
                      >
                        {paymentSubmitLabel}
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenPreview}
                        className={styles.previewBtn}
                        disabled={
                          checkoutType === "member" && !selectedMember
                        }
                      >
                        Preview bill
                      </button>
                      <button
                        type="button"
                        disabled={paymentSubmitDisabled}
                        onClick={handleSubmitAndPrint}
                        className={styles.printBtn}
                      >
                        <Printer size={15} />
                        Print & pay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </>
          )}
    </>
  );

  return (
    <>
      {variant === "page" ? (
        <div className={styles.pageShell}>{body}</div>
      ) : (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>{body}</div>
        </div>
      )}
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
