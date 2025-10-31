import React, { useState } from "react";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { RiSeoLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import CheckoutModal from "./CheckoutModal";
import Button from "@/components/Button";
import { LuChefHat } from "react-icons/lu";
import Checkbox from "@/components/Checkbox";
import CustomDialog from "@/components/Dialog";
import ChooseTable from "./TransferModel/ChooseTable";

interface Addon {
  id: number;
  name: string;
  price: number | string;
}

interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number | string;
  };
  quantity: number;
  subtotal: number | string;
  specialInstructions?: string;
  addons?: Addon[];
}

interface Order {
  id: number;
  status: "pending" | "completed" | "cancelled";
  orderItems: OrderItem[];
  totalAmount: number | string;
}
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
  const [dialogOpen, setDialogOpen] = useState(false);

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
          <div className="flex gap-2">
            <Link
              to={`/admin/${ORDER_URL}${id}`}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-5 sm:py-2 rounded-[0.25rem] bg-primaryColor text-white text-sm sm:text-[15px]"
            >
              <LuChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">Add Order</span>
            </Link>
            <Button
              className="w-fit bg-[#c343dc] text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base"
              handleClick={() => setDialogOpen(true)}
            >
              Transfer Table
            </Button>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-8">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <div className="flex flex-col gap-2 md:h-[74vh] h-[68vh] overflow-y-auto pr-2 ">
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
                            <div className="flex justify-between w-full">
                              <div className="leading-[1.5] text-gray-600 ">
                                <p className="font-medium text-[14px] text-left">
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
                                {item.addons && item.addons.length > 0 ? (
                                  <div className="mt-1">
                                    <p className="text-xs font-medium text-left">
                                      Addons ({item.addons.length}):
                                    </p>
                                    <ul className="text-xs pl-4 list-disc">
                                      {item.addons.map(
                                        (addonItem: any, index: number) => (
                                          <li key={index} className="text-left">
                                            {addonItem?.addon?.name ||
                                              "No name"}
                                            {addonItem?.addon?.price !==
                                              undefined &&
                                              `(+Rs.${Number(addonItem.addon.price).toFixed(2)})`}
                                            {addonItem?.quantity > 1 &&
                                              ` (x${addonItem.quantity})`}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 mt-1 text-left">
                                    No addons
                                  </div>
                                )}
                              </div>
                              <div className="leading-[1.5] text-gray-600 text-right flex flex-col justify-between">
                                <p className="text-[14px]">
                                  Rs. {Number(item.product.price).toFixed(2)}{" "}
                                  each
                                </p>
                                {/* {item.addons && item.addons.length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    + Rs.
                                    {item.addons
                                      .reduce(
                                        (sum, addon) =>
                                          sum + Number(addon.price),
                                        0,
                                      )
                                      .toFixed(2)}{" "}
                                    addons
                                  </p>
                                )} */}
                                <p className="text-[13px] font-medium">
                                  Subtotal: Rs.
                                  {Number(item.itemTotal).toFixed(2)}
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
                              className="flex items-center gap-[6px] px-[10px] py-[4px] md:px-[20px] md:py-[8px] rounded-[0.25rem] bg-green-600 text-white hover:bg-green-700 "
                            >
                              <span className="font-[500] text-[13px] md:text-[15px]">
                                Checkout
                              </span>
                            </button>
                            {order.status !== "prepared" && (
                              <Link
                                to={`/admin/${ORDER_URL}${id}/${order.id}`}
                                className="flex items-center gap-[6px] px-[10px] py-[4px] md:px-[20px] md:py-[8px] rounded-[0.25rem] bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <span className="font-[500] text-[13px] md:text-[15px]">
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
      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Choose Table"
        contentClassName="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-auto p-2 sm:p-4"
      >
        <ChooseTable tableId={id} />
      </CustomDialog>
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
