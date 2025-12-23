import React, { useState, useMemo } from "react";
import PageTitle from "@/components/PageTitle";
import { CurrencySign } from "@/constants";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import Button from "@/components/Button";
import { useGetApiQuery } from "@/redux/services/crudApi";
import CheckoutModal from "./CheckoutModal";

type ViewTakeawayOrdersProps = {
  id: number | null;
  orderId: number | null;
};

const ViewTakeawayOrders: React.FC<ViewTakeawayOrdersProps> = ({
  id,
  orderId,
}) => {
  const {
    data: orderData,
    isLoading: loading,
    isSuccess: success,
  } = useGetApiQuery(
    { url: `${ORDER_URL}${id}` },
    { skip: id === null || id === undefined },
  );

  const items = (success ? orderData?.data?.orderItems : []) || [];
  const orderNo = orderData?.data?.id || id;
  const [openCheckout, setOpenCheckout] = useState(false);

  const itemsTotal = useMemo(
    () =>
      items.reduce((sum: number, item: any) => {
        const unitPrice = Array.isArray(item.price)
          ? item.price.reduce(
              (s: number, priceObj: any) => s + Number(priceObj.price || 0),
              0,
            )
          : Number(item.price ?? item?.product?.price ?? 0);
        return sum + unitPrice * Number(item.quantity || 0);
      }, 0),
    [items],
  );

  return (
    <>
      <div className="mt-[2rem]">
        <div className="flex justify-between items-center">
          <PageTitle title={`Takeaway Order ${orderNo ? `#${orderNo}` : ""}`} />
        </div>

        {loading && <div className="text-gray-600 mt-4">Loading order...</div>}

        {success && (
          <div className="flex flex-col gap-2 md:h-[74vh] h-[68vh] overflow-y-auto pr-2 mt-4">
            {items.length === 0 ? (
              <div className="text-gray-600 text-center">
                No items in this order
              </div>
            ) : (
              items.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
                >
                  <div className="flex justify-between py-2">
                    <p className="text-[14px] font-semibold">Item #{item.id}</p>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        item.status === "prepared"
                          ? "bg-green-100 text-green-800"
                          : item.status === "preparing"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.status?.charAt(0)?.toUpperCase() +
                        item.status?.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="  py-2 gap-6 flex items-center">
                      <div className="flex justify-between items-center w-full">
                        <div className="leading-[1.5] text-gray-600 ">
                          <p className="font-medium text-[14px] text-left">
                            Item: {item?.product?.name}
                          </p>
                          <p className="flex text-[13px]">
                            Qty: {item.quantity}
                          </p>
                          {item.specialInstructions && (
                            <p className="text-xs italic text-left">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                          {item.addons?.length > 0 ? (
                            <div className="mt-1 text-left">
                              <p className="text-xs font-medium">
                                Addons ({item.addons.length}):
                              </p>

                              <ul className="text-xs pl-4 list-disc">
                                {/* {item.addons.map((addon: any, idx: number) => {
                                  const addonName =
                                    addon?.addon?.name ||
                                    addon?.name ||
                                    "Unknown Addon";
                                  const addonPrice =
                                    addon?.price || addon?.addon?.price || 0;
                                  const addonQuantity =
                                    addon?.addon?.quantity || 1;
                                  return (
                                    <li key={idx}>
                                      {addonName}
                                      {` (+${CurrencySign}${Number(addonPrice).toFixed(2)})(x${Number(addonQuantity)})`}
                                    </li>
                                  );
                                })} */}
                                {item.addons.map(
                                  (addonItem: any, index: number) => (
                                    <li key={index} className="text-left">
                                      {addonItem?.addon?.name || "No name"}
                                      {addonItem?.addon?.price !== undefined &&
                                        ` (+${CurrencySign}${Number(addonItem.addon.price).toFixed(2)})(×${addonItem.quantity})`}
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
                        <div className="leading-[1.5] text-gray-600 text-right">
                          <p className="text-[14px]">
                            {CurrencySign}
                            {(() => {
                              const unitPrice = Array.isArray(item.price)
                                ? item.price.reduce(
                                    (sum: number, priceObj: any) =>
                                      sum + Number(priceObj.price || 0),
                                    0,
                                  )
                                : Number(
                                    item.price ?? item?.product?.price ?? 0,
                                  );
                              return (
                                unitPrice * Number(item.quantity || 0)
                              ).toFixed(2);
                            })()}
                          </p>
                          {item.addons && item.addons.length > 0 && (
                            <p className="text-xs text-gray-500">
                              {item.addons && item.addons.length > 0 && (
                                <div className="text-xs text-gray-600">
                                  + {CurrencySign}
                                  {item.addons
                                    .reduce(
                                      (sum: number, addonItem: any) =>
                                        sum +
                                        Number(addonItem?.addon?.price || 0) *
                                          addonItem.quantity,
                                      0,
                                    )
                                    .toFixed(2)}{" "}
                                  addons
                                </div>
                              )}
                            </p>
                          )}
                          <p className="text-[13px] font-medium">
                            Subtotal: {CurrencySign}
                            {Number(orderData?.data?.totalAmount ?? 0).toFixed(
                              2,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div className="flex justify-end">
          <div className="flex flex-col items-center gap-2">
            <div className="text-right">
              <div className="text-lg text-gray-500 font-semibold">
                Grand Total
              </div>
              <div className="text-xl font-bold text-green-600">
                {CurrencySign}
                {Number(orderData?.data?.totalAmount ?? 0).toFixed(2)}
              </div>
            </div>
            <Button
              className="px-4 py-2 bg-primaryColor text-white hover:bg-primaryColor/80 text-[15px]"
              handleClick={() => setOpenCheckout(true)}
              disabled={items.length === 0}
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>
      {openCheckout && (
        <CheckoutModal
          isOpen={openCheckout}
          onClose={() => setOpenCheckout(false)}
          tableId={Number(orderData?.data?.table?.id || 0)}
          orderId={Number(orderId || orderData?.data?.id || id || 0)}
        />
      )}
    </>
  );
};

export default ViewTakeawayOrders;
