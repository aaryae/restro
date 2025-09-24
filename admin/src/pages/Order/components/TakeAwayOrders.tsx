import usePagination from "@/hooks/usePagination";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import PageTitle from "@/components/PageTitle";
import Drawer from "@/components/Drawer";
import ViewOrder from "../ViewOrder";

function TakeAwayOrders() {
  const { query, handlePagination } = usePagination({ limit: 6, page: 1 });
  const [orderId, setOrderId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [queryStringOptions, setQueryStringOptions] = useState({
    orderType: "takeaway",
    status: "pending,preparing,prepared", // Exclude completed orders
  });

  // const url = buildQueryString(
  //   "order/list",
  //   {
  //     page: query.page,
  //     limit: query.limit,
  //     search: queryStringOptions,
  //   },
  //   [query],
  // );

  const handleViewOrder = (id: number) => {
    setOrderId(id);
    setOpen(true);
  };

  const url = useMemo(() => {
    return buildQueryString("order/list", {
      page: query.page,
      limit: query.limit,
      search: queryStringOptions,
    });
  }, [query.page, query.limit, queryStringOptions]);
  const {
    data: allOrders,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url });

  const items = (success ? allOrders?.data?.data : []) || [];
  const total = allOrders?.data?.total ?? 0;
  const totalPages =
    allOrders?.data?.totalPages ||
    (total && query.limit ? Math.ceil(total / query.limit) : 0);
  const canGoNext = totalPages
    ? query.page < totalPages
    : items.length === query.limit;

  // Sync total counts into the pagination hook (same pattern as KotList)
  useEffect(() => {
    if (allOrders?.data) {
      handlePagination({
        total: allOrders.data.total,
        totalPages: allOrders.data.totalPages,
      });
    }
  }, [allOrders, handlePagination]);

  // Reset to first page on filter/search changes
  useEffect(() => {
    handlePagination({ page: 1 });
  }, [queryStringOptions, handlePagination]);

  const handlePrev = () => {
    if (query.page > 1) handlePagination({ page: query.page - 1 });
  };
  // const handleNext = () => {
  //   if (canGoNext) {
  //     handlePagination({ page: query.page + 1, limit: query.limit });
  //   }
  // };

  return (
    <>
      <PageTitle title="Take Away Orders" className="mt-16 " />
      <div className="mt-8">
        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && (
            <div className="col-span-full text-center text-gray-600 py-10">
              Loading take-away orders...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="col-span-full text-center text-gray-600 py-10">
              No take-away orders found.
            </div>
          )}

          {items.map(
            ({
              id,
              table,
              orderType,
              orderStartTime,
              paymentStatus,
              status,
              totalAmount,
            }: any) => (
              <div
                key={id}
                className="rounded-xl p-4 shadow-sm border border-emerald-200 bg-[#E7F9E7]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                    Takeaway
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {paymentStatus}
                  </span>
                </div>

                <div
                  className={`${status === "cancelled" ? "line-through opacity-60" : ""}`}
                >
                  <div className="text-lg font-semibold text-gray-900">
                    {table?.tableNo ? `Table ${table.tableNo}` : "No Table"}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    Type: {orderType}
                  </div>
                  <div className="text-sm text-gray-700">
                    Started: {format(new Date(orderStartTime), "PPp")}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-800">
                    Amount:{" "}
                    <span className="font-semibold">
                      {Number(totalAmount).toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-emerald-700 hover:text-emerald-800 text-sm inline-flex items-center gap-2"
                    onClick={() => handleViewOrder(id)}
                  >
                    <FaEye /> View
                  </button>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Pagination */}
        {allOrders?.data?.data?.length > 0 && (
          <div className="flex items-center justify-between gap-3 mt-6">
            <button
              type="button"
              className="px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
              onClick={handlePrev}
              disabled={query.page <= 1}
            >
              Prev
            </button>
            <div className="text-sm text-gray-600">
              Page {query.page} of {totalPages || 1}
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
              onClick={() =>
                handlePagination({
                  page: totalPages
                    ? Math.min(totalPages, query.page + 1)
                    : query.page + 1,
                })
              }
              disabled={!canGoNext}
            >
              Next
            </button>
          </div>
        )}
      </div>
      <Drawer isOpen={open} setIsOpen={setOpen} width="w-full lg:w-[50%]">
        <ViewOrder id={orderId} isOpen={open} setIsOpen={setOpen} />
      </Drawer>
    </>
  );
}

export default TakeAwayOrders;
