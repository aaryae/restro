import React, { useMemo, useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import { useNavigate } from "react-router-dom";
import { BANK_ADD_ROUTE } from "@/routes/routeNames";
import { CurrencySign } from "@/constants";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import PageFilterSample from "@/components/PageFilterSample";
import { FilterInput } from "@/components/Input/filterInput";
import { FilterSelect } from "@/components/Select/FilterSelect";
import { buildQueryString } from "@/utils/generalHelper";
import {
  useGetApiQuery,
  usePatchApiMutation,
  useDeleteApiMutation,
} from "@/redux/services/crudApi";
import Spinner from "@/components/Spinner";
import { BiTransfer } from "react-icons/bi";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import TransferModel from "./TransferModel";
import { AccountFilterSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const Account: React.FC = () => {
  const navigate = useNavigate();
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [patchApi] = usePatchApiMutation();
  const [deleteAccount] = useDeleteApiMutation();
  const [deleteModelOpen, setDeleteModelOpen] = React.useState<boolean>(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [transferOpen, setTransferOpen] = useState<boolean>(false);

  const handleNewBank = (id: number | null) => {
    id === null ? navigate(BANK_ADD_ROUTE) : navigate(`${BANK_ADD_ROUTE}${id}`);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await patchApi({
        url: `${ACCOUNT_URL}${id}/status`,
        body: {},
      }).unwrap();
      handleResponse({ res, onSuccess: () => refetch() });
    } catch (error) {
      handleError({ error });
    }
  };

  const handleTogglePrimary = async (id: number) => {
    try {
      const res = await patchApi({
        url: `${ACCOUNT_URL}${id}/default`,
        body: {},
      }).unwrap();
      handleResponse({ res, onSuccess: () => refetch() });
    } catch (error) {
      handleError({ error });
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await deleteAccount(`${ACCOUNT_URL}${deleteId}`).unwrap();
      handleResponse({ res, onSuccess: () => refetch() });
    } catch (error) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
    }
  };

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(AccountFilterSchema),
    defaultValues: {
      name: "",
      accountType: "",
    },
  });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const AccountTypeFilter: React.FC<any> = ({ value, onChange }) => (
    <FilterSelect
      label="Account Type"
      value={value}
      handleChange={onChange}
      options={[
        { label: "Cash", value: "cash" },
        { label: "Bank", value: "bank" },
        { label: "Wallet", value: "wallet" },
      ]}
    />
  );

  const filterField = useMemo(
    () => [
      {
        name: "name",
        label: "Account Name",
        Component: FilterInput,
        control,
      },
      {
        name: "accountType",
        label: "Account Type",
        Component: AccountTypeFilter,
        control,
        className: "lg:col-start-4",
      },
    ],
    [control],
  );

  const { Component } = PageFilterSample(
    filterField,
    handleSubmit,
    (qs: Record<string, any>) => {
      setFilters(
        Object.fromEntries(
          Object.entries(qs).filter(
            ([_, v]) => v !== undefined && v !== null && v !== "",
          ),
        ),
      );
    },
    reset,
  );

  const url = buildQueryString("account/list", {
    page: query.page,
    limit: query.limit,
    search: {
      ...filters,
      ...(searchTerm ? { name: searchTerm } : {}),
    },
  });

  const {
    data: allAccount,
    isSuccess: success,
    refetch,
    isFetching,
  } = useGetApiQuery({ url });

  const pagination: PaginationType = {
    page: allAccount?.data?.page,
    limit: allAccount?.data?.limit,
    total: allAccount?.data?.total,
    totalPages: allAccount?.data?.totalPages,
  };

  const headers = ["Name", "Type", "Balance", "Status", "Primary", "Actions"];

  const data =
    success && allAccount?.data?.data
      ? (allAccount?.data?.data as any[]).map((row: any) => [
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            {row?.name || "-"}
            {row?.isDefault ? (
              <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200">
                Primary
              </span>
            ) : null}
          </span>,
          <span className="capitalize text-slate-600">
            {row?.accountType || "-"}
          </span>,
          <span className="font-semibold text-slate-800">
            {row?.currentBalance != null
              ? `${CurrencySign}${Number(row.currentBalance)}`
              : "-"}
          </span>,
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
              row?.status === "active"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {row?.status || "-"}
          </span>,
          <button
            type="button"
            className={`h-8 rounded-lg border px-2.5 text-[11px] font-medium transition ${
              row?.status !== "active"
                ? "cursor-not-allowed border-slate-200 text-slate-400 opacity-50"
                : row?.isDefault
                  ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
            onClick={() =>
              row?.status === "active" && handleTogglePrimary(row?.id)
            }
            title={
              row?.status !== "active"
                ? "Activate this account first to mark it as primary"
                : row?.isDefault
                  ? "Remove from checkout payment options"
                  : "Show in checkout payment options"
            }
            disabled={row?.status !== "active"}
          >
            {row?.isDefault ? "Primary" : "Make Primary"}
          </button>,
          <TableRowActions>
            <button
              type="button"
              onClick={() => handleNewBank(row?.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
              title="Edit account"
            >
              <MdEditSquare size={16} />
            </button>
            <button
              type="button"
              className={`inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-[11px] font-medium transition ${
                row?.isDefault
                  ? "cursor-not-allowed border-slate-200 text-slate-400 opacity-50"
                  : row?.status === "active"
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
              onClick={() => !row?.isDefault && handleToggleStatus(row?.id)}
              title={
                row?.isDefault
                  ? "Primary account cannot be deactivated"
                  : "Toggle status"
              }
              disabled={row?.isDefault}
            >
              {row?.status === "active" ? "Deactivate" : "Activate"}
            </button>
            <DeleteModal
              compact
              open={deleteModelOpen}
              setOpen={setDeleteModelOpen}
                  itemId={row?.id}
                  activeId={deleteId}
              handleDeleteTrigger={() => handleDeleteTrigger(row?.id)}
              handleConfirmDelete={handleDelete}
            />
          </TableRowActions>,
        ])
      : [];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search accounts..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton
        newButtonText="Add Account"
        handleNewButton={() => handleNewBank(null)}
        handleReloadButton={() => refetch()}
        subText="Manage cash drawers, bank accounts, and wallet balances."
        extraActions={
          <button
            type="button"
            onClick={() => setTransferOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <BiTransfer size={16} />
            Transfer
          </button>
        }
      />

      <PageFilterWrapper title="Account Filters">{Component}</PageFilterWrapper>

      {isFetching ? (
        <Spinner className="flex h-full items-center justify-center" />
      ) : (
        <Table
          isSN
          headers={headers}
          data={data}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      )}

      <TransferModel
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSuccess={() => {
          setTransferOpen(false);
          refetch();
        }}
      />
    </div>
  );
};

export default Account;
