import PageTitle from "@/components/PageTitle";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { SetStateAction } from "react";
import DishPlaceHolder from "@/assets/product_placeholder.jpg";

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

function getProductImageSrc(item: OrderItem) {
  const imageUrl = item?.product?.mediaArr?.[0]?.imageUrl;
  if (!imageUrl) return DishPlaceHolder;
  return `${IMAGE_BASE_URL}${imageUrl}`;
}

export default function ViewOrder({ id }: ViewCustomerProps) {
  const { data: orderData, isSuccess: success } = useGetApiQuery(
    { url: `order/${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  return (
    <div className="mt-[2rem] ">
      <div className="flex items-center justify-between">
        <PageTitle title="Order Details" />
      </div>
      {success && (
        <div>
          {orderData?.data?.orderItems.map((item: OrderItem) => (
            <div
              key={item.id}
              className={`mb-4 flex gap-4 border-l-4 bg-white p-4 shadow-sm ${
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
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                <img
                  src={getProductImageSrc(item)}
                  alt={item.product?.name || "Product"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.dataset.fallbackApplied === "true") return;
                    target.dataset.fallbackApplied = "true";
                    target.src = DishPlaceHolder;
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {item.product?.name || "Unknown Product"}
                </h3>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
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
                      {parseFloat(String(item.discount)).toFixed(2)}
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
                  <div className="mt-3 border-l-2 border-gray-200 pl-4">
                    <p className="mb-1 text-left text-sm font-medium text-gray-600">
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
