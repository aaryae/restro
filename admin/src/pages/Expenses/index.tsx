import React, { useMemo, useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import FinanceQuickDateChips from "@/components/FinanceQuickDateChips";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { CurrencySign } from "@/constants";
import { useNavigate } from "react-router-dom";
import { EXPENSE_ADD_ROUTE } from "@/routes/routeNames";
import { SquarePen } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { EXPENSE_URL } from "@/constants/apiUrlConstants";
import { format, subDays } from "date-fns";
import { ADToBS } from "bikram-sambat-js";
import { handleError, handleResponse } from "@/utils/responseHandler";
import PageFilterSample from "@/components/PageFilterSample";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import DateInput from "@/components/DateInput";
import { FilterSelect } from "@/components/Select/FilterSelect";
import { ExpenseFilterSchema, type ExpenseFilterInput } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { checkAccess } from "@/utils/accessHelper";

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const accessList = checkAccess("Expense");
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null,
  );

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
    [control, getValues],
  );

  const { Component } = PageFilterSample(
    filterFields,
    handleSubmit,
    (query: Record<string, any>) => setFilters(query),
    () => {
      reset();
      setFilters({});
      setSelectedDateFilter(null);
    },
  );

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const getDateParams = () => {
    let dateStr = "";
    if (filters.date) {
      const date =
        filters.date instanceof Date ? filters.date : new Date(filters.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      dateStr = `${year}-${month}-${day}`;
    } else if (selectedDateFilter) {
      const today = new Date();
      const date =
        selectedDateFilter === "yesterday" ? subDays(today, 1) : today;
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
    params.append("page", String(query.page));
    params.append("limit", String(query.limit));

    const dateStr = getDateParams();
    if (dateStr) {
      params.append("date", dateStr);
    }
    if (filters.cash_or_credit) {
      params.append("cash_or_credit", filters.cash_or_credit);
    }

    return `${baseUrl}?${params.toString()}`;
  }, [filters, query.page, query.limit, selectedDateFilter]);

  const [deleteExpense] = useDeleteApiMutation();

  const {
    data: apiData,
    isSuccess: success,
    refetch,
  } = useGetApiQuery({ url });

  const pagination: PaginationType = {
    page: apiData?.data?.total === 0 ? 0 : apiData?.data?.page,
    limit: apiData?.data?.limit ?? query.limit,
    total: apiData?.data?.total ?? 0,
    totalPages: apiData?.data?.totalPages ?? 1,
  };

  const showActions =
    accessList.includes("edit") || accessList.includes("delete");

  const headers = [
    "S.N",
    "Date (AD)",
    "Date (BS)",
    "Remarks",
    "Category",
    "Amount",
    "Cash or Credit",
    "Payment Method",
    "Payment Source",
    (showActions) && "Actions",
  ].filter(Boolean) as string[];

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
    ? apiData?.data?.data?.map((expense: any, index: number) => {
        const row = [
        index + 1 + ((pagination.page || 1) - 1) * (pagination.limit || 10),
        format(expense.createdAt, "yyyy-MM-dd"),
        ADToBS(expense.createdAt),
        <span className="block max-w-full truncate" title={expense?.remarks ?? ""}>
          {expense?.remarks}
        </span>,
        expense?.category?.name,
        <span className="font-semibold text-slate-800">
          {CurrencySign}
          {expense?.amount}
        </span>,
        expense?.cash_or_credit,
        expense?.paymentMethod,
        expense?.account?.name,
        ];

        if (showActions) {
          row.push(
            <TableRowActions>
              {accessList.includes("edit") && (
                <button
                  type="button"
                  onClick={() => handleNewExpense(expense?.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                  title="Edit expense"
                >
                  <SquarePen size={16} />
                </button>
              )}
              {accessList.includes("delete") && (
                <DeleteModal
                  compact
                  open={open}
                  setOpen={setOpen}
                  itemId={expense?.id}
                  activeId={deleteId}
                  handleDeleteTrigger={() => handleDeleteTrigger(expense?.id)}
                  handleConfirmDelete={handleDelete}
                />
              )}
            </TableRowActions>,
          );
        }

        return row;
      })
    : [];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        showSearch={false}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Expense"
        handleNewButton={() => handleNewExpense(null)}
        subText="Record and filter daily operating expenses."
        filters={
          <FinanceQuickDateChips
            selected={selectedDateFilter}
            onSelect={(value) => {
              setSelectedDateFilter(value);
              setValue("date", undefined as any);
            }}
            onClear={() => setSelectedDateFilter(null)}
          />
        }
      />

      <PageFilterWrapper title="Expense Filters">{Component}</PageFilterWrapper>

      {accessList.includes("view") ? (
      <>
      <Table
        headers={headers}
        data={data}
        pagination={pagination}
        handlePagination={(p) =>
          handlePagination({ ...p, total: apiData?.data?.total ?? 0 })
        }
      />
      <div className="mt-4 flex justify-end">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-[13px] font-medium text-slate-600">
            Grand Total:{" "}
          </span>
          <span className="text-lg font-semibold text-slate-800">
            {CurrencySign}
            {Number(apiData?.data?.grandTotal ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
      </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view expenses.
        </div>
      )}
    </div>
  );
};

export default Expenses;
