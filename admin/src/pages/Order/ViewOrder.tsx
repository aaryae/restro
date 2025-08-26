import Button from "@/components/Button";
import PageTitle from "@/components/PageTitle";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery, usePatchApiMutation } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { SetStateAction } from "react";

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

  async function handleStatusUpdate(status: string, id: number) {
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
        <button
          onClick={() => {}}
          className="flex items-center gap-[6px] px-[20px] py-[8px] rounded-[0.25rem] bg-green-600 text-white hover:bg-green-700"
        >
          <span className="font-[500] text-[15px]">Print Order</span>
        </button>
      </div>
      {success && (
        <div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400"></div>
                <span className="text-sm text-gray-600">Preparing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400"></div>
                <span className="text-sm text-gray-600">Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-400"></div>
                <span className="text-sm text-gray-600">Served</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-400"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
            </div>
          </div>
          {orderData?.data?.orderItems.map((item) => (
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
                  <p>
                    <span className="font-medium">Quantity:</span>{" "}
                    {item.quantity}
                  </p>
                  <p>
                    <span className="font-medium">Price:</span> $
                    {parseFloat(item.price).toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Subtotal:</span> $
                    {parseFloat(item.subtotal).toFixed(2)}
                  </p>
                  {item.discount > 0 && (
                    <p className="text-green-600">
                      <span className="font-medium">Discount:</span> $
                      {parseFloat(item.discount).toFixed(2)}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <select
                      className="w-40 p-2 text-base bg-white focus:outline-none focus:border-blue-500 transition-colors"
                      value={item?.status}
                      onChange={(e) =>
                        handleStatusUpdate(e.target.value, item.id)
                      }
                    >
                      {statusOptions.map((option) => (
                        <option
                          className="text-center"
                          value={option}
                          key={option}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </p>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
