import React from "react";
import styles from "./CheckoutModal.module.css";
import { CurrencySign } from "@/constants";

interface OrderItem {
  id: string | number;
  productName: string;
  quantity: number;
  productPrice: number;
  subtotal: number;
}

interface OrderSummaryData {
  orderNumber?: string;
  tableNo?: string | number | null;
  orderType?: string;
  deliveryAddress?: string;
  orderNote?: string;
  items: OrderItem[];
  totalAmount: number;
}

interface CheckoutPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: OrderSummaryData;
  onCompletePayment: () => void;
  onPrintBill: (targetId?: string) => void;
}

const CheckoutPreview: React.FC<CheckoutPreviewProps> = ({
  isOpen,
  onClose,
  data,
  onCompletePayment,
  onPrintBill,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Checkout Summary</h2>

        <div id="bill-print-area" className="max-h-[70vh] overflow-y-auto">
          <div className="text-sm text-gray-700 space-y-1 mb-4">
            {data.orderNumber && (
              <p>
                <span className="font-medium">Order #:</span> {data.orderNumber}
              </p>
            )}
            {data.tableNo && (
              <p>
                <span className="font-medium">Table:</span> {data.tableNo}
              </p>
            )}
            {data.orderType && (
              <p>
                <span className="font-medium">Type:</span> {data.orderType}
              </p>
            )}
            {data.deliveryAddress && (
              <p>
                <span className="font-medium">Delivery Address:</span>{" "}
                {data.deliveryAddress}
              </p>
            )}
            {data.orderNote && (
              <p>
                <span className="font-medium">Note:</span> {data.orderNote}
              </p>
            )}
          </div>

          <div className="border rounded-md">
            <div className="grid grid-cols-12 px-4 py-2 bg-gray-100 text-sm font-medium text-gray-700">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Subtotal</div>
            </div>
            <div className="divide-y">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 px-4 py-2 text-sm"
                >
                  <div className="col-span-6 truncate">{item.productName}</div>
                  <div className="col-span-2 text-right">{item.quantity}</div>
                  <div className="col-span-2 text-right">
                    {CurrencySign} {Number(item.productPrice).toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right">
                    {CurrencySign} {Number(item.subtotal).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <span className="text-base font-semibold">Total</span>
              <span className="text-base font-bold text-green-600">
                {CurrencySign} {Number(data.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.buttonContainer} mt-4`}>
          <button onClick={onClose} className={styles.cancelButton}>
            Back
          </button>
          <button
            onClick={() => onPrintBill("bill-print-area")}
            className={`${styles.actionButton} bg-gray-700 hover:bg-gray-800`}
          >
            Print Bill
          </button>
          <button onClick={onCompletePayment} className={styles.actionButton}>
            Complete Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPreview;
