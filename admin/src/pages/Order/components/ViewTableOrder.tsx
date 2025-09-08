import React, { useState } from "react";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { RiSeoLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import CheckoutModal from "./CheckoutModal";
import Button from "@/components/Button";

interface ViewTableOrderProps {
  id: number | null;
  tableNo: number | null;
  handleCheckout: (tableId: number, orderId: number | null | [number]) => void;
}

const ViewTableOrder: React.FC<ViewTableOrderProps> = ({
  id,
  tableNo,
  handleCheckout,
}) => {
  const {
    data: tableOrder,
    isSuccess: success,
    isLoading: loading,
  } = useGetApiQuery(
    { url: `${ORDER_URL}active-orders/${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  const { data: table } = useGetApiQuery({ url: `${TABLE_URL}${id}` });

  console.log(table?.data, "this table");

  const orders = tableOrder?.data?.orders;
  const allOrderIds = tableOrder?.data?.orders.map(({ id }) => id);

  return (
    <>
      <div className="p-4 ">
        <div className="flex justify-between items-center mt-[4rem] mb-[1.5rem]">
          <h2 className="text-[20px] font-bold text-primaryColor ">
            {table?.data?.tableNo || id}
          </h2>
          <Link
            to={`/admin/${ORDER_URL}${id}`}
            className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-primaryColor text-white"
          >
            <RiSeoLine />
            <span className="font-[500] text-[15px]">Add Order</span>
          </Link>
        </div>
        <div className="flex flex-col justify-between gap-8">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="flex flex-col gap-2 h-[74vh] overflow-y-auto pr-2 ">
              {orders?.length === 0 ? (
                <div className="text-gray-600 text-center">
                  No orders for this table
                </div>
              ) : (
                orders?.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-md p-4"
                  >
                    <StatusTag status={order.status} />

                    <div className="space-y-2">
                      {order.orderItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-start border-b border-gray-200 py-2"
                        >
                          <div className="text-sm text-gray-600">
                            <p className="font-medium text-[13px]">
                              Item: {item.product.name}
                            </p>
                            <p className="flex text-[13px]">
                              Qty: {item.quantity}
                            </p>
                            {item.specialInstructions && (
                              <p className="text-xs italic">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 text-right">
                            <p className="text-[14px]">
                              Rs. {Number(item.product.price).toFixed(2)} each
                            </p>
                            <p className="text-[13px]">
                              Subtotal: Rs.{Number(item.subtotal).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-lg font-semibold text-gray-800">
                        Total: Rs.{Number(order.totalAmount).toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        {order.status !== "completed" && (
                          <>
                            <button
                              onClick={() => handleCheckout(id!, order.id)}
                              className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-green-600 text-white hover:bg-green-700"
                            >
                              <span className="font-[500] text-[15px]">
                                Checkout
                              </span>
                            </button>
                            <Link
                              to={`/admin/${ORDER_URL}${id}/${order.id}`}
                              className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-blue-600 text-white hover:bg-blue-700"
                            >
                              <span className="font-[500] text-[15px]">
                                Update
                              </span>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              className="px-4 py-2 bg-primaryColor text-white hover:bg-primaryColor/80 text-[15px]"
              handleClick={() => handleCheckout(id!, allOrderIds)}
            >
              Checkout ALL
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewTableOrder;

function StatusTag({
  status,
}: {
  status: "pending" | "completed" | "cancelled";
}) {
  console.log("status", status);
  return (
    <div className="flex justify-end py-2">
      <span
        className={`px-4 py-2 text-xs font-semibold rounded-full 
            ${
              status === "completed"
                ? "bg-green-100 text-green-800"
                : status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
            }`}
      >
        {status?.charAt(0)?.toUpperCase() + status?.slice(1)}
      </span>
    </div>
  );
}
