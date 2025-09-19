/* eslint-disable @typescript-eslint/no-explicit-any */
import Table from "@/components/Table";
import { useForm } from "react-hook-form";
import Spinner from "@/components/Spinner";
import { MdEditSquare } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import usePagination from "@/hooks/usePagination";
import DeleteModal from "@/components/DeleteModal";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import ExportToExcel from "@/components/ExportToExcel";
import { buildQueryString } from "@/utils/generalHelper";
import { SUPPLIER_ADD_ROUTE } from "@/routes/routeNames";
import { SUPPLIER_URL } from "@/constants/apiUrlConstants";
import { FilterInput } from "@/components/Input/filterInput";
import PageFilterSample from "@/components/PageFilterSample";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import { SupplierFilterSchema, SupplierFilterType } from "./schema";
import { MapPin, IdCard, UserRound, Phone } from "lucide-react";
import { handleError, handleResponse } from "@/utils/responseHandler";
import {
  useDeleteSupplierByIdMutation,
  useGetListAllSupplierQuery,
} from "@/redux/services/supplier";

export default function Supplier() {
  const [deleteId, setDeletedId] = useState<number | null>(null);
  const [deleteModelOpen, setDeleteModelOpen] = useState<boolean>(false);
  const [isExportTriggered, setIsExportTriggered] = useState<boolean>(false);
  // const [isOpen, setIsOpen] = useState<boolean>(false);
  // const [customerId, setCustomerId] = useState<number | null>(null);

  const [deleteData] = useDeleteSupplierByIdMutation();

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm<SupplierFilterType>({
    resolver: zodResolver(SupplierFilterSchema),
  });

  const [queryString, setQueryString] = useState<Record<string, any>>({});

  // const handleChange = (value: boolean) => {
  //   setValue("userType", value);
  // };

  // const handleDateInput = (value: Date) => {
  //   setValue("createdAt", value);
  // };

  const handleNewButton = (id: number | null) => {
    if (id === null) {
      navigate(SUPPLIER_ADD_ROUTE);
    } else {
      navigate(`${SUPPLIER_ADD_ROUTE}${id}`);
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletedId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteData(`${SUPPLIER_URL}${deleteId}`).unwrap();

      handleResponse({
        res: {
          success: true,
          msg: response?.message,
        },
        onSuccess: () => {
          refetch();
          navigate("/admin/supplier/list");
        },
      });
    } catch (error: any) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
    }
  };

  const filterField = useMemo(
    () => [
      {
        name: "name",
        label: "Name of Entity",
        Component: FilterInput,
        control,
        icon: <UserRound className="w-4 h-4" />,
      },
      {
        name: "address",
        label: "Address",
        Component: FilterInput,
        control,
        icon: <MapPin className="w-4 h-4" />,
      },
      {
        name: "pan_vat_number",
        label: "PAN Number",
        Component: FilterInput,
        control,
        icon: <IdCard className="w-4 h-4" />,
      },
      {
        name: "contact_person",
        label: "Name of Supplier",
        Component: FilterInput,
        control,
        icon: <IdCard className="w-4 h-4" />,
      },
      {
        name: "contact_number",
        label: "Contact Number",
        Component: FilterInput,
        control,
        icon: <Phone className="w-4 h-4" />,
      },
    ],

    [control],
  );

  const { Component } = PageFilterSample(
    filterField,
    handleSubmit,
    (query: Record<string, any>) => setQueryString(query),
    reset,
  );

  const url = buildQueryString("supplier/list", {
    page: query.page,
    limit: query.limit,
    search: queryString,
  });

  const {
    data: allSupplier,
    isSuccess: success,
    isLoading: supplierDataLoading,
    refetch,
  } = useGetListAllSupplierQuery({ url });
  console.log("allSupplier", allSupplier);

  useEffect(() => {
    refetch();
  }, [queryString]);

  const handleReload = () => {
    refetch();
  };

  useEffect(() => {
    refetch();
  }, [control, handleSubmit]);

  // const handleViewSupplier = (id: number) => {
  //   setCustomerId(id);
  //   setIsOpen(true);
  // };

  const pagination = {
    page: allSupplier?.data?.page ?? 1,
    limit: allSupplier?.data?.limit ?? 10,
    total: allSupplier?.data?.total ?? 0,
    totalPages: allSupplier?.data?.totalPages ?? 1,
  };

  const tableHeaders = [
    "Name of Entity",
    "Address of Entity",
    "PAN/VAT Number",
    "Contact Person",
    "Contact Number",
    "Action",
  ];

  const tableData =
    success && allSupplier?.data?.data
      ? allSupplier?.data?.data.map(
          ({
            id,
            name,
            address,
            pan_vat_number,
            contact_person,
            contact_number,
          }: any) => [
            name,
            address,
            pan_vat_number,
            contact_person,
            contact_number,

            <div
              key={id}
              className="flex items-center justify-center gap-[0.5rem]"
            >
              {/* <FaEye
                size={18}
                className="text-[#0090DD] cursor-pointer"
                onClick={() => handleViewSupplier(id)}
              /> */}
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

  if (supplierDataLoading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <div>
      <PageHeader
        hasAddButton={true}
        newButtonText="Add New Supplier"
        handleNewButton={() => handleNewButton(null)}
        handleReloadButton={handleReload}
      ></PageHeader>
      <PageFilterWrapper title="Supplier Filters">
        {Component}
      </PageFilterWrapper>
      <Table
        headers={tableHeaders}
        data={tableData}
        isSN
        pagination={pagination}
        handlePagination={handlePagination}
      />
      {/* <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-full lg:w-[70%]">
        <ViewSupplier id={customerId} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Drawer> */}
    </div>
  );
}
