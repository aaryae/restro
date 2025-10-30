import Button from "@/components/Button";
import PageTitle from "@/components/PageTitle";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery, usePatchApiMutation } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { SetStateAction } from "react";

interface Addon {
  id: number;
  name: string;
  price: string;
}

type OrderItem = {
  id: string | number;
  product: {
    name: string;
    mediaArr?: Array<{ imageUrl: string }>;
  };
  quantity: number;
  price: string;
  subtotal: string;
  discount: number;
  status: string;
  department?: {
    name: string;
  };
  specialInstructions?: string;
  addons?: Addon[];
};

type ViewCustomerProps = {
  id: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<SetStateAction<boolean>>;
};

export default function ViewOrder({
  id,
  isOpen,
  setIsOpen,
}: ViewCustomerProps) {
  const {
    data: orderData,
    isLoading: loading,
    isSuccess: success,
  } = useGetApiQuery(
    { url: `order/${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  const statusOptions = [
    "pending",
    "preparing",
    "ready",
    "served",
    "cancelled",
  ];

  const [patchStatus] = usePatchApiMutation();

  async function handleStatusUpdate(status: string, id: string | number) {
    try {
      const response = await patchStatus({
        url: `${ORDER_URL}items/status`,
        body: { status, orderItemIds: id },
      }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    }
  }

  console.log(orderData, "this is order data");

  return (
    <div className="mt-[2rem] ">
      <div className="flex justify-between items-center">
        <PageTitle title="Order Details" />
        {/* <button
          onClick={() => {}}
          className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-green-600 text-white hover:bg-green-700"
        >
          <span className="font-[500] text-[15px]">Print Order</span>
        </button> */}
      </div>
      {success && (
        <div>
          {orderData?.data?.orderItems.map((item: OrderItem) => (
            <div
              className={`border-l-4 p-4 bg-white shadow-sm mb-4 flex gap-4
  ${
    item?.status === "pending"
      ? "border-yellow-400"
      : item?.status === "preparing"
        ? "border-blue-400"
        : item?.status === "ready"
          ? "border-green-400"
          : item?.status === "served"
            ? "border-purple-400"
            : item?.status === "cancelled"
              ? "border-red-400"
              : "border-gray-400"
  }`}
            >
              {/* Image Section */}
              <div className="w-24 h-24 flex-shrink-0">
                <img
                  src={`${IMAGE_BASE_URL}${item?.product?.mediaArr?.[0]?.imageUrl}`}
                  alt={item.product?.name || "Product"}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              {/* Content Section */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">
                  {item.product?.name || "Unknown Product"}
                </h3>

                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                  <p className="text-left">
                    <span className="font-medium">Quantity:</span>{" "}
                    {item.quantity}
                  </p>
                  <p className="text-left">
                    <span className="font-medium">Price:</span>
                    {CurrencySign}
                    {parseFloat(item.price).toFixed(2)}
                  </p>
                  <p className="text-left">
                    <span className="font-medium">Subtotal:</span>
                    {CurrencySign}
                    {parseFloat(item.subtotal).toFixed(2)}
                  </p>
                  {item.discount > 0 && (
                    <p className="text-green-600">
                      <span className="font-medium">Discount:</span> $
                      {parseFloat(item.discount).toFixed(2)}
                    </p>
                  )}
                  {item.department && (
                    <p>
                      <span className="font-medium">Department:</span>{" "}
                      {item.department.name}
                    </p>
                  )}
                </div>

                {item.specialInstructions && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Instructions:</span>{" "}
                    {item.specialInstructions}
                  </p>
                )}

                {item.addons && item.addons.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <p className="font-medium text-sm text-gray-600 mb-1 text-left">
                      Addons:
                    </p>
                    <div className="space-y-2">
                      {item.addons.map((addonItem: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-gray-500">+</span>
                          <span>{addonItem?.addon?.name}</span>
                          <span className="text-gray-500">
                            ({CurrencySign}
                            {parseFloat(addonItem?.price).toFixed(2)} ×{" "}
                            {addonItem?.quantity})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
