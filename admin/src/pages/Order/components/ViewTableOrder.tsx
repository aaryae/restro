import React, { useState } from "react";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { RiSeoLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import CheckoutModal from "./CheckoutModal";
import Button from "@/components/Button";
import { LuChefHat } from "react-icons/lu";
import Checkbox from "@/components/Checkbox";
interface ViewTableOrderProps {
  id: number | null;
  tableNo: number | null;
  orderId: number | null;
  handleCheckout: (tableId: number, orderId: number | null | [number]) => void;
}

const ViewTableOrder: React.FC<ViewTableOrderProps> = ({
  id,
  tableNo,
  orderId,
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

  const handleCheckboxChange = (orderId: number, checked: boolean) => {
    console.log(orderId, checked);
  };

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
            <LuChefHat />
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
                    className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                  >
                    <StatusTag status={order.status} orderId={order.id} />

                    <div className="space-y-2">
                      {order.orderItems.map((item) => (
                        <>
                          <div
                            key={item.id}
                            className=" border-b border-gray-200 py-2 gap-6 flex items-center"
                          >
                            <Checkbox
                              key={item.id}
                              checked={item.selected}
                              onChange={(e) =>
                                handleCheckboxChange(item.id, e.target.checked)
                              }
                            />
                            <div className="flex justify-between items-center w-full">
                              <div className="leading-[1.5] text-gray-600 ">
                                <p className="font-medium text-[14px]">
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
                              <div className="leading-[1.5] text-gray-600 text-right">
                                <p className="text-[14px]">
                                  Rs. {Number(item.product.price).toFixed(2)}{" "}
                                  each
                                </p>
                                <p className="text-[13px]">
                                  Subtotal: Rs.
                                  {Number(item.subtotal).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4">
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
                            {order.status !== "prepared" && (
                              <Link
                                to={`/admin/${ORDER_URL}${id}/${order.id}`}
                                className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <span className="font-[500] text-[15px]">
                                  Update
                                </span>
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-gray-800">
                        Total: Rs.{Number(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <Button
                className="px-4 py-2 bg-primaryColor text-white hover:bg-primaryColor/80 text-[15px]"
                handleClick={() => handleCheckout(id!, allOrderIds)}
              >
                Checkout ALL
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewTableOrder;

export function StatusTag({
  status,
  orderId,
}: {
  status: "pending" | "completed" | "cancelled";
  orderId: number;
}) {
  console.log("status", status);
  return (
    <div className="flex justify-between py-2">
      <p className="text-[14px] font-semibold">Order No: {orderId}</p>
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
