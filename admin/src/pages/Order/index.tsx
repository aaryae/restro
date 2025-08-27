import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { useGetApiQuery, usePatchApiMutation } from "@/redux/services/crudApi";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import ViewOrder from "./ViewOrder";
import usePagination from "@/hooks/usePagination";

import { handleError, handleResponse } from "@/utils/responseHandler";

import { buildQueryString } from "@/utils/generalHelper";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import { useNavigate } from "react-router-dom";

import { ORDER_ADD_ROUTE } from "@/routes/routeNames";
import { format } from "date-fns";
import CancelOrderModal from "@/components/CancelOrderModal";
import OrderFilter from "./OrderFilter";

export default function Order() {
  const { query, handlePagination } = usePagination({ limit: 10, page: 1 });

  const [queryStringOptions, setQueryStringOptions] = useState({
    startDate: null,
    endDate: null,
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

  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, []);
  const [patchStatus] = usePatchApiMutation();

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
        url: `order/status/${cancelId}`,
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
    "Table Name",
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
            table: { tableNo },
            orderType,
            orderStartTime,
            paymentStatus,
            status,
            totalAmount,
          }) => [
            <span className={`${status === "cancelled" ? "line-through" : ""}`}>
              {tableNo}
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
              {status !== "cancelled" && status !== "completed" ? (
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
    <div>
      <PageHeader
        hasAddButton={true}
        newButtonText={"Create Order"}
        handleNewButton={() => handleNewButton(null)}
        handleReloadButton={handleReload}
      >
        {/* {success && (
          <ExportToExcel
            title="Order Report"
            headers={tableHeader}
            data={tableDataReport}
            success={reportSuccess}
            refetch={reportRefetch}
            setIsExportTriggered={setIsExportTriggered}
          />
        )} */}
      </PageHeader>
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
  );
}
