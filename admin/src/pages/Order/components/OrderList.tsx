import CancelOrderModal from "@/components/CancelOrderModal";
import Drawer from "@/components/Drawer";
import Table from "@/components/Table";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useUpdateOrderStatusMutation } from "@/redux/services/orders";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ViewOrder from "../ViewOrder";
import OrderFilter from "./OrderFilter";

export default function OrderList() {
  const { query, handlePagination } = usePagination({ limit: 10, page: 1 });

  const [queryStringOptions, setQueryStringOptions] = useState({
    start: null,
    end: null,
    paymentStatus: null,
    orderStatus: null,
  });

  const navigate = useNavigate();

  const url = buildQueryString("order/list", {
    page: query.page,
    limit: query.limit,
    search: queryStringOptions,
  });

  const {
    data: allOrders,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url });

  // Initialize react-hook-form for the header view toggle
  const { control } = useForm<{ accountType: string }>({
    defaultValues: { accountType: "table" },
  });
  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, []);
  const [patchStatus] = useUpdateOrderStatusMutation();

  const [orderId, setOrderId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const [openCancel, setOpenCancel] = useState<boolean>(false);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const handleReload = () => {
    refetch();
  };

  const handleViewOrder = (id: number) => {
    setOrderId(id);
    setOpen(true);
  };

  const handleNewButton = (id: number | null) => {
    id === null
      ? navigate(ORDER_ADD_ROUTE)
      : navigate(`${ORDER_ADD_ROUTE}${id}`);
  };

  const handleCancelTrigger = (id: number) => {
    setCancelId(id);
    setOpenCancel(true);
  };

  async function hanldeOrderCancellation(remarks: string) {
    try {
      const response = await patchStatus({
        id: cancelId,
        body: { status: "cancelled" },
      }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpenCancel(false);
    }
  }

  const pagination = {
    page: allOrders?.data?.page ?? 1,
    limit: allOrders?.data?.limit ?? 10,
    total: allOrders?.data?.total ?? 0,
    totalPages: allOrders?.data?.totalPages ?? 0,
  };

  const statusOptions = [
    "pending",
    "completed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const tableHeader = [
    "Table No",
    "Order Type",
    "Order StartedAt",
    "Amount",
    "Payment Status",
    "Actions",
  ];

  console.log(allOrders?.data?.data, "all orders data");

  const tableData =
    success && allOrders?.data?.data
      ? allOrders?.data?.data?.map(
          ({
            id,
            table,
            orderType,
            orderStartTime,
            paymentStatus,
            status,
            totalAmount,
          }) => [
            <span className={`${status === "cancelled" ? "line-through" : ""}`}>
              {table?.tableNo || "No Table found"}
            </span>,
            <span className={`${status === "cancelled" ? "line-through" : ""}`}>
              {orderType}
            </span>,
            <span className={`${status === "cancelled" ? "line-through" : ""}`}>
              {format(new Date(orderStartTime), "PPp")}
            </span>,
            <span className={`${status === "cancelled" ? "line-through" : ""}`}>
              {totalAmount}
            </span>,
            <span className={`${status === "cancelled" ? "line-through" : ""}`}>
              {paymentStatus}
            </span>,
            <div
              key={id}
              className="flex items-center justify-center gap-[0.5rem]"
            >
              <FaEye
                size={18}
                className="text-[#0090DD] cursor-pointer"
                onClick={() => handleViewOrder(id)}
              />
              {status === "pending" ? (
                <CancelOrderModal
                  open={openCancel}
                  setOpen={setOpenCancel}
                  handleCancelTrigger={() => handleCancelTrigger(id)}
                  handleConfirmCancel={hanldeOrderCancellation}
                />
              ) : (
                ""
              )}
            </div>,
          ],
        )
      : [];

  return (
    <>
      <div className="mt-8">
        <OrderFilter
          queryStringOptions={queryStringOptions}
          setQueryStringOptions={setQueryStringOptions}
        />
        <Table
          headers={tableHeader}
          data={tableData}
          pagination={pagination}
          handlePagination={handlePagination}
        />
        <Drawer isOpen={open} setIsOpen={setOpen} width="w-full lg:w-[50%]">
          <ViewOrder id={orderId} isOpen={open} setIsOpen={setOpen} />
        </Drawer>
      </div>
    </>
  );
}
