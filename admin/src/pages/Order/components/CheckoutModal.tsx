import React, { useMemo, useState } from "react";
import { FaMoneyBillWave, FaPlus, FaQrcode } from "react-icons/fa";
import styles from "./CheckoutModal.module.css";
import QR_IMAGE from "@/assets/qr-code.png";
import { useCreateApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import CustomDialog from "@/components/Dialog";
import AddEditCustomer from "../../Customer/AddEditCustomer";
import { Mail, CircleUserRound, Contact } from "lucide-react";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import Input from "@/components/Input";
import { buildQueryString } from "@/utils/generalHelper";
import { useCheckoutOrderMutation } from "@/redux/services/orders";
import CheckoutPreview from "./CheckoutPreview";
import { X } from "lucide-react";
import { z } from "zod";
import { OrderSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
  tableId: number;
  orderId: number | null;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  tableId,
  orderId,
}) => {
  const [paymentType, setPaymentType] = useState<"cash" | "qr">("cash");
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

  const customerUrl = buildQueryString("customer-auth/list", {
    page: 1,
    limit: 5,
    search: {
      isCombo: true,
      phone: customerSearchTerm,
    },
  });

  const { data: order } = useGetApiQuery(
    { url: `order/${orderId}` },
    {
      skip: orderId === null || orderId === undefined,
    },
  );

  const { data: table } = useGetApiQuery(
    { url: `table/${tableId}` },
    {
      skip: orderId === null || orderId === undefined,
    },
  );

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
      const payload =
        checkoutType === "member" && selectedMember
          ? {
              paymentMethod: paymentType,
              customerId: selectedMember.id,
              orderId: orderId,
              checkoutAll: typeof orderId === "object",
            }
          : {
              paymentMethod: paymentType,
              orderId: orderId,
              checkoutAll: typeof orderId === "object",
            };

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
      setTimeout(() => {
        setIsPaymentSuccess(false);
        onClose();
      }, 2000); // Close modal after 2 seconds
    } catch (error) {
      handleError({ error });
    }
  };

  // Preview helpers
  const handleOpenPreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handlePrint = (targetId?: string) => {
    if (!targetId) {
      window.print();
      return;
    }
    const content = document.getElementById(targetId)?.innerHTML;
    if (!content) {
      window.print();
      return;
    }
    // const printWindow = window.open("", "_blank", "width=800,height=600");
    // if (!printWindow) return;
    // printWindow.document.open();
    // printWindow.document.write(`<!doctype html><html><head><title>Bill</title>
    //   <style>
    //     * { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif; }
    //     .text-right{ text-align:right; }
    //     .text-center{ text-align:center; }
    //     .grid{ display:grid; grid-template-columns: repeat(12, minmax(0, 1fr)); }
    //     .col-span-6{ grid-column: span 6 / span 6; }
    //     .col-span-2{ grid-column: span 2 / span 2; }
    //     .px-4{ padding-left:1rem; padding-right:1rem; }
    //     .py-2{ padding-top:0.5rem; padding-bottom:0.5rem; }
    //     .py-3{ padding-top:0.75rem; padding-bottom:0.75rem; }
    //     .bg-gray-100{ background:#f3f4f6; }
    //     .bg-gray-50{ background:#f9fafb; }
    //     .border{ border:1px solid #e5e7eb; }
    //   </style>
    // </head><body>${content}</body></html>`);
    // printWindow.document.close();
    // printWindow.focus();
    // printWindow.print();
    // printWindow.close();
  };

  const previewData = useMemo(() => {
    const orderData: any = order?.data || {};
    const items = Array.isArray(orderData.orderItems)
      ? orderData.orderItems.map((oi: any) => ({
          id: oi.id,
          productName: oi?.product?.name ?? oi.productName ?? "Item",
          quantity: Number(oi.quantity ?? 0),
          productPrice: Number(oi?.product?.price ?? oi.productPrice ?? 0),
          subtotal: Number(
            oi.subtotal ??
              Number(oi?.product?.price ?? 0) * Number(oi.quantity ?? 0),
          ),
        }))
      : [];

    return {
      orderNumber: orderData.orderNumber,
      tableNo: orderData?.table?.tableNo ?? table?.data?.tableNo ?? null,
      orderType: orderData.orderType,
      deliveryAddress: orderData.deliveryAddress,
      orderNote: orderData.orderNote,
      items,
      totalAmount: Number(orderData.totalAmount ?? 0),
    };
  }, [order, table]);

  const items = previewData.items as Array<{
    id: any;
    productName: string;
    quantity: number;
    subtotal: number;
  }>;
  const allSelected = items?.length > 0 && selectedIds.length === items.length;
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
              <div className="flex justify-between items-center ">
                <h2 className={styles.modalTitle}>
                  Checkout - Table{" "}
                  {order?.data?.table?.tableNo || table?.data?.tableNo}
                </h2>
                <button onClick={onClose} className="">
                  <X />
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                {/* Left column: Order details and member section */}
                <div className="flex flex-col gap-4 lg:col-span-2">
                  <div className="mt-4 border border-1 rounded p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4 ">
                      <h2 className="font-semibold">Order Details</h2>
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
                          {items?.map((it, idx) => {
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
                                <td className="p-2 sm:p-4 border flex">
                                  {it.productName}
                                </td>
                                <td className="p-2 sm:p-4 border text-right">
                                  {it.quantity}
                                </td>
                                <td className="p-2 sm:p-4 border text-right">
                                  {it.subtotal.toFixed(2)}
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
                  <div className="flex flex-col border border-1 rounded p-4 sm:p-6 gap-4 sm:gap-6 font-bold ">
                    <div className="flex justify-between">
                      <h3 className="text-[17px]">Sub Total</h3>
                      <h3 className="text-[17px]">
                        {CurrencySign} {previewData.totalAmount.toFixed(2)}
                      </h3>
                    </div>
                    <div className="flex justify-between">
                      <h3 className="text-[17px]">Total</h3>
                      <h3 className="text-[17px]">
                        {CurrencySign} {previewData.totalAmount.toFixed(2)}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-col border border-1 rounded p-4 gap-4 sm:gap-6 font-bold ">
                    <div className="flex justify-between">
                      <h2>Checkout As:</h2>
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
                            className={`${styles.paymentLabel} block mb-1`}
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
                          allCustomers?.data?.data?.length > 0 &&
                          customerSearchTerm.trim().length > 0 ? (
                          <>
                            {allCustomers?.data?.data.map((customer: any) => (
                              <p
                                className={`mt-4 py-2 cursor-pointer ${customer.id == selectedMember?.id ? "bg-gray-100 hover:bg-gray-200 font-normal rounded-sm" : "border-[0.9px] border-gray-300 text-black font-normal rounded-sm"}`}
                                key={customer.id}
                                onClick={() => setSelectedMember(customer)}
                              >
                                {`${customer.firstName || ""} ${customer.lastName || ""} ${customer.firstName || customer.lastName ? `(${customer.mobileNo || ""})` : ""}`.trim() ||
                                  `Member ${customer.id}`}
                              </p>
                            ))}
                          </>
                        ) : (
                          <>
                            {customerSearchTerm.trim().length > 0 && (
                              <div>
                                <p className="text-red-500">
                                  Failed to load members
                                </p>
                                <button
                                  onClick={customerRefetch}
                                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                  Retry
                                </button>
                              </div>
                            )}
                          </>
                        )}
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
                    <h2 className="font-semibold mb-4">Payment Method</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentType("cash")}
                        className={`border rounded-md p-3 text-[14px] font-medium transition ${
                          paymentType === "cash"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                        aria-pressed={paymentType === "cash"}
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
                        aria-pressed={paymentType === "qr"}
                      >
                        QR / E-Payment
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
                                  previewData.totalAmount >=
                                0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {CurrencySign}
                              {Math.max(
                                0,
                                (parseFloat(tenderAmount) || 0) -
                                  previewData.totalAmount,
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
                                onClick={() =>
                                  setSelectedQrCategory(
                                    type as "bank" | "wallet",
                                  )
                                }
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

                    <div className="mt-6 gap-3 flex justify-center">
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={handleOpenPreview}
                          disabled={
                            checkoutType === "member" && !selectedMember
                          }
                          className={`px-12 py-4 rounded-md border text-sm font-medium ${
                            checkoutType === "member" && !selectedMember
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-50"
                          }`}
                          title="Preview bill"
                        >
                          Preview Bill
                        </button>
                        <button
                          onClick={handlePayment}
                          disabled={
                            checkoutType === "member" && !selectedMember
                          }
                          className={`px-12 py-4 rounded-md text-sm font-medium text-white ${
                            paymentType === "cash"
                              ? "bg-primaryColor hover:bg-primaryColor/90"
                              : "bg-blue-600 hover:bg-blue-700"
                          } ${checkoutType === "member" && !selectedMember ? "opacity-50 cursor-not-allowed" : ""}`}
                          title={
                            paymentType === "cash"
                              ? "Submit cash payment"
                              : "Complete QR payment"
                          }
                        >
                          {paymentType === "cash"
                            ? "Submit"
                            : "Complete Payment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Preview Modal */}
      <CheckoutPreview
        isOpen={showPreview}
        onClose={handleClosePreview}
        data={previewData}
        onCompletePayment={async () => {
          await handlePayment();
          handleClosePreview();
        }}
        onPrintBill={handlePrint}
      />
    </>
  );
};

export default CheckoutModal;
