import React, { forwardRef } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { format } from "date-fns";
import { Printer } from "lucide-react";

interface OrderItem {
  id: string | number;
  productName: string;
  quantity: number;
  productPrice: number;
  subtotal: number;
  addons?: Array<{
    id: string | number;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface OrderSummaryData {
  orderNumber?: string;
  tableNo?: string | number | null;
  orderType?: string;
  deliveryAddress?: string;
  orderNote?: string;
  items: OrderItem[];
  totalAmount: number;
  discount?: number;
}

export type BillItem = {
  id: number | string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
};

export type CustomerInfo = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
};

interface BillProps {
  orderId: number | null;
  isOpen: boolean;
  onClose: () => void;
  data: OrderSummaryData;
  onCompletePayment: () => void;
  onPrintBill?: () => void;
  invoiceNumber?: string | number;
  invoiceDate?: Date | string;
  customerInfo?: CustomerInfo;
  className?: string;
}

const Bill = forwardRef<HTMLDivElement, BillProps>(
  (
    {
      orderId,
      isOpen,
      onClose,
      onCompletePayment,
      onPrintBill,
      customerInfo,
      className,
      data: orderData,
    },
    ref,
  ) => {
    if (!isOpen) return null;
    // Fetch company settings
    const { data: settingResp } = useGetApiQuery({ url: "company-setting/" });

    const companyname = (settingResp as any)?.data?.brand_name ?? "";
    const footerDesc = (settingResp as any)?.data?.footer_desc ?? "";
    const companyAddress = (settingResp as any)?.data?.address ?? "";
    const panNumber = (settingResp as any)?.data?.pan_vat_number ?? "";

    return (
      <div
        className={`max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto mx-auto bg-white p-6 fixed z-[50] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-gray-200 shadow-lg rounded-lg ${className ?? ""}`}
      >
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-4 no-print">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>

          <button
            onClick={() => onPrintBill && onPrintBill()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
          >
            <Printer size={16} />
            Print Bill
          </button>
        </div>

        {/* Header */}
        <div ref={ref} id="bill-print">
          <div className="flex flex-col gap-1">
            <h2 className="text-[18px] font-bold text-center">{companyname}</h2>
            {companyAddress && (
              <h3 className="text-[12px] font-normal text-center">
                {companyAddress}
              </h3>
            )}
            {/* <p className="mb-2">PAN no: {panNumber || "123456"} </p> */}
          </div>

          <div className="flex justify-between text-sm my-2">
            <p>Order No: {orderId ?? "N/A"}</p>
            <p>Date: {format(new Date(), "Pp")}</p>
          </div>
          <div className="flex flex-col gap-1 justify-center items-center">
            <h1 className="text-[20px] font-bold">Proforma Invoice</h1>
          </div>

          {/* Customer Name Only */}
          {customerInfo?.name && (
            <div className="my-3">
              <div className="flex items-center">
                <span className="font-medium w-16">Name:</span>
                <div className="flex-1 border-b-2 border-dotted border-gray-400 min-h-[22px]">
                  <h3 className="text-left text-sm font-medium">
                    {customerInfo.name}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <p className="text-[12px] text-left font-semibold">Order Items</p>
          <div className="border border-black overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="w-12 py-2 px-2 font-medium text-black border-b border-r border-black text-center">
                    S.N.
                  </th>
                  <th className="text-left py-2 px-4 font-medium text-black border-b border-r border-black">
                    Particulars
                  </th>
                  <th className="w-16 py-2 px-2 font-medium text-black border-b border-r border-black text-center">
                    Qty
                  </th>
                  <th className="text-right py-2 px-4 font-medium text-black border-b border-r border-black">
                    Rate
                  </th>
                  <th className="text-right py-2 px-4 font-medium text-black border-b border-black">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderData?.items?.map((item: any, index: number) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-2 px-2 border-b border-r border-black text-center">
                      {index + 1}
                    </td>
                    <td className="py-2 px-4 border-b border-r border-black text-left">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        {item.productDescription && (
                          <p className="text-xs text-gray-500">
                            {item.productDescription}
                          </p>
                        )}
                        {item.addons?.map((addon: any) => (
                          <div
                            key={addon.id}
                            className="text-xs text-gray-600 pl-2 mt-1 flex justify-between"
                          >
                            <span>
                              + {addon.name} (x{addon.quantity})
                            </span>
                            <div>
                              <span className="ml-2">Rs. {addon.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-2 border-b border-r border-black text-center">
                      {item.quantity}
                    </td>
                    <td className="text-right py-2 px-4 border-b border-r border-black">
                      {Number(item.productPrice).toFixed(2)}
                    </td>
                    <td className="text-right py-2 px-4 border-b border-black">
                      {(
                        Number(item.productPrice) * Number(item.quantity)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{Number(orderData?.totalAmount ?? 0).toFixed(2)}</span>
            </div>

            {Number(orderData?.discount ?? 0) > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount:</span>
                <span>-{Number(orderData?.discount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t-2 border-black pt-2 mt-2">
              <span>Total:</span>
              <span>Rs. {Number(orderData?.totalAmount ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <p className="text-center text-xs mt-4 text-gray-500">
            {footerDesc || ""}
          </p>
        </div>
      </div>
    );
  },
);

export default Bill;
