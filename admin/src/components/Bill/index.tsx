import React, { forwardRef } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";

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
  isOpen: boolean;
  onClose: () => void;
  data: OrderSummaryData;
  onCompletePayment: () => void;
  onPrintBill?: (targetId?: string) => void;
  invoiceNumber?: string | number;
  invoiceDate?: Date | string;
  customerInfo?: CustomerInfo;
  className?: string;
}

const Bill = forwardRef<HTMLDivElement, BillProps>(
  (
    {
      isOpen,
      onClose,
      onCompletePayment,
      onPrintBill,
      invoiceNumber,
      invoiceDate,
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
        ref={ref}
        className={`max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto mx-auto bg-white p-6 fixed z-[50] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-gray-200 shadow-lg rounded-lg ${className ?? ""}`}
      >
        {/* Back/Close Button */}
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-gray-600"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-bold text-center">{companyname}</h2>
          {companyAddress && (
            <h3 className="text-[12px] font-normal text-center mb-2">
              {companyAddress}
            </h3>
          )}
        </div>

        <div className="flex justify-between text-sm my-2">
          <p>Invoice #: {invoiceNumber}</p>
          <p>
            Date:{" "}
            {typeof invoiceDate === "string"
              ? invoiceDate
              : invoiceDate?.toLocaleDateString()}
          </p>
        </div>
        <div className="">
          <div className="flex flex-col gap-1 justify-center">
            <h1 className="text-[20px] font-bold">Invoice</h1>
            <p className="text-[12px]">Cash/Credit</p>
          </div>
          <div className="flex justify-end items-center">
            <p>PAN no: {panNumber || "123456"} </p>
          </div>
        </div>

        {/* Customer */}
        {(customerInfo?.name ||
          customerInfo?.phone ||
          customerInfo?.address) && (
          <div className="my-3">
            <div className="flex items-center gap-4 mb-2">
              <span className="font-medium w-24">Name:</span>
              <div className="flex-1 border-b-2 border-dotted border-gray-400 min-h-[22px]">
                <h3 className="text-left text-sm">
                  {customerInfo?.name || ""}
                </h3>
              </div>
            </div>
            {customerInfo?.phone && (
              <div className="flex items-center gap-4 mb-2 text-sm">
                <span className="font-medium w-24">Phone:</span>
                <span className="flex-1">{customerInfo.phone}</span>
              </div>
            )}
            {customerInfo?.address && (
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium w-24">Address:</span>
                <span className="flex-1">{customerInfo.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="border border-black overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-16 py-2 px-2 font-medium text-black border-b border-r border-black text-center">
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
                  <td className="py-2 px-4 border-b border-r border-black">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.productDescription && (
                        <p className="text-xs text-gray-500">
                          {item.productDescription}
                        </p>
                      )}
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
    );
  },
);

export default Bill;
