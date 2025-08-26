import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import {
  useGetApiQuery,
  usePatchApiMutation,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import ViewOrder from "./ViewOrder";
import usePagination from "@/hooks/usePagination";
import ExportToExcel from "@/components/ExportToExcel";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { OrderFilterSchema, OrderFilterType } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FilterInput } from "@/components/Input/filterInput";
import { FilterSelect } from "@/components/Select/FilterSelect";
import DateInput from "@/components/DateInput";
import PageFilterSample from "@/components/PageFilterSample";
import { buildQueryString } from "@/utils/generalHelper";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import { useNavigate } from "react-router-dom";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "@/constants/StaticDropdownConstants";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";

export default function Order() {
  const { query, handlePagination } = usePagination({ limit: 10, page: 1 });

  const [isExportTriggered, setIsExportTriggered] = useState<boolean>(false);

  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<OrderFilterType>({
      resolver: zodResolver(OrderFilterSchema),
    });

  const [queryString, setQueryString] = useState("");

  const navigate = useNavigate();

  const handlePaymentChange = (value: string) => {
    setValue("paymentStatus", value);
  };

  const handleOrderChange = (value: string) => {
    setValue("status", value);
  };

  const handleDateInput = (value: string) => {
    setValue("orderDate", value);
  };

  const filterField = useMemo(
    () => [
      {
        name: "email",
        label: "Email",
        Component: FilterInput,
        control,
      },
      {
        name: "mobileNo",
        label: "Mobile Number",
        Component: FilterInput,
        control,
      },

      {
        name: "orderDate",
        label: "Order Date",
        Component: DateInput,
        handleChange: handleDateInput,
        value: getValues("orderDate"),
        control,
      },
      {
        name: "paymentStatus",
        label: "Payment Status",
        Component: FilterSelect,
        className: "w-full",
        handleChange: handlePaymentChange,
        value: getValues("paymentStatus"),
        control,
        options: PAYMENT_STATUS_OPTIONS,
      },
      {
        name: "status",
        label: "Order Status",
        Component: FilterSelect,
        className: "w-full",
        handleChange: handleOrderChange,
        value: getValues("status"),
        control,
        options: ORDER_STATUS_OPTIONS,
      },
    ],

    [control],
  );

  const { Component } = PageFilterSample(
    filterField,
    handleSubmit,
    // reset,
    (query) => setQueryString(query),
  );

  const url = buildQueryString("order/list", {
    page: query.page,
    limit: query.limit,
    search: queryString,
  });

  const {
    data: allOrders,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url });

  const {
    data: allOrdersReport,
    isSuccess: reportSuccess,
    isLoading: reportLoading,
    refetch: reportRefetch,
  } = useGetApiQuery(
    {
      url: "order/list",
      page: 1,
      limit: allOrders?.data?.limit * allOrders?.data?.totalPages,
    },
    {
      skip: !allOrders?.data || !isExportTriggered,
    },
  );

  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, []);
  const [patchStatus] = usePatchApiMutation();

  const [orderId, setOrderId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

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

  async function handleStatusUpdate(status: string, id: number) {
    try {
      const response = await patchStatus({
        url: `order/status/${id}`,
        body: { status },
      }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
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
    "Table Id",
    "Session Id",
    // "Address",
    "Order Type",
    "Order StartedAt",
    "Payment Method",
    "Payment Status",
    "Order Status",
    "Total Amount",
    "Actions",
  ];

  const tableData =
    success && allOrders?.data?.data
      ? allOrders?.data?.data?.map(
          ({
            id,
            tableId,
            sessionId,
            orderType,
            orderStartTime,
            paymentMethod,
            paymentStatus,
            status,
            totalAmount,
          }) => [
            tableId,
            sessionId,
            orderType,
            orderStartTime,
            paymentMethod,
            paymentStatus,
            // <select
            //   className="w-40 p-2 text-base bg-white focus:outline-none focus:border-blue-500 transition-colors"
            //   value={status}
            //   onChange={(e) => handleStatusUpdate(e.target.value, id)}
            // >
            //   {statusOptions.map((option) => (
            //     <option className="text-center" value={option}>
            //       {option}
            //     </option>
            //   ))}
            // </select>
            status,
            totalAmount,
            <div
              key={id}
              className="flex items-center justify-center gap-[0.5rem]"
            >
              <FaEye
                size={18}
                className="text-[#0090DD] cursor-pointer"
                onClick={() => handleViewOrder(id)}
              />
            </div>,
          ],
        )
      : [];

  const tableDataReport =
    reportSuccess && allOrdersReport?.data?.data
      ? allOrdersReport?.data?.data?.map(
          ({
            id,
            pinCode,
            address,
            city,
            deliveryTime,
            email,
            mobileNumber,
            orderDate,
            paymentMethod,
            paymentStatus,
            status,
            totalAmount,
          }) => [
            email,
            mobileNumber,
            // `${pinCode} - ${address} , ${city}`,
            moment(orderDate).format("MMM D, YY hh:mm"),
            deliveryTime,
            paymentMethod,
            paymentStatus,
            status,
            totalAmount,
            <div
              key={id}
              className="flex items-center justify-center gap-[0.5rem]"
            >
              <FaEye
                size={18}
                className="text-[#0090DD] cursor-pointer"
                onClick={() => handleViewOrder(id)}
              />
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
      <PageFilterWrapper title="Order Filters">{Component}</PageFilterWrapper>
      <Table
        headers={tableHeader}
        data={tableData}
        isSN
        pagination={pagination}
        handlePagination={handlePagination}
      />
      <Drawer isOpen={open} setIsOpen={setOpen} width="w-full lg:w-[50%]">
        <ViewOrder id={orderId} isOpen={open} setIsOpen={setOpen} />
      </Drawer>
    </div>
  );
}
