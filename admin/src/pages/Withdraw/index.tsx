import React from "react";
import { useForm } from "react-hook-form";
import { useMemo, useEffect, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import PageHeader from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { CurrencySign } from "@/constants";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import PageFilterSample from "@/components/PageFilterSample";
import { FilterInput } from "@/components/Input/filterInput";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import Spinner from "@/components/Spinner";
import Button from "@/components/Button";
import TransactionModal from "./TransactionModal";

const Transaction: React.FC = () => {
  const navigate = useNavigate();
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [queryString, setQueryString] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "deposit" | "withdraw"
  >("deposit");

  const handleNewTransaction = (type: "deposit" | "withdraw") => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const { control, handleSubmit, reset } = useForm<{
    accountName?: string;
    userName?: string;
  }>({ defaultValues: { accountName: "", userName: "" } });

  const filterField = useMemo(
    () => [
      {
        name: "accountName",
        label: "Account Name",
        Component: FilterInput,
        control,
      },
      {
        name: "userName",
        label: "User Name",
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
    () => {
      reset({ accountName: "", userName: "" });
      setQueryString({});
      handlePagination({ page: 1, limit: query.limit });
    },
  );

  const url = buildQueryString("transaction/list", {
    page: query.page,
    limit: query.limit,
    search: queryString,
  });

  const {
    data: allTransactions,
    isSuccess: success,
    refetch,
    isFetching,
  } = useGetApiQuery({ url });

  const pagination: PaginationType = {
    page: allTransactions?.data?.page ?? 1,
    limit: allTransactions?.data?.limit ?? 10,
    total: allTransactions?.data?.total ?? 0,
    totalPages: allTransactions?.data?.totalPages ?? 0,
  };

  useEffect(() => {
    refetch();
  }, [queryString]);

  const headers = ["Account", "Type", "Amount", "User", "Date", "Remarks"];

  const data =
    success && allTransactions?.data?.data
      ? (allTransactions?.data?.data as any[]).map((row: any) => [
          row?.account?.name,
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              row?.type === "deposit"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {row?.type?.charAt(0).toUpperCase() + row?.type?.slice(1)}
          </span>,
          `${CurrencySign}${Number(row?.amount || 0).toFixed(2)}`,
          row?.user?.username,
          new Date(row?.transactionDate).toLocaleDateString(),
          row?.remarks,
        ])
      : [];

  return (
    <>
      <PageTitle title="Transactions" />
      <div className="flex justify-end items-center gap-[1rem]">
        <Button
          className="flex gap-2 bg-[#36a77d] text-white rounded-[0.25rem] px-[1.25rem] py-[0.5rem] mt-[4px]"
          handleClick={() => handleNewTransaction("withdraw")}
        >
          New Withdrawal
        </Button>
        <Button
          className="flex gap-2 bg-[#36a77d] text-white rounded-[0.25rem] px-[1.25rem] py-[0.5rem] mt-[4px]"
          handleClick={() => handleNewTransaction("deposit")}
        >
          New Deposit
        </Button>
        <PageHeader hasAddButton={false} handleReloadButton={() => refetch()} />
      </div>
      <PageFilterWrapper title="Transaction Filters">
        {Component}
      </PageFilterWrapper>
      <Table
        headers={headers}
        data={data}
        pagination={pagination}
        handlePagination={handlePagination}
        isLoading={isFetching}
      />
      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        type={transactionType}
        onSuccess={() => {
          refetch();
          handleCloseModal();
        }}
      />
    </>
  );
};

export default Transaction;
