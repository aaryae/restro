/* eslint-disable @typescript-eslint/no-explicit-any */
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import { useForm } from "react-hook-form";
import Spinner from "@/components/Spinner";
import { MdEditSquare } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import usePagination from "@/hooks/usePagination";
import DeleteModal from "@/components/DeleteModal";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { checkAccess } from "@/utils/accessHelper";

export default function Supplier() {
  const accessList = checkAccess("Supplier");
  const [deleteId, setDeletedId] = useState<number | null>(null);
  const [deleteModelOpen, setDeleteModelOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteData] = useDeleteSupplierByIdMutation();

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const navigate = useNavigate();

  const { control, handleSubmit, reset } = useForm<SupplierFilterType>({
    resolver: zodResolver(SupplierFilterSchema),
    defaultValues: {
      name: "",
      supplier_code: "",
      address: "",
      contact_number: "",
      email: "",
      pan_vat_number: "",
      contact_person: "",
    },
  });

  const [queryString, setQueryString] = useState<Record<string, any>>({});

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
        icon: <UserRound className="h-4 w-4" />,
      },
      {
        name: "address",
        label: "Address",
        Component: FilterInput,
        control,
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        name: "pan_vat_number",
        label: "PAN Number",
        Component: FilterInput,
        control,
        icon: <IdCard className="h-4 w-4" />,
      },
      {
        name: "contact_person",
        label: "Name of Supplier",
        Component: FilterInput,
        control,
        icon: <IdCard className="h-4 w-4" />,
      },
      {
        name: "contact_number",
        label: "Contact Number",
        Component: FilterInput,
        control,
        icon: <Phone className="h-4 w-4" />,
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
    search: {
      ...queryString,
      ...(searchTerm ? { name: searchTerm } : {}),
    },
  });

  const {
    data: allSupplier,
    isSuccess: success,
    isLoading: supplierDataLoading,
    refetch,
  } = useGetListAllSupplierQuery({ url });

  useEffect(() => {
    refetch();
  }, [queryString, searchTerm]);

  const pagination = {
    page: allSupplier?.data?.total === 0 ? 0 : allSupplier?.data?.page,
    limit: allSupplier?.data?.limit,
    total: allSupplier?.data?.total,
    totalPages: allSupplier?.data?.totalPages,
  };

  const tableHeaders = [
    "Entity Name",
    "Address",
    "PAN/VAT",
    "Contact Person",
    "Contact Number",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const showActions =
    accessList.includes("edit") || accessList.includes("delete");

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
          }: any) => {
            const row = [
              <span className="text-sm font-semibold text-slate-800">{name}</span>,
              address,
              pan_vat_number,
              contact_person,
              contact_number,
            ];

            if (showActions) {
              row.push(
                <TableRowActions>
                  {accessList.includes("edit") && (
                    <button
                      type="button"
                      onClick={() => handleNewButton(id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                      title="Edit supplier"
                    >
                      <MdEditSquare size={16} />
                    </button>
                  )}
                  {accessList.includes("delete") && (
                    <DeleteModal
                      compact
                      open={deleteModelOpen}
                      setOpen={setDeleteModelOpen}
                      itemId={id}
                      activeId={deleteId}
                      handleDeleteTrigger={() => handleDeleteTrigger(id)}
                      handleConfirmDelete={handleDelete}
                    />
                  )}
                </TableRowActions>,
              );
            }

            return row;
          },
        )
      : [];

  if (supplierDataLoading) {
    return <Spinner className="flex h-full items-center justify-center" />;
  }

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search suppliers..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Supplier"
        handleNewButton={() => handleNewButton(null)}
        handleReloadButton={() => refetch()}
        subText="Manage vendor details for purchase entries."
      />
      <PageFilterWrapper title="Supplier Filters">{Component}</PageFilterWrapper>
      {accessList.includes("view") ? (
      <Table
        headers={tableHeaders}
        data={tableData}
        isSN
        pagination={pagination}
        handlePagination={handlePagination}
      />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view suppliers.
        </div>
      )}
    </div>
  );
}
