import Drawer from "@/components/Drawer";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import ViewCustomer from "./ViewCustomer";
import AddEditCustomer from "./AddEditCustomer";
import { useForm } from "react-hook-form";
import { CustomerFilterSchema, CustomerFilterType } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import PageFilterSample from "@/components/PageFilterSample";
import usePagination from "@/hooks/usePagination";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import { FilterInput } from "@/components/Input/filterInput";
import { buildQueryString } from "@/utils/generalHelper";
import Spinner from "@/components/Spinner";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { CUSTOMER_URL } from "@/constants/apiUrlConstants";
import { UserRound, Mail, SquarePen } from "lucide-react";
import { checkAccess } from "@/utils/accessHelper";

export default function Customer() {
  const accessList = checkAccess("Customer");
  const [deleteModelOpen, setDeleteModelOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTable] = useDeleteApiMutation();

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const canAddCustomer =
    accessList.includes("add") || accessList.includes("edit");

  const { control, handleSubmit, reset } = useForm<CustomerFilterType>({
    resolver: zodResolver(CustomerFilterSchema),
    defaultValues: {
      firstName: "",
      email: "",
    },
  });

  const [queryString, setQueryString] = useState<Record<string, any>>({});

  const handleNewButton = (id: number | null) => {
    setEditCustomerId(id);
    setCustomerFormOpen(true);
  };

  const closeCustomerForm = () => {
    setCustomerFormOpen(false);
    setEditCustomerId(null);
    refetch();
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
        icon: <UserRound className="h-4 w-4" />,
      },
      {
        name: "email",
        label: "Email",
        Component: FilterInput,
        control,
        icon: <Mail className="h-4 w-4" />,
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

  const searchParams = searchTerm
    ? { isCombo: "true", phone: searchTerm }
    : queryString;

  const url = buildQueryString("customer-auth/list", {
    page: query.page,
    limit: query.limit,
    search: searchParams,
  });

  const {
    data: allCustomers,
    isSuccess: success,
    isLoading: customerDataLoading,
    refetch,
  } = useGetApiQuery({ url });

  useEffect(() => {
    refetch();
  }, [queryString, searchTerm]);

  useEffect(() => {
    if (!customerFormOpen) {
      setEditCustomerId(null);
    }
  }, [customerFormOpen]);

  const handleViewCustomer = (id: number) => {
    setCustomerId(id);
    setIsOpen(true);
  };

  const pagination = {
    page: allCustomers?.data?.total === 0 ? 0 : allCustomers?.data?.page,
    limit: allCustomers?.data?.limit ?? 10,
    total: allCustomers?.data?.total ?? 0,
    totalPages: allCustomers?.data?.totalPages ?? 1,
  };

  const tableHeaders = [
    "Full Name",
    "Email",
    "Mobile Number",
    "Created At",
    (accessList.includes("view-one") ||
      accessList.includes("edit") ||
      accessList.includes("delete")) &&
      "Actions",
  ].filter(Boolean) as string[];

  const showActions =
    accessList.includes("view-one") ||
    accessList.includes("edit") ||
    accessList.includes("delete");

  const tableData =
    success && allCustomers?.data?.data
      ? allCustomers?.data?.data.map(
          ({ id, firstName, lastName, email, mobileNo, createdAt }) => {
            const row = [
              <span className="text-sm font-semibold text-[var(--serve-fg)]">
                {`${firstName} ${lastName}`}
              </span>,
              email,
              mobileNo,
              format(new Date(createdAt), "MMM dd, yyyy"),
            ];

            if (showActions) {
              row.push(
                <TableRowActions>
                  {accessList.includes("view-one") && (
                    <button
                      type="button"
                      onClick={() => handleViewCustomer(id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] text-[var(--serve-muted)] transition hover:bg-[var(--serve-surface)] hover:text-[var(--serve-fg)]"
                      title="View customer"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  {accessList.includes("edit") && (
                    <button
                      type="button"
                      onClick={() => handleNewButton(id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--serve-accent)_28%,var(--serve-border))] bg-[color-mix(in_srgb,var(--serve-accent)_10%,var(--serve-surface))] text-[var(--serve-accent)] transition hover:bg-[color-mix(in_srgb,var(--serve-accent)_16%,var(--serve-surface))]"
                      title="Edit customer"
                    >
                      <SquarePen size={16} />
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

  if (customerDataLoading) {
    return <Spinner className="flex h-full items-center justify-center" />;
  }

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search by name, email, or phone..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={canAddCustomer}
        newButtonText="Add Customer"
        handleNewButton={() => handleNewButton(null)}
        subText="Manage guest profiles, contact details, and membership records."
      />
      <PageFilterWrapper title="Customer Filters">{Component}</PageFilterWrapper>
      {accessList.includes("view") ? (
      <Table
        headers={tableHeaders}
        data={tableData}
        isSN
        pagination={pagination}
        handlePagination={handlePagination}
      />
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--serve-border)] bg-[var(--serve-surface-2)] py-10 text-center text-[var(--serve-muted)]">
          You do not have permission to view customers.
        </div>
      )}
      <Drawer
        isOpen={customerFormOpen}
        setIsOpen={setCustomerFormOpen}
        width="w-full max-w-xl"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--serve-fg)]">
            {editCustomerId ? "Edit Customer" : "Add Customer"}
          </h2>
          <p className="mt-1 text-sm text-[var(--serve-muted)]">
            {editCustomerId
              ? "Update guest profile and contact details."
              : "Create a new guest profile for checkout and membership."}
          </p>
        </div>
        <AddEditCustomer
          isComponent
          editId={editCustomerId}
          closeModal={closeCustomerForm}
        />
      </Drawer>
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-full lg:w-[70%]">
        <ViewCustomer id={customerId} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Drawer>
    </div>
  );
}
