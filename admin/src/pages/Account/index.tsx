import React from "react";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import PageHeader from "@/components/PageHeader";
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
import { Button } from "react-aria-components";
import { BiTransfer } from "react-icons/bi";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import TransferModel from "./TransferModel";
import PaymentIntegrationsPanel from "./PaymentIntegrationsPanel";
import { AccountFilterSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";

const Account: React.FC = () => {
  const navigate = useNavigate();
  // delete supported
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [patchApi] = usePatchApiMutation();
  const [deleteAccount] = useDeleteApiMutation();
  const [deleteModelOpen, setDeleteModelOpen] = React.useState<boolean>(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);

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

  const handleMakeDefault = async (id: number) => {
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

  // Adapter to bridge react-hook-form's onChange to FilterSelect's handleChange
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
      // Placed Account Type as the last field so it appears at the far right on large screens
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

  // const handleReset = () => {
  //   reset({ accountName: "", accountType: "" });
  //   setFilters({});
  // };

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
    "S.N",
    "Name",
    "Type",
    "Balance",
    "Status",
    "Default",
    "Actions",
  ];

  const [transferOpen, setTransferOpen] = useState<boolean>(false);
  const [integrationsOpen, setIntegrationsOpen] = useState<boolean>(false);

  const data =
    success && allAccount?.data?.data
      ? (allAccount?.data?.data as any[]).map((row: any, idx: number) => {
          const sn =
            (allAccount?.data?.page - 1) * (allAccount?.data?.limit || 10) +
            idx +
            1;
          return [
            sn,
            row?.name || "-",
            row?.accountType || "-",
            row?.currentBalance != null
              ? `${CurrencySign}${Number(row.currentBalance)}`
              : "-",
            row?.status || "-",
            row?.isDefault ? (
              <span className="px-2 py-0.5 text-[12px] rounded bg-green-50 text-green-700 border border-green-300">
                Default
              </span>
            ) : (
              <button
                type="button"
                className={`px-2 py-0.5 text-[12px] rounded border ${row?.status !== "active" ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                onClick={() =>
                  row?.status === "active" && handleMakeDefault(row?.id)
                }
                title={
                  row?.status !== "active"
                    ? "Activate this account first to set it as default"
                    : "Make Default"
                }
                disabled={row?.status !== "active"}
              >
                Make Default
              </button>
            ),
            <div
              className="flex items-center justify-center gap-3"
              key={`actions-${row?.id || idx}`}
            >
              <div className="relative group">
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD] hover:text-blue-800 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleNewBank(row?.id || idx)}
                  title="Edit"
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                  Edit Account
                </span>
              </div>
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded border ${row?.isDefault ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                onClick={() => !row?.isDefault && handleToggleStatus(row?.id)}
                title={
                  row?.isDefault
                    ? "Default account cannot be deactivated"
                    : "Toggle Status"
                }
                disabled={row?.isDefault}
              >
                {row?.status === "active" ? "Deactivate" : "Activate"}
              </button>
              <div className="relative group">
                <DeleteModal
                  open={deleteModelOpen}
                  setOpen={setDeleteModelOpen}
                  handleDeleteTrigger={() =>
                    handleDeleteTrigger(row?.id || idx)
                  }
                  handleConfirmDelete={handleDelete}
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                  Delete Account
                </span>
              </div>
            </div>,
          ];
        })
      : [];

  return (
    <>
      <PageTitle title="Cash & Banks" />
      <div className="flex justify-end items-center gap-[1rem]">
        <PageHeader
          hasAddButton={true}
          newButtonText="Add Account"
          handleNewButton={() => handleNewBank(null)}
          handleReloadButton={() => refetch()}
        />

        <Button
          className="flex gap-2 bg-[#36a77d] text-white rounded-[0.25rem] px-[1.25rem] py-[0.5rem] mt-[4px]"
          onPress={() => setTransferOpen(true)}
        >
          <BiTransfer size={20} />
          Transfer
        </Button>

        <Button
          className="flex gap-2 bg-[#0090DD] text-white rounded-[0.25rem] px-[1.25rem] py-[0.5rem] mt-[4px]"
          onPress={() => setIntegrationsOpen(true)}
        >
          Payment Integrations
        </Button>
      </div>
      <PageFilterWrapper title="Bank Filters">{Component}</PageFilterWrapper>
      {isFetching ? (
        <Spinner className="flex justify-center items-center h-full" />
      ) : (
        <Table
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
      <PaymentIntegrationsPanel
        isOpen={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
      />
    </>
  );
};

export default Account;
