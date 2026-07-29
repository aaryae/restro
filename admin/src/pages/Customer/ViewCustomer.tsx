import PageTitle from "@/components/PageTitle";
import { IMAGE_BASE_URL } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { SetStateAction, useState } from "react";
import userImage from "@/assets/user_image.jpeg";
import moment from "moment";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import Table from "@/components/Table";
import { User } from "lucide-react";
import Select from "@/components/Select";

type ViewCustomerProps = {
  id: number | null;
  isOpen: boolean;
  setIsOpen: React.Dispatch<SetStateAction<boolean>>;
};

export default function ViewCustomer({
  id,
  isOpen,
  setIsOpen,
}: ViewCustomerProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const {
    data: customerData,
    isLoading: loading,
    isSuccess: success,
  } = useGetApiQuery(
    { url: `customer-auth/${id}` },
    {
      skip: id === null || id === undefined,
    },
  );

  const orderDetails =
    (success &&
      customerData.data.orders &&
      customerData.data.orders.length > 0 &&
      (
        (statusFilter === "all"
          ? customerData.data.orders
          : customerData.data.orders.filter((o: any) => {
              const status = (o?.paymentStatus || "").toLowerCase();
              if (statusFilter === "paid") {
                return status === "paid";
              }
              return status === statusFilter;
            })) as any[]
      ).map((order: any) => {
        const {
          id,
          orderNumber,
          orderStartTime,
          createdAt,
          paymentMethods,
          paymentMethod,
          paymentStatus,
          totalAmount,
        } = order || {};

        const items = (order?.orderItems || order?.items || []).filter(
          (it: any) => !it?.isAddon,
        );
        let productLabel: string | undefined = undefined;
        if (Array.isArray(items) && items.length > 0) {
          const first = items[0];
          const firstName =
            first?.product?.name ||
            first?.product?.title ||
            first?.itemName ||
            first?.title ||
            first?.productName ||
            first?.name;
          const more = items.length - 1;
          if (firstName) {
            productLabel = more > 0 ? `${firstName} + ${more} more` : firstName;
          }
        }
        if (!productLabel) {
          productLabel =
            order?.productName ||
            order?.product?.name ||
            order?.orderNumber ||
            order?.table?.name ||
            order?.table?.tableNo ||
            (id ? `Order #${id}` : "—");
        }

        const paymentMethodLabel = Array.isArray(paymentMethods)
          ? paymentMethods.filter(Boolean).join(", ") || "—"
          : paymentMethod || "—";

        const orderDateValue = orderStartTime || createdAt;

        return [
          productLabel,
          orderNumber || id,
          orderDateValue
            ? moment(orderDateValue).format("MMM D, YY hh:mm a")
            : "—",
          paymentMethodLabel,
          <div className="flex justify-center">
            <div className={changeClassNameByName(paymentStatus)}>
              {formatPaymentStatus(paymentStatus)}
            </div>
          </div>,
          totalAmount != null ? Number(totalAmount).toFixed(2) : "—",
        ];
      })) ??
    [];

  return (
    <div className="mt-[2rem] ">
      <PageTitle
        className="border-[1px] px-4 py-2 rounded-[4px] bg-primaryColor text-white"
        title="Customer Details"
      />
      {success && (
        <div>
          <div className="relative mt-8 flex">
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-primaryColor/30 via-pink-500/20 to-purple-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-primaryColor to-purple-500" />

              <div className="flex gap-6 p-6">
                <div className="relative mx-auto md:mx-0">
                  <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full ring-4 ring-white/80 shadow-2xl overflow-hidden">
                    <img
                      src={
                        customerData?.data?.imageUrl !== null
                          ? `${IMAGE_BASE_URL}${customerData?.data?.imageUrl}`
                          : userImage
                      }
                      alt="User"
                      className="object-cover h-full w-full"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-6 w-6 text-primaryColor" />
                    <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                      {customerData.data.firstName} {customerData.data.lastName}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2 mb-5">
                    <span className="inline-flex max-w-[18rem] md:max-w-[19rem] items-center gap-2 text-sm text-gray-700 bg-white/70 border border-gray-200 rounded-full px-3 py-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      <span className="h-2 w-2 rounded-full bg-primaryColor" />
                      <span className="truncate">
                        Email: {customerData.data.email}
                      </span>
                    </span>
                    <span className="inline-flex max-w-[18rem] md:max-w-[13rem] items-center gap-2 text-sm text-gray-700 bg-white/70 border border-gray-200 rounded-full px-3 py-1 whitespace-nowrap">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Phone No: {customerData.data.mobilePrefix}{" "}
                      {customerData.data.mobileNo}
                    </span>
                    <span className="inline-flex max-w-[18rem] md:max-w-[14rem] items-center gap-2 text-sm text-gray-700 bg-white/70 border border-gray-200 rounded-full px-3 py-1 whitespace-nowrap">
                      <span className="h-2 w-2 rounded-full bg-pink-500" />
                      Loyalty Points:{" "}
                      <strong className="tabular-nums text-primaryColor">
                        {Number(customerData.data.loyaltyPoints || 0)}
                      </strong>
                    </span>
                    <p className="text-left text-xs text-slate-500">
                      Earn 1 point for every Rs. 100 spent (e.g. Rs. 1,500 → 15
                      points). Checkout as Member to credit points.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-2 bg-white/70 border border-gray-200 rounded-full px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Created:{" "}
                      {moment(customerData.data.createdAt).format(
                        "MMM DD, YYYY h:mm a",
                      )}
                    </span>
                    <span className="inline-flex items-center gap-2 bg-white/70 border border-gray-200 rounded-full px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      Updated:{" "}
                      {moment(customerData.data.updatedAt).format(
                        "MMM DD, YYYY h:mm a",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#f0f3f4] w-full flex flex-col items-start p-[1.25rem] mt-[2rem] rounded-[4px]">
            <h3 className="font-[700] text-[1.25rem] ">Order Summary</h3>
            <div className="mt-[0.75rem] flex w-full flex-wrap items-center gap-3">
              <div className="w-[180px]">
                <Select
                  id="payment-status-filter"
                  label="Payment Status"
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={[
                    { value: "all", label: "All" },
                    { value: "pending", label: "Pending" },
                    { value: "paid", label: "Paid" },
                    { value: "partially_paid", label: "Partially Paid" },
                    { value: "failed", label: "Failed" },
                  ]}
                />
              </div>
            </div>
            <div className="w-full mt-[1rem]">
              <Table
                isSN
                headers={tableHeader}
                data={orderDetails}
                pagination={{
                  limit: 10,
                  page: 1,
                  total: orderDetails.length,
                  totalPages: Math.max(1, Math.ceil(orderDetails.length / 10)),
                }}
                handlePagination={() => {}}
              />
            </div>
          </div>

          {/* Personal Info */}
          {/* <div className="bg-[#f0f3f4] flex w-fit gap-[3rem]">
            <div className="border h-[6.25rem] w-[6.25rem] rounded-[0.375rem]">
              <img
                src={
                  customerData?.data?.imageUrl !== null
                    ? `${IMAGE_BASE_URL}${customerData?.data?.imageUrl}`
                    : userImage
                }
                alt="User"
                className="object-cover h-[6.25rem] w-[6.25rem] overflow-hidden"
                crossOrigin="anonymous"
              />
            </div>
            <div className="flex flex-col gap-[0.25rem]">
              <p>Name: {customerData?.data?.username}</p>
              <p>Email: {customerData?.data?.email}</p>
              <p>Gender: {customerData?.data?.gender}</p>
              <p>Phone Number: {customerData?.data?.mobileNo}</p>
            </div>
          </div> */}
          {/* Payment Methods */}
          {/* <div>
            <PageTitle title="Payment Methods" />
            <div className="border w-fit px-[0.75rem] py-[0.5rem]"></div>
          </div> */}
          {/* Order History */}
          {/* <div>
            <PageTitle title="Order History" />
          </div> */}
          {/* Actions */}
          {/* <div>
            <PageTitle title="Actions" />
          </div> */}
        </div>
      )}
    </div>
  );
}

const tableHeader = [
  "Item",
  "Order Id",
  "Order Date",
  "Payment Method",
  "Payment Status",
  "Total Amount",
];

const changeClassNameByName = (name: string) => {
  let normalClassName =
    "px-[0.75rem] py-[0.25rem] rounded-full w-fit text-black";
  const status = (name || "").toLowerCase();
  if (status === "pending") {
    normalClassName += " bg-yellow-500";
  } else if (status === "paid" || status === "confirmed" || status === "delivered") {
    normalClassName += " bg-green-500 text-white";
  } else if (status === "partially_paid") {
    normalClassName += " bg-orange-400 text-white";
  } else if (status === "cancelled" || status === "failed") {
    normalClassName += " bg-red-500 text-white";
  }
  return normalClassName;
};

const formatPaymentStatus = (status?: string | null) => {
  if (!status) return "—";
  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
