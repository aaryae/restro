import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
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
import { buildQueryString } from "@/utils/generalHelper";
import Spinner from "@/components/Spinner";
import { CUSTOMER_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { CUSTOMER_URL } from "@/constants/apiUrlConstants";
import { UserRound, Mail } from "lucide-react";

export default function Customer() {
  const [deleteModelOpen, setDeleteModelOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [isExportTriggered, setIsExportTriggered] = useState<boolean>(false);
  const [deleteTable] = useDeleteApiMutation();

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm<CustomerFilterType>({
    resolver: zodResolver(CustomerFilterSchema),
    defaultValues: {
      firstName: "",
      email: "",
    },
  });

  const [queryString, setQueryString] = useState<Record<string, any>>({});

  // No extra handlers needed since we removed User Type and Created Date filters

  const handleNewButton = (id: number | null) => {
    id === null
      ? navigate(CUSTOMER_ADD_ROUTE)
      : navigate(`${CUSTOMER_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletedId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteTable(`${CUSTOMER_URL}${deleteId}`).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          refetch();
        },
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
    }
  };

  const filterField = useMemo(
    () => [
      {
        name: "firstName",
        label: "First Name",
        Component: FilterInput,
        control,
        icon: <UserRound className="w-4 h-4" />,
      },
      {
        name: "email",
        label: "Email",
        Component: FilterInput,
        control,
        icon: <Mail className="w-4 h-4" />,
      },
    ],

    [control],
  );

  const { Component } = PageFilterSample(
    filterField,
    handleSubmit,
    (query: Record<string, any>) => setQueryString(query),
    () => {
      reset({ firstName: "", email: "" });
      setQueryString({});
      handlePagination({ page: 1, limit: query.limit });
    },
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
    "Full Name",
    "Email",
    "Mobile Number",
    "Created At",
    "Actions",
  ];

  const tableData =
    success && allCustomers?.data?.data
      ? allCustomers?.data?.data.map(
          ({ id, firstName, lastName, email, mobileNo, createdAt }) => [
            `${firstName} ${lastName}`,
            email,
            mobileNo,
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
              <MdEditSquare
                size={18}
                className="text-[#0090DD]"
                onClick={() => handleNewButton(id)}
              />
              <DeleteModal
                open={deleteModelOpen}
                setOpen={setDeleteModelOpen}
                handleDeleteTrigger={() => handleDeleteTrigger(id)}
                handleConfirmDelete={handleDelete}
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
      <PageHeader
        hasAddButton={true}
        newButtonText="Add New Customer"
        handleNewButton={() => handleNewButton(null)}
        handleReloadButton={handleReload}
      >
        {/* {success && (
          <ExportToExcel
            title="Customer Report"
            headers={tableHeaders}
            data={tableDataReport}
            success={reportSuccess}
            refetch={reportRefetch}
            setIsExportTriggered={setIsExportTriggered}
          />
        )} */}
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
