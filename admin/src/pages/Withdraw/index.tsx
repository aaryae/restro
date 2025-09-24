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
import { MdEditSquare } from "react-icons/md";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import PageFilterSample from "@/components/PageFilterSample";
import { FilterInput } from "@/components/Input/filterInput";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import Spinner from "@/components/Spinner";
import { WITHDRAW_ADD_ROUTE } from "@/routes/routeNames";

const Withdraw: React.FC = () => {
  const navigate = useNavigate();
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [queryString, setQueryString] = useState<Record<string, any>>({});

  const handleNewWithdraw = () => {
    // For now, we'll handle this inline or navigate to a modal
    navigate(WITHDRAW_ADD_ROUTE); // Add this route when available
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

  const url = buildQueryString("withdraw/list", {
    page: query.page,
    limit: query.limit,
    search: queryString,
  });

  const {
    data: allWithdrawals,
    isSuccess: success,
    refetch,
    isFetching,
  } = useGetApiQuery({ url });

  const pagination: PaginationType = {
    page: allWithdrawals?.data?.page ?? 1,
    limit: allWithdrawals?.data?.limit ?? 10,
    total: allWithdrawals?.data?.total ?? 0,
    totalPages: allWithdrawals?.data?.totalPages ?? 0,
  };

  useEffect(() => {
    refetch();
  }, [queryString]);

  const headers = ["Account", "Amount", "User", "Date", "Remarks", "Actions"];

  const data =
    success && allWithdrawals?.data?.data
      ? (allWithdrawals?.data?.data as any[]).map((row: any, idx: number) => [
          row?.account?.name,
          `${CurrencySign}${Number(row?.amount || 0).toFixed(2)}`,
          row?.user?.username,
          new Date(row?.withdrawalDate).toLocaleDateString(),
          row?.remarks,
          <div
            className="flex items-center justify-center gap-3"
            key={`actions-${row?.id || idx}`}
          >
            <MdEditSquare
              size={18}
              className="text-[#0090DD] hover:text-blue-800 cursor-pointer"
              onClick={() => handleEditWithdraw(row?.id)}
              title="Edit"
            />
          </div>,
        ])
      : [];

  const handleEditWithdraw = (id: number) => {
    navigate(`${WITHDRAW_ADD_ROUTE}${id}`);
  };

  return (
    <>
      <PageTitle title="Withdrawals" />
      <div className="flex justify-end items-center gap-[1rem]">
        <PageHeader
          hasAddButton={true}
          newButtonText="New Withdrawal"
          handleNewButton={handleNewWithdraw}
          handleReloadButton={() => refetch()}
        />
      </div>
      <PageFilterWrapper title="Withdrawal Filters">
        {Component}
      </PageFilterWrapper>
      {isFetching ? (
        <Spinner className="flex justify-center items-center h-full" />
      ) : (
        <Table
          isSN
          headers={headers}
          data={data}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      )}
    </>
  );
};

export default Withdraw;
