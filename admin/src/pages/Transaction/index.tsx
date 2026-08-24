import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import { CurrencySign } from "@/constants";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import PageFilterSample from "@/components/PageFilterSample";
import { FilterInput } from "@/components/Input/filterInput";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import TransactionModal from "./TransactionModal";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const Transaction: React.FC = () => {
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [filters, setFilters] = useState<Record<string, any>>({});
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
    name?: string;
    userName?: string;
  }>({ defaultValues: { name: "", userName: "" } });

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
    reset({ name: "", userName: "" });
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
    applyFilters,
    clearFilters,
  );

  const url = buildQueryString("transaction/list", {
    page: query.page,
    limit: query.limit,
    search: filters,
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

  const headers = ["Date", "Account", "Type", "Amount", "User", "Remarks"];

  const data =
    success && allTransactions?.data?.data
      ? (allTransactions?.data?.data as any[]).map((row: any) => [
          new Date(row?.transactionDate).toLocaleDateString(),
          row?.account?.name,
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
              row?.type === "deposit"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
            }`}
          >
            {row?.type}
          </span>,
          <span className="font-semibold text-slate-800">
            {CurrencySign}
            {Number(row?.amount || 0).toFixed(2)}
          </span>,
          row?.user?.username,
          <span className="block max-w-full truncate" title={row?.remarks ?? ""}>
            {row?.remarks}
          </span>,
        ])
      : [];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        showSearch={false}
        subText="Record deposits and withdrawals across cash and bank accounts."
        extraActions={
          <>
            <button
              type="button"
              onClick={() => handleNewTransaction("withdraw")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[13px] font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <ArrowDownCircle size={15} />
              Withdrawal
            </button>
            <button
              type="button"
              onClick={() => handleNewTransaction("deposit")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <ArrowUpCircle size={15} />
              Deposit
            </button>
          </>
        }
      />

      <PageFilterWrapper title="Transaction Filters">{Component}</PageFilterWrapper>

      {isFetching ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading transactions...
        </div>
      ) : (
        <Table
          headers={headers}
          data={data}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        type={transactionType}
        onSuccess={() => {
          refetch();
          handleCloseModal();
        }}
      />
    </div>
  );
};

export default Transaction;
