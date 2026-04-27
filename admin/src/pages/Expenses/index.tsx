import React, { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { CurrencySign } from "@/constants";
import { useNavigate } from "react-router-dom";
import { EXPENSE_ADD_ROUTE } from "@/routes/routeNames";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { EXPENSE_URL } from "@/constants/apiUrlConstants";
import { format } from "date-fns";
import { ADToBS } from "bikram-sambat-js";
import { handleError, handleResponse } from "@/utils/responseHandler";
import PageFilterSample from "@/components/PageFilterSample";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import DateInput from "@/components/DateInput";
import { FilterSelect } from "@/components/Select/FilterSelect";
import { subDays } from "date-fns";
import { ExpenseFilterSchema, type ExpenseFilterInput } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>("today");

  // Filters form
  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<ExpenseFilterInput>({
      resolver: zodResolver(ExpenseFilterSchema),
      defaultValues: {
        date: undefined as any,
        cash_or_credit: "",
      },
    });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleDateChange = (value: Date) => {
    setValue("date", value);
    setSelectedDateFilter(null);
  };

  const filterFields = useMemo(
    () => [
      {
        name: "date",
        label: "Date",
        Component: DateInput,
        control,
        handleChange: handleDateChange,
        value: getValues("date"),
      },
      {
        name: "cash_or_credit",
        label: "Payment Method",
        Component: FilterSelect,
        className: "w-full",
        handleChange: (v: string) => setValue("cash_or_credit", v as any),
        options: [
          { label: "Any", value: "" },
          { label: "Cash", value: "cash" },
          { label: "Credit", value: "credit" },
        ],
        control,
      },
    ],
    [control, getValues]
  );

  const { Component } = PageFilterSample(
    filterFields,
    handleSubmit,
    (query: Record<string, any>) => setFilters(query),
    reset
  );

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const getDateParams = () => {
    let dateStr = "";
    if (filters.date) {
      const date = filters.date instanceof Date ? filters.date : new Date(filters.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dateStr = `${year}-${month}-${day}`;
    } else if (selectedDateFilter) {
      const today = new Date();
      const date = selectedDateFilter === "yesterday" ? subDays(today, 1) : today;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dateStr = `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const url = useMemo(() => {
    const baseUrl = `${EXPENSE_URL}list`;
    const params = new URLSearchParams();
    params.append('page', String(query.page));
    params.append('limit', String(query.limit));
    
    const dateStr = getDateParams();
    if (dateStr) {
      params.append('date', dateStr);
    }
    if (filters.cash_or_credit) {
      params.append('cash_or_credit', filters.cash_or_credit);
    }
    
    return `${baseUrl}?${params.toString()}`;
  }, [filters, query.page, query.limit, selectedDateFilter]);

  const [deleteExpense] = useDeleteApiMutation();

  const { data: apiData, isSuccess: success, refetch } = useGetApiQuery({ url });

  const pagination: PaginationType = {
    page: apiData?.data?.total === 0 ? 0 : apiData?.data?.page,
    limit: apiData?.data?.limit ?? query.limit,
    total: apiData?.data?.total ?? 0,
    totalPages: apiData?.data?.totalPages ?? 1,
  };

  const headers = [
    "Expense ID",
    "Date (AD)",
    "Date (BS)",
    "Remarks",
    "Category",
    "Amount",
    "Cash or Credit",
    "Payment Source ID",
    "Actions",
  ];

  const handleNewExpense = (id: number | null) => {
    if (id === null) {
      navigate(EXPENSE_ADD_ROUTE);
    } else {
      navigate(`${EXPENSE_ADD_ROUTE}${id}`);
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteExpense(
        `${EXPENSE_URL}${deleteId}`,
      ).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const data = success
    ? apiData?.data?.data?.map((expense) => [
        expense?.id,
        format(expense.createdAt, "yyyy-MM-dd"),
        ADToBS(expense.createdAt),
        expense?.remarks,
        expense?.category?.name,
        CurrencySign + expense?.amount,
        expense?.cash_or_credit,
        expense?.account?.name,
        <div
          className="flex items-center justify-center gap-3"
          key={`act-${expense?.id}`}
        >
          <div className="relative group">
            <MdEditSquare
              size={18}
              className="text-[#0090DD] hover:text-blue-800 hover:cursor-pointer"
              onClick={() => handleNewExpense(expense?.id)}
            />
            <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
              Edit Expense
            </span>
          </div>
          <div className="relative group">
            <DeleteModal
              open={open}
              setOpen={setOpen}
              handleDeleteTrigger={() => handleDeleteTrigger(expense?.id)}
              handleConfirmDelete={handleDelete}
            />
            <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
              Delete Expense
            </span>
          </div>
        </div>,
      ])
    : [];

  return (
    <>
      <PageTitle title="Expenses" />
      <PageHeader
        hasAddButton={true}
        newButtonText="Add Expense"
        handleNewButton={() => handleNewExpense(null)}
        handleReloadButton={() => refetch()}
        hasSubText={false}
      />
      
      {/* Quick Date Filters */}
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="text-sm font-medium text-gray-700">Quick Date:</span>
        {[
          { label: "Yesterday", value: "yesterday" },
          { label: "Today", value: "today" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setSelectedDateFilter(item.value);
              setValue("date", undefined as any);
            }}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              selectedDateFilter === item.value
                ? "bg-primaryColor text-white"
                : "border border-primaryColor text-primaryColor bg-white hover:bg-blue-50"
            }`}
          >
            {item.label}
          </button>
        ))}
        {selectedDateFilter && (
          <button
            type="button"
            onClick={() => {
              setSelectedDateFilter(null);
            }}
            className="px-2 py-1 text-sm text-red-500 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <PageFilterWrapper title="Expense Filters">
        {Component}
      </PageFilterWrapper>

      <Table
        headers={headers}
        data={data}
        pagination={pagination}
        handlePagination={(p) =>
          handlePagination({ ...p, total: apiData?.data?.total ?? 0 })
        }
      />
    </>
  );
};

export default Expenses;