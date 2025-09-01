import Table from "@/components/Table";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { format } from "date-fns";
import { useState } from "react";
import { FaEye } from "react-icons/fa";

function TakeAwayOrders() {
  const { query, handlePagination } = usePagination({ limit: 10, page: 1 });

  const [queryStringOptions, setQueryStringOptions] = useState({
    orderType: "takeaway",
  });
  const url = buildQueryString("order/list", {
    page: query.page,
    limit: query.limit,
    search: queryStringOptions,
  });

  const tableHeader = [
    "Table No",
    "Order Type",
    "Order StartedAt",
    "Amount",
    "Payment Status",
  ];

  const {
    data: allOrders,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url });

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
            // <div
            //   key={id}
            //   className="flex items-center justify-center gap-[0.5rem]"
            // >
            //   <FaEye
            //     size={18}
            //     className="text-[#0090DD] cursor-pointer"
            //     onClick={() => handleViewOrder(id)}
            //   />
            // </div>,
          ],
        )
      : [];

  console.log(allOrders, "all odrs for dashbaord");
  return (
    <div className="mt-16">
      <Table headers={tableHeader} data={tableData} />
    </div>
  );
}

export default TakeAwayOrders;
