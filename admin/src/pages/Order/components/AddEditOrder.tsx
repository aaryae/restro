import Input from "@/components/Input";
import { OrderSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";
import { z } from "zod";
import { ORDER_LIST_ROUTE } from "@/routes/routeNames";
import { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import TextArea from "@/components/TextArea";
import Select from "@/components/Select";
import Model from "@/components/Model";
import { FaPlus, FaTrash, FaSearch } from "react-icons/fa";
import { MdShoppingCart } from "react-icons/md";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import Beep from "@/assets/audio/beep.mp3";
import DeleteBeep from "@/assets/audio/DeleteBeep.mp3";
import {
  useGetApiQuery,
  useCreateApiMutation,
  useUpdateApiMutation,
  usePatchApiMutation,
} from "@/redux/services/crudApi";
import { ORDER_URL, TABLE_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { Minus, Plus, PlusCircle } from "lucide-react";
import { id } from "date-fns/locale";
import {
  useCreateOrderMutation,
  useUpdateOrderMutation,
} from "@/redux/services/orders";

type OrderFormType = z.infer<typeof OrderSchema>;

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  specialInstructions?: string;
  status?: string;
  subtotal: number;
}

interface Props {
  isComponent?: boolean;
  closeModal?: () => void;
}

const orderTypeOptions = [
  { value: "dineIn", label: "Dine In" },
  { value: "takeaway", label: "Takeaway" },
  { value: "delivery", label: "Delivery" },
];

export default function AddEditOrder({
  isComponent = false,
  closeModal = () => {},
}: Props) {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!orderId;

  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormType>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      orderType: "dineIn",
      orderItems: [],
    },
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<OrderFormType | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [audio] = useState(new Audio(Beep));
  const [deleteAudio] = useState(new Audio(DeleteBeep));

  const watchedOrderType = watch("orderType");
  const watchedTableId = watch("tableId");

  const playAudio = () => {
    audio.play();
  };

  const playDeleteAudio = () => {
    deleteAudio.play();
  };

  const { data: currentOrders, isSuccess: currentOrderIsSuccess } =
    useGetApiQuery(
      { url: `${ORDER_URL}${orderId}` },
      {
        skip: !orderId,
      },
    );

  useEffect(() => {
    if (currentOrders?.data?.orderItems?.length > 0) {
      setOrderItems(
        currentOrders?.data?.orderItems.map(
          (item): OrderItem => ({
            id: item.id,
            productId: item.product.id,
            productName: item.product.name,
            productPrice: Number(item.product.price),
            quantity: item.quantity,
            subtotal: Number(item.subtotal),
            status: item.status,
          }),
        ),
      );
      setValue("orderNote", currentOrders?.data?.orderNote);
    }
  }, [currentOrders, currentOrderIsSuccess]);

  useEffect(() => {
    const total = orderItems.reduce(
      (sum, item) =>
        item.status === "cancelled" ? 0 : sum + Number(item.subtotal),
      0,
    );
    setTotalAmount(total);
    setValue("orderItems", orderItems);
  }, [orderItems, setValue]);

  // Fetch tables from backend (generic)
  const { data: tableData } = useGetApiQuery({ url: `${TABLE_URL}list` });

  // Fetch products from backend (generic)
  const { data: productData, isLoading: isProductLoading } = useGetApiQuery({
    url: `/product/list`,
  });

  const [patchStatus] = usePatchApiMutation();

  // Filter products
  const filteredProducts = useMemo(() => {
    const list = productData?.data?.data || [];
    const term = productSearchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter((p: { name: string; description?: string }) => {
      const name = p.name?.toLowerCase?.() || "";
      const desc = (p.description || "").toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [productData, productSearchTerm]);

  const productsToRender = useMemo(() => {
    const list = Array.isArray(filteredProducts) ? filteredProducts : [];
    return productSearchTerm ? list : list.slice(0, 6);
  }, [filteredProducts, productSearchTerm]);

  const tableOptions = useMemo(() => {
    if (!tableData?.data) return [];

    return tableData.data.data
      ?.filter((table: { status?: string }) => table.status !== "maintenance")
      .map((table: { id: string | number; tableNo: string }) => ({
        value: String(table.id),
        label: `${table.tableNo}`,
      }));
  }, [tableData]);

  const addProductToOrder = (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    const existingItem = orderItems.find(
      (item) => item.productId === product.id && item.status !== "cancelled",
    );
    if (existingItem) {
      updateOrderItemQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: OrderItem = {
        id: `newitem_${Date.now()}_${Math.random()}`,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
        subtotal: product.price,
        specialInstructions: "",
      };
      setOrderItems((prev) => [...prev, newItem]);
    }
  };

  const updateOrderItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeOrderItem(itemId);
      return;
    }

    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: item.productPrice * newQuantity,
            }
          : item,
      ),
    );
  };

  const removeOrderItem = async (itemId: string) => {
    if (!String(itemId).includes("newitem_")) {
      try {
        const response = await patchStatus({
          url: `${ORDER_URL}items/status`,
          body: { status: "cancelled", orderItemIds: Number(itemId) },
        }).unwrap();
        handleResponse({
          res: response,
          onSuccess: () => {},
        });
      } catch (error) {
        handleError({ error });
      }
    }
    setOrderItems((prev) =>
      prev.filter(
        (item) => item.id !== itemId && String(item.id).includes("newitem_"),
      ),
    );
  };

  const handleSuccess = () => {
    if (isComponent) {
      closeModal();
    } else {
      navigate(ORDER_LIST_ROUTE);
    }
  };

  // Create order mutation (generic)
  const [createApi, { isLoading: isOrderSubmitting }] =
    useCreateOrderMutation();
  const [updateOrderApi, { isLoading: isOrderUpdating }] =
    useUpdateOrderMutation();

  const submitOrder = async (data: OrderFormType) => {
    try {
      const payload = {
        ...data,
        orderItems: orderItems.map((item: OrderItem) => {
          if (String(item.id).includes("newitem_")) {
            return { productId: item.productId, quantity: item.quantity };
          }
          return {
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
          };
        }),
      };
      if (getValues("orderType") !== "dineIn") {
        delete payload.tableId;
      }
      const response = isEditMode
        ? await updateOrderApi({
            id: orderId,
            body: payload,
          }).unwrap()
        : await createApi({
            body: payload,
          }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => navigate(ORDER_LIST_ROUTE),
      });
    } catch (error: any) {
      console.error(error, "error message");
    }
  };

  const onSubmit = async (data: OrderFormType) => {
    if (orderItems.length === 0) {
      setError("orderItems", {
        message: "At least one order item is required",
      });
      return;
    }
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!pendingData) return;
    setIsConfirming(true);
    await submitOrder(pendingData);
    setIsConfirming(false);
    setIsConfirmOpen(false);
  };

  return (
    <>
      {!isComponent && (
        <PageTitle
          title={isEditMode ? "Edit Order" : "Create New Order"}
          isBack
        />
      )}

      <div className="max-w-[95rem] mx-auto">
        <form
          className={`grid grid-cols-[2fr,1fr] gap-2 ${isComponent ? "" : "form-container"}`}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            {/* Order Information Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <MdShoppingCart className="mr-2 text-blue-600" />
                Order Information
              </h3>

              <div className="mb-4 flex items-center gap-8">
                <div>
                  {/* Order Type */}
                  <label className="block text-sm font-medium text-gray-700 mb-2 input-label">
                    Order Type
                  </label>
                  <Controller
                    name="orderType"
                    control={control}
                    defaultValue="dineIn"
                    render={({ field }) => (
                      <div className="flex space-x-5 p-1 rounded-lg">
                        {orderTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`flex border-2 py-3 px-8 text-base font-medium rounded-md transition-colors ${
                              field.value === option.value
                                ? "bg-primaryColor text-white border-none"
                                : "bg-white text-gray-700 hover:bg-gray-200"
                            }`}
                            onClick={() => field.onChange(option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
                {/* Table (for dineIn) */}
                {watchedOrderType === "dineIn" && (
                  <Controller
                    defaultValue={tableId || ""}
                    name="tableId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Table: "
                        options={tableOptions}
                        className="flex items-start gap-3"
                        error={errors.tableId?.message}
                        required
                      />
                    )}
                  />
                )}
              </div>

              {/* Product Selection */}
              <div className="my-6">
                <div className="mb-6">
                  <div className="relative">
                    <Input
                      placeholder="Search menu items..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {isProductLoading ? (
                  <div className="text-center py-12">
                    <MdShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      Loading menu items...
                    </p>
                  </div>
                ) : filteredProducts?.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="text-left text-lg font-semibold text-gray-900">
                      {productSearchTerm
                        ? `Search Results (${filteredProducts.length})`
                        : "Top Selling Menu Items"}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {productsToRender.map(
                        (product: {
                          id: string;
                          name: string;
                          description: string;
                          price: number;
                          quantity: number;
                          mediaArr: {
                            imageUrl: string;
                          }[];
                        }) => (
                          <div
                            key={product.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200 bg-white"
                            onClick={() => {
                              addProductToOrder(product);
                              playAudio();
                            }}
                          >
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 justify-center">
                              {product?.mediaArr?.[0]?.imageUrl ? (
                                <img
                                  src={`${IMAGE_BASE_URL}${product.mediaArr[0].imageUrl}`}
                                  alt={product.name}
                                  className="w-[80px] h-[80px] object-cover rounded mb-3"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-100 text-gray-400 flex items-center justify-center rounded mb-3 text-xs">
                                  No image
                                </div>
                              )}
                            </div>
                            {/* <p
                              dangerouslySetInnerHTML={{
                                __html: product?.description,
                              }}
                              className="text-xs text-gray-600 mb-3 line-clamp-2"
                            ></p> */}
                            <div className="flex items-center">
                              <span className="text-lg font-bold text-primaryColor">
                                {CurrencySign}{" "}
                                {Number(product.price).toFixed(2)}
                              </span>
                              {/* <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Stock: {product.quantity}
                              </span> */}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <button
                                type="button"
                                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium py-2 px-3 rounded transition-colors"
                              >
                                Add to Order
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MdShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      {productSearchTerm
                        ? "No menu items match your search"
                        : "No products available"}
                    </p>
                    {productSearchTerm && (
                      <p className="text-gray-400 text-sm">
                        Try searching with different keywords
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Address (for delivery) */}
              {watchedOrderType === "delivery" && (
                <div className="mt-6">
                  <Input
                    label="Delivery Address"
                    placeholder="Enter complete delivery address"
                    className="w-full"
                    {...register("deliveryAddress")}
                    error={errors.deliveryAddress?.message}
                    required
                  />
                </div>
              )}
            </div>

            {/* Order Note */}
            <div className="mt-6">
              <TextArea
                rows={5}
                label="Order Note"
                placeholder="Any special instructions or notes"
                className="w-full"
                {...register("orderNote")}
                error={errors.orderNote?.message}
              />
            </div>
          </div>
          <div>
            {/* Order Items Section */}
            <div className="bg-white rounded-lg flex flex-col h-full shadow-sm border border-gray-200 px-3">
              <div className="flex items-center justify-between py-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Items
                </h3>
              </div>

              {orderItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <MdShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">
                    No items added yet
                  </p>
                  <p className="text-gray-400 text-sm">
                    Click "Add Items" to start building the order
                  </p>
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-4 py-6 rounded-lg border ${item.status === "cancelled" ? "bg-gray-200" : "bg-gray-50"}`}
                    >
                      <div
                        className={`flex flex-col items-start ${item.status === "cancelled" ? "line-through" : ""}`}
                      >
                        <h4 className={`font-medium text-gray-900 `}>
                          {item.productName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {CurrencySign} {Number(item.productPrice).toFixed(2)}{" "}
                          each
                        </p>
                      </div>

                      <div
                        className={`flex items-center space-x-2 ${item.status === "cancelled" ? "hidden" : ""}`}
                      >
                        <div className="flex items-center space-x-2">
                          <Button
                            handleClick={() => {
                              updateOrderItemQuantity(
                                item.id,
                                item.quantity - 1,
                              );
                              playAudio();
                            }}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium text-[15px]">
                            {item.quantity}
                          </span>
                          <Button
                            handleClick={() => {
                              updateOrderItemQuantity(
                                item.id,
                                item.quantity + 1,
                              );
                              playAudio();
                            }}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div
                          onClick={() => {
                            removeOrderItem(item.id);
                            playDeleteAudio();
                          }}
                          className="text-right"
                        >
                          <Plus className="rotate-45 text-red-400 cursor-pointer" />
                        </div>
                        {/* {item?.status === "pending" && (
                          <Button
                            type="button"
                            onClick={() => removeOrderItem(item.id)}
                            className="bg-red-500 py-[0.5rem] px-[0.75rem] h-fit rounded-[6px] flex items-center text-white"
                          >
                            Cancel Order
                          </Button>
                        )} */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Total Section */}
              <div className="border-t pt-4 mt-auto">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">
                    {CurrencySign} {Number(totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
              {/* Submit Button */}
              <div className="flex justify-end space-x-4 mt-4 pb-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || orderItems.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <MdShoppingCart className="mr-2" />
                      {isEditMode ? "Update Order" : "Create Order"}
                    </>
                  )}
                </button>
              </div>

              {errors.orderItems && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.orderItems.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b relative">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm {isEditMode ? "Update" : "Order"}
              </h3>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between mb-4 text-sm text-gray-700">
                <p className="mb-1">
                  <span className="font-medium">Order Type:</span>{" "}
                  {watchedOrderType}
                </p>
                {watchedOrderType === "dineIn" && (
                  <p className="mb-1">
                    <span className="font-medium">Table:</span>{" "}
                    {tableOptions.find(
                      (t: { value: string; label: string }) =>
                        t.value ===
                        String(
                          (pendingData as any)?.tableId ?? watchedTableId ?? "",
                        ),
                    )?.label || "-"}
                  </p>
                )}
                {pendingData?.deliveryAddress && (
                  <p className="mb-1">
                    <span className="font-medium">Delivery Address:</span>{" "}
                    {pendingData.deliveryAddress}
                  </p>
                )}
                {pendingData?.orderNote && (
                  <p className="mb-1">
                    <span className="font-medium">Note:</span>{" "}
                    {pendingData.orderNote}
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
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 px-4 py-2 text-sm"
                    >
                      <div className="col-span-6 truncate">
                        {item.productName}
                      </div>
                      <div className="col-span-2 text-right">
                        {item.quantity}
                      </div>
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
                    {CurrencySign} {Number(totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={isConfirming}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2 rounded-md"
              >
                {isConfirming ? "Processing..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={isConfirming}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2 rounded-md"
              >
                Confirm and Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
