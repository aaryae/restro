import React, { useMemo, useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import { useNavigate } from "react-router-dom";
import { BANK_ADD_ROUTE } from "@/routes/routeNames";
import { CurrencySign } from "@/constants";
import { SquarePen, ArrowLeftRight, Power, PowerOff } from "lucide-react";
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
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import TransferModel from "./TransferModel";
import { AccountFilterSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { checkAccess } from "@/utils/accessHelper";

const Account: React.FC = () => {
  const navigate = useNavigate();
  const accessList = checkAccess("Account");
  const transferAccess = checkAccess("Transfer");
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [patchApi] = usePatchApiMutation();
  const [deleteAccount] = useDeleteApiMutation();
  const [deleteModelOpen, setDeleteModelOpen] = React.useState<boolean>(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [transferOpen, setTransferOpen] = useState<boolean>(false);
  const [closeAccountId, setCloseAccountId] = useState<number | null>(null);
  const [pendingDeleteAfterTransfer, setPendingDeleteAfterTransfer] = useState<
    number | null
  >(null);

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

  const handleDeleteTrigger = (id: number, balance: number) => {
    if (balance > 0) {
      setPendingDeleteAfterTransfer(id);
      setCloseAccountId(id);
      setTransferOpen(true);
      return;
    }
    setDeleteId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async (idOverride?: number | null) => {
    const id = idOverride ?? deleteId;
    if (id == null) return;
    try {
      const res = await deleteAccount(`${ACCOUNT_URL}${id}`).unwrap();
      handleResponse({ res, onSuccess: () => refetch() });
    } catch (error) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
      setDeleteId(null);
      setPendingDeleteAfterTransfer(null);
    }
  };

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: zodResolver(AccountFilterSchema),
    defaultValues: {
      name: "",
      accountType: "",
    },
  });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const applyFilters = (qs: Record<string, any>) => {
    setFilters(
      Object.fromEntries(
        Object.entries(qs).filter(
          ([_, v]) => v !== undefined && v !== null && v !== "",
        ),
      ),
    );
    handlePagination({ page: 1, limit: query.limit });
  };

  const clearFilters = () => {
    reset({ name: "", accountType: "" });
    setFilters({});
    handlePagination({ page: 1, limit: query.limit });
  };

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
        Component: FilterSelect,
        control,
        className: "w-full",
        handleChange: (value: string) =>
          setValue("accountType", value as "" | "cash" | "bank" | "wallet"),
        options: [
          { label: "Any", value: "" },
          { label: "Cash", value: "cash" },
          { label: "Bank", value: "bank" },
          { label: "Wallet", value: "wallet" },
        ],
      },
    ],
    [control, setValue],
  );

  const { Component } = PageFilterSample(
    filterField,
    handleSubmit,
    applyFilters,
    clearFilters,
  );

  const url = buildQueryString("account/list", {
    page: query.page,
    limit: query.limit,
    search: filters,
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

  const headers = [
    "Name",
    "Type",
    "Balance",
    "Status",
    "Primary",
    (accessList.includes("edit") ||
      accessList.includes("edit-status") ||
      accessList.includes("delete")) &&
      "Actions",
  ].filter(Boolean) as string[];

  const showActions =
    accessList.includes("edit") ||
    accessList.includes("edit-status") ||
    accessList.includes("delete");

  const data =
    success && allAccount?.data?.data
      ? (allAccount?.data?.data as any[]).map((row: any) => {
          const balance = Number(row?.currentBalance) || 0;
          const deleteBlocked = Boolean(row?.isDefault);
          const needsTransfer = !deleteBlocked && balance > 0;
          const cells = [
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
            accessList.includes("edit-default") ? (
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
                      ? "Click to remove primary and hide from checkout"
                      : "Mark as primary and show in checkout"
                }
                disabled={row?.status !== "active"}
              >
                {row?.isDefault ? "Remove Primary" : "Make Primary"}
              </button>
            ) : (
              <span className="text-slate-500">
                {row?.isDefault ? "Primary" : "—"}
              </span>
            ),
          ];

          if (showActions) {
            cells.push(
              <TableRowActions>
                {accessList.includes("edit") && (
                  <button
                    type="button"
                    onClick={() => handleNewBank(row?.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                    title="Edit account"
                  >
                    <SquarePen size={16} />
                  </button>
                )}
                {accessList.includes("edit-status") && (
                  <button
                    type="button"
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${
                      row?.isDefault
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : row?.status === "active"
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                    onClick={() =>
                      !row?.isDefault && handleToggleStatus(row?.id)
                    }
                    title={
                      row?.isDefault
                        ? "Primary account cannot be deactivated"
                        : row?.status === "active"
                          ? "Deactivate account"
                          : "Activate account"
                    }
                    disabled={row?.isDefault}
                  >
                    {row?.status === "active" ? (
                      <PowerOff size={16} />
                    ) : (
                      <Power size={16} />
                    )}
                  </button>
                )}
                {accessList.includes("delete") && (
                  <DeleteModal
                    compact
                    open={deleteModelOpen}
                    setOpen={setDeleteModelOpen}
                    itemId={row?.id}
                    activeId={deleteId}
                    disabled={
                      deleteBlocked ||
                      (needsTransfer && !transferAccess.includes("add"))
                    }
                    disabledTitle={
                      deleteBlocked
                        ? "Primary account cannot be deleted"
                        : "Transfer all balance to another account before deleting"
                    }
                    description="Are you sure you want to delete this account? It will be removed from Cash and Banks."
                    handleDeleteTrigger={() => {
                      if (deleteBlocked) return;
                      if (
                        needsTransfer &&
                        !transferAccess.includes("add")
                      ) {
                        return;
                      }
                      handleDeleteTrigger(row?.id, balance);
                    }}
                    handleConfirmDelete={() => handleDelete()}
                  />
                )}
              </TableRowActions>,
            );
          }

          return cells;
        })
      : [];

  const closeTransferOpen = transferOpen && closeAccountId != null;
  const generalTransferOpen = transferOpen && closeAccountId == null;

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        title="Accounts"
        showSearch={false}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Account"
        handleNewButton={() => handleNewBank(null)}
        subText="Manage cash drawers, bank accounts, and wallet balances."
        extraActions={
          transferAccess.includes("add") ? (
            <button
              type="button"
              onClick={() => {
                setCloseAccountId(null);
                setPendingDeleteAfterTransfer(null);
                setTransferOpen(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <ArrowLeftRight size={16} />
              Transfer
            </button>
          ) : undefined
        }
      />

      <PageFilterWrapper title="Account Filters">{Component}</PageFilterWrapper>

      {isFetching ? (
        <Spinner className="flex h-full items-center justify-center" />
      ) : accessList.includes("view") ? (
        <Table
          isSN
          headers={headers}
          data={data}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view accounts.
        </div>
      )}

      <TransferModel
        isOpen={generalTransferOpen}
        onClose={() => setTransferOpen(false)}
        onSuccess={() => {
          setTransferOpen(false);
          refetch();
        }}
      />

      <TransferModel
        isOpen={closeTransferOpen}
        prefillFromAccountId={closeAccountId}
        transferFullBalance
        title="Transfer balance before delete"
        submitLabel="Transfer full balance"
        onClose={() => {
          setTransferOpen(false);
          setCloseAccountId(null);
          setPendingDeleteAfterTransfer(null);
        }}
        onSuccess={(result) => {
          setTransferOpen(false);
          setCloseAccountId(null);
          refetch();
          if (
            result?.emptiedSource &&
            pendingDeleteAfterTransfer != null &&
            pendingDeleteAfterTransfer === result.fromAccountId
          ) {
            setDeleteId(result.fromAccountId);
            setDeleteModelOpen(true);
          } else {
            setPendingDeleteAfterTransfer(null);
          }
        }}
      />
    </div>
  );
};

export default Account;
