import React from "react";
import { useForm } from "react-hook-form";
import { useMemo, useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import PageHeader from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { BANK_ADD_ROUTE } from "@/routes/routeNames";
import { CurrencySign } from "@/constants";
import { MdEditSquare } from "react-icons/md";
// import DeleteModal from "@/components/DeleteModal";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import PageFilterSample from "@/components/PageFilterSample";
import { FilterInput } from "@/components/Input/filterInput";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery, usePatchApiMutation } from "@/redux/services/crudApi";
import Spinner from "@/components/Spinner";
import { Button } from "react-aria-components";
import { BiTransfer } from "react-icons/bi";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import TransferModel from "./TransferModel";

const Account: React.FC = () => {
  const navigate = useNavigate();
  // delete supported
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [queryString, setQueryString] = useState<Record<string, any>>({});
  const [patchApi] = usePatchApiMutation();
  // const [deleteAccount] = useDeleteApiMutation();
  // const [open, setOpen] = React.useState<boolean>(false);
  // const [deleteId, setDeleteId] = React.useState<number | null>(null);

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

  const { control, handleSubmit } = useForm<{
    bankName?: string;
    accountNumber?: string;
  }>();

  const filterField = useMemo(
    () => [
      {
        name: "bankName",
        label: "Bank Name",
        Component: FilterInput,
        control,
      },
      {
        name: "accountNumber",
        label: "Account Number",
        Component: FilterInput,
        control,
      },
    ],
    [control],
  );

  const { Component } = PageFilterSample(
    filterField,
    handleSubmit,
    (qs: Record<string, any>) => setQueryString(qs),
  );

  const url = buildQueryString("account/list", {
    page: query.page,
    limit: query.limit,
  });

  const {
    data: allAccount,
    isSuccess: success,
    refetch,
    isFetching,
  } = useGetApiQuery({ url });

  const pagination: PaginationType = {
    page: allAccount?.data?.page ?? 1,
    limit: allAccount?.data?.limit ?? 10,
    total: allAccount?.data?.total ?? 0,
    totalPages: allAccount?.data?.totalPages ?? 0,
  };

  useEffect(() => {
    refetch();
  }, [queryString]);

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
              <MdEditSquare
                size={18}
                className="text-[#0090DD] hover:text-blue-800 cursor-pointer"
                onClick={() => handleNewBank(row?.id || idx)}
                title="Edit"
              />
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
              {/* <button
                type="button"
                className={`px-2 py-1 text-xs rounded border ${row?.isDefault ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50 border-red-400 text-red-600"}`}
                onClick={() => !row?.isDefault && handleDeleteTrigger(row?.id)}
                title={
                  row?.isDefault
                    ? "Default account cannot be deleted"
                    : "Delete Account"
                }
                disabled={row?.isDefault}
              >
                Delete
              </button> */}
              {/* <DeleteModal
                open={open}
                setOpen={setOpen}
                handleDeleteTrigger={() => handleDeleteTrigger(row?.id || idx)}
                handleConfirmDelete={handleDelete}
              /> */}
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
          className="flex gap-2 bg-purple-600 text-white rounded-[0.25rem] px-[1.25rem] py-[0.5rem] mt-[4px]"
          onPress={() => setTransferOpen(true)}
        >
          <BiTransfer size={20} />
          Transfer
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
    </>
  );
};

export default Account;
