import React, { useMemo, useState } from "react";
import { FaMoneyBillWave, FaPlus, FaQrcode } from "react-icons/fa";
import styles from "./CheckoutModal.module.css";
import QR_IMAGE from "@/assets/qr-code.png";
import { useCreateApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { handleResponse } from "@/utils/responseHandler";
import CustomDialog from "@/components/Dialog";
import AddEditCustomer from "../../Customer/AddEditCustomer";
import { Mail, CircleUserRound } from "lucide-react";
import { CurrencySign } from "@/constants";
import Input from "@/components/Input";
import { buildQueryString } from "@/utils/generalHelper";
import { useCheckoutOrderMutation } from "@/redux/services/orders";
import CheckoutPreview from "./CheckoutPreview";
import { X } from "lucide-react";

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
            <div className={styles.successContainer}>
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
          ) : (
            <>
              <div className="flex justify-between items-center ">
                <h2 className={styles.modalTitle}>
                  Checkout - Table{" "}
                  {order?.data?.table?.tableNo || table?.data?.tableNo}
                </h2>
                <button onClick={onClose}>
                  <X />
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left column: Order details and member section */}
                <div className="flex flex-col gap-4 lg:col-span-3">
                  <div className="mt-4 border border-1 rounded p-6">
                    <div className="flex items-center justify-between mb-4 ">
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
                            <th className="p-4 border text-left w-12">S.N</th>
                            <th className="p-4 border text-left">Item</th>
                            <th className="p-4 border text-right w-24">
                              Quantity
                            </th>
                            <th className="p-4 border text-right w-28">
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
                                <td className="p-4 border text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedIds.includes(sid)}
                                    onChange={() => toggleRow(it.id)}
                                    aria-label={`Select item ${it.productName}`}
                                  />
                                </td>
                                <td className="p-4 border">{idx + 1}</td>
                                <td className="p-4 border flex">
                                  {it.productName}
                                </td>
                                <td className="p-4 border text-right">
                                  {it.quantity}
                                </td>
                                <td className="p-4 border text-right">
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
                  <div className="flex flex-col border border-1 rounded p-4 gap-6 font-bold ">
                    <div className="flex justify-between">
                      <h3 className="text-[16px]">Sub Total</h3>
                      <h3 className="text-[16px]">
                        {CurrencySign} {previewData.totalAmount.toFixed(2)}
                      </h3>
                    </div>
                    <div className="flex justify-between">
                      <h3 className="text-[16px]">Total</h3>
                      <h3 className="text-[16px]">
                        {CurrencySign} {previewData.totalAmount.toFixed(2)}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-col border border-1 rounded p-4 gap-6 font-bold ">
                    <div className="flex justify-between">
                      <h2>Checkout As:</h2>
                    </div>
                    <div className="flex gap-4">
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
                      <div className="flex gap-8">
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
                        <div className="mb-4 flex items-center gap-4">
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
                            className="w-[75%] "
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
                                className={`my-4 py-2 cursor-pointer ${customer.id == selectedMember?.id ? "bg-blue-600 text-white" : "bg-gray-300 hover:bg-gray-200 rounded-[4px]"}`}
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
                      <div className="my-4 p-4 bg-gray-100 rounded-md">
                        <p className={styles.paymentLabel}>Selected Member:</p>
                        <p className="flex items-center justify-center gap-2">
                          <CircleUserRound />
                          <span className="font-medium">Name: </span>
                          {selectedMember.firstName +
                            " " +
                            selectedMember.lastName || "N/A"}
                        </p>
                        <p className="flex items-center justify-center gap-2">
                          <Mail />
                          <span className="font-medium">Email: </span>{" "}
                          {selectedMember.email || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Payment Method panel */}
                <div className="mt-4 lg:mt-4 lg:col-span-2">
                  <div className="border border-1 rounded p-8 sticky top-4">
                    <h2 className="font-semibold mb-8 flex">Payment Method</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentType("cash")}
                        className={`border rounded-md p-4 text-sm font-medium transition ${
                          paymentType === "cash"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                        aria-pressed={paymentType === "cash" ? "true" : "false"}
                      >
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType("qr")}
                        className={`border rounded-md p-4 text-sm font-medium transition ${
                          paymentType === "qr"
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                        aria-pressed={paymentType === "qr" ? "true" : "false"}
                      >
                        QR / E-Payment
                      </button>
                    </div>

                    {paymentType === "qr" && (
                      <div className="mt-4 flex flex-col items-center">
                        <img
                          src={QR_IMAGE}
                          alt="QR Code for Payment"
                          className="w-full max-w-[280px] rounded-md border"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Scan to pay. Confirm payment on your device.
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleOpenPreview}
                        disabled={checkoutType === "member" && !selectedMember}
                        className={`px-4 py-2 rounded-md border text-sm font-medium ${
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
                        disabled={checkoutType === "member" && !selectedMember}
                        className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
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
                        {paymentType === "cash" ? "Submit" : "Complete Payment"}
                      </button>
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
