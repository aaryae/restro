import React, { useState } from "react";
import { FaMoneyBillWave, FaPlus, FaQrcode } from "react-icons/fa";
import styles from "./CheckoutModal.module.css";
import QR_IMAGE from "@/assets/qr-code.png";
import { useCreateApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { handleResponse } from "@/utils/responseHandler";
import CustomDialog from "@/components/Dialog";
import AddEditCustomer from "../Customer/AddEditCustomer";
import { Mail, CircleUserRound } from "lucide-react";
import { CurrencySign } from "@/constants";
import Input from "@/components/Input";
import { buildQueryString } from "@/utils/generalHelper";

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

  const [checkoutOrderApi] = useCreateApiMutation();
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

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
        url: `${ORDER_URL}checkout/${tableId}`,
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

  if (!isOpen) return null;

  return (
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
            <h2 className={styles.modalTitle}>
              Checkout for Table{" "}
              {order?.data?.table?.tableNo || table?.data?.tableNo}
            </h2>
            <p className={styles.totalAmount}>
              Total Amount:{" "}
              <span className="text-green-600 font-bold">
                {CurrencySign}
                {order?.data?.totalAmount || "N/A"}
              </span>
            </p>
            <div className={styles.paymentOptions}>
              <p className={styles.paymentLabel}>Select Payment Type:</p>
              <div className={styles.paymentGrid}>
                <div
                  className={`${styles.paymentBox} ${paymentType === "cash" ? styles.paymentBoxSelectedCash : ""}`}
                  onClick={() => setPaymentType("cash")}
                >
                  <FaMoneyBillWave className={styles.paymentIconCash} />
                  <span className={styles.paymentText}>Cash</span>
                </div>
                <div
                  className={`${styles.paymentBox} ${paymentType === "qr" ? styles.paymentBoxSelectedQr : ""}`}
                  onClick={() => setPaymentType("qr")}
                >
                  <FaQrcode className={styles.paymentIconQr} />
                  <span className={styles.paymentText}>QR (E-Payment)</span>
                </div>
              </div>
            </div>
            {paymentType === "qr" && (
              <div className={styles.qrContainer}>
                <img
                  src={QR_IMAGE}
                  alt="QR Code for Payment"
                  className={styles.qrImage}
                />
              </div>
            )}
            <div className="mt-4">
              <p className={styles.paymentLabel}>Checkout As:</p>
              <div className="flex gap-4 mb-4">
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
              {checkoutType === "member" && (
                <div className="mb-4">
                  <label className={`${styles.paymentLabel} block mb-1`}>
                    Search Member
                  </label>
                  <Input
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                    }}
                  />
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
                          <p className="text-red-500">Failed to load members</p>
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
                    {selectedMember.firstName + " " + selectedMember.lastName ||
                      "N/A"}
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <Mail />
                    <span className="font-medium">Email: </span>{" "}
                    {selectedMember.email || "N/A"}
                  </p>
                </div>
              )}
            </div>
            <div className={styles.buttonContainer}>
              <button
                onClick={() => {
                  setCustomerSearchTerm("");
                  setSelectedMember(null);
                  onClose();
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={checkoutType === "member" && !selectedMember}
                className={`${styles.actionButton} ${
                  checkoutType === "member" && !selectedMember
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {paymentType === "cash" ? "Submit" : "Complete Payment"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
