import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { useGetApiQuery } from "@/redux/services/crudApi";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { FaEye } from "react-icons/fa";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import ViewCustomer from "./ViewCustomer";
import { useForm } from "react-hook-form";
import { CustomerFilterSchema, CustomerFilterType } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import PageFilterSample from "@/components/PageFilterSample";
import ExportToExcel from "@/components/ExportToExcel";
import usePagination from "@/hooks/usePagination";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import { FilterInput } from "@/components/Input/filterInput";
import { FilterSelect } from "@/components/Select/FilterSelect";
import { buildQueryString } from "@/utils/generalHelper";
import DateInput from "@/components/DateInput";
import Spinner from "@/components/Spinner";

export default function Customer() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [isExportTriggered, setIsExportTriggered] = useState<boolean>(false);

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<CustomerFilterType>({
      resolver: zodResolver(CustomerFilterSchema),
    });

  const [queryString, setQueryString] = useState("");

  const handleChange = (value: boolean) => {
    setValue("userType", value);
  };

  const handleDateInput = (value: Date) => {
    setValue("createdAt", value);
  };

  const filterField = useMemo(
    () => [
      {
        name: "username",
        label: "Username",
        Component: FilterInput,
        control,
      },
      {
        name: "email",
        label: "Email",
        Component: FilterInput,
        control,
      },
      {
        name: "userType",
        label: "User Type",
        Component: FilterSelect,
        className: "w-full",
        handleChange: handleChange,
        value: getValues("userType"),
        control,
        options: [
          { label: "Guest User", value: "guest" },
          { label: "Customer", value: "customer" },
        ],
      },
      {
        name: "createdAt",
        label: "Created Date",
        Component: DateInput,
        handleChange: handleDateInput,
        value: getValues("createdAt"),
        control,
      },
    ],

    [control],
  );

  const { Component } = PageFilterSample(
    filterField,
    handleSubmit,
    // reset,
    (query: string) => setQueryString(query),
  );

  const url = buildQueryString("customer-auth/list", {
    page: query.page,
    limit: query.limit,
    search: queryString,
  });

  const {
    data: allCustomers,
    isSuccess: success,
    isLoading: customerDataLoading,
    refetch,
  } = useGetApiQuery({ url });

  const {
    data: allCustomersReport,
    isSuccess: reportSuccess,
    refetch: reportRefetch,
  } = useGetApiQuery(
    {
      url: `/customer-auth/list`,
      page: 1,
      limit: allCustomers?.data.limit * allCustomers?.data.totalPages,
    },
    {
      skip: !allCustomers?.data || !isExportTriggered,
    },
  );

  useEffect(() => {
    refetch();
  }, [queryString]);

  const handleReload = () => {
    refetch();
  };

  useEffect(() => {
    refetch();
  }, [control, handleSubmit]);

  const handleViewCustomer = (id: number) => {
    setCustomerId(id);
    setIsOpen(true);
  };

  const pagination = {
    page: allCustomers?.data?.page ?? 1,
    limit: allCustomers?.data?.limit ?? 10,
    total: allCustomers?.data?.total ?? 0,
    totalPages: allCustomers?.data?.totalPages ?? 1,
  };

  const tableHeaders = [
    "Username",
    "Email",
    "Mobile Number",
    "Is Email Verified",
    "Created At",
    "Actions",
  ];

  const tableData =
    success && allCustomers?.data?.data
      ? allCustomers?.data?.data.map(
          ({ id, username, email, mobileNo, isEmailVerified, createdAt }) => [
            username,
            email,
            mobileNo,

            <span className="flex justify-center">
              {isEmailVerified ? (
                <FaCircleCheck className="text-primaryColor" />
              ) : (
                <FaCircleXmark className="text-red-500" />
              )}
            </span>,
            moment(createdAt).format("MMM DD, YYYY"),
            <div
              key={id}
              className="flex items-center justify-center gap-[0.5rem]"
            >
              <FaEye
                size={18}
                className="text-[#0090DD] cursor-pointer"
                onClick={() => handleViewCustomer(id)}
              />
            </div>,
          ],
        )
      : [];

  const tableDataReport =
    reportSuccess && allCustomersReport?.data?.data
      ? allCustomersReport?.data?.data.map(
          ({ id, username, email, mobileNo, isEmailVerified, createdAt }) => [
            username,
            email,
            mobileNo,

            <span className="flex justify-center">
              {isEmailVerified ? (
                <FaCircleCheck className="text-[#0090dd]" />
              ) : (
                <FaCircleXmark className="text-red-500" />
              )}
            </span>,
            moment(createdAt).format("MMM DD, YYYY"),
            <div
              key={id}
              className="flex items-center justify-center gap-[0.5rem]"
            >
              <FaEye
                size={18}
                className="text-[#0090DD] cursor-pointer"
                onClick={() => handleViewCustomer(id)}
              />
            </div>,
          ],
        )
      : [];

  if (customerDataLoading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <div>
      <PageHeader hasAddButton={false} handleReloadButton={handleReload}>
        {success && (
          <ExportToExcel
            title="Customer Report"
            headers={tableHeaders}
            data={tableDataReport}
            success={reportSuccess}
            refetch={reportRefetch}
            setIsExportTriggered={setIsExportTriggered}
          />
        )}
      </PageHeader>
      <PageFilterWrapper title="Customer Filters">
        {Component}
      </PageFilterWrapper>
      <Table
        headers={tableHeaders}
        data={tableData}
        isSN
        pagination={pagination}
        handlePagination={handlePagination}
      />
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-full lg:w-[70%]">
        <ViewCustomer id={customerId} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Drawer>
    </div>
  );
}
