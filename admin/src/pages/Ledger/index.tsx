import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { format, subDays } from "date-fns";
import { FileDown, FileSpreadsheet } from "lucide-react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import PageFilterWrapper from "@/components/PageFilterWrapper";
import PageFilterSample from "@/components/PageFilterSample";
import FinanceQuickDateChips from "@/components/FinanceQuickDateChips";
import DateInput from "@/components/DateInput";
import { FilterSelect } from "@/components/Select/FilterSelect";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { CurrencySign } from "@/constants";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import { buildQueryString } from "@/utils/generalHelper";
import {
  useGetApiQuery,
  useLazyGetApiQuery,
} from "@/redux/services/crudApi";
import { checkAccess, checkViewAccessList } from "@/utils/accessHelper";
import { exportToExcel, exportToPdf } from "@/utils/singleExport";

type LedgerFilters = {
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  direction?: string;
  category?: string;
  accountType?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  revenue: "Revenue",
  expense: "Expense",
  purchase: "Purchase",
  deposit: "Deposit",
  withdraw: "Withdrawal",
  transfer: "Transfer",
};

const EXPORT_HEADERS = [
  "S/N",
  "Date",
  "Account",
  "Account Type",
  "Category",
  "Direction",
  "Amount",
  "Details",
  "User",
  "Remarks",
];

const categoryBadgeClass = (category: string) => {
  switch (category) {
    case "revenue":
    case "deposit":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "expense":
    case "withdraw":
    case "purchase":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "transfer":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-200";
  }
};

const mapExportRows = (rows: any[]) =>
  rows.map((row, index) => [
    String(index + 1),
    row?.entryDate ? new Date(row.entryDate).toLocaleString() : "-",
    row?.account?.name || "-",
    row?.account?.accountType || "-",
    CATEGORY_LABELS[row?.category] || row?.category || "-",
    row?.direction === "in" ? "In" : "Out",
    `${row?.direction === "in" ? "+" : "-"}${CurrencySign}${Number(row?.amount || 0).toFixed(2)}`,
    row?.reference || row?.counterpartyAccount?.name || "-",
    row?.user?.name || row?.user?.username || "-",
    row?.remarks || "-",
  ]);

const Ledger: React.FC = () => {
  const viewAccess = checkViewAccessList();
  const ledgerAccess = checkAccess("Ledger");
  const canView =
    ledgerAccess.includes("view") ||
    viewAccess.includes("Ledger") ||
    viewAccess.includes("Company Settings");
  const { query, handlePagination } = usePagination({ page: 1, limit: 20 });
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    "today",
  );
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<LedgerFilters>({
      defaultValues: {
        startDate: undefined,
        endDate: undefined,
        accountId: "",
        direction: "",
        category: "",
        accountType: "",
      },
    });

  const { data: accountsRes } = useGetApiQuery({
    url: buildQueryString(`${ACCOUNT_URL}list`, { page: 1, limit: 200 }),
  });
  const [fetchLedgerExport] = useLazyGetApiQuery();

  const accountOptions = useMemo(() => {
    const rows = accountsRes?.data?.data || [];
    return [
      { label: "All accounts", value: "" },
      ...rows.map((acc: any) => ({
        label: `${acc.name} (${acc.accountType})`,
        value: String(acc.id),
      })),
    ];
  }, [accountsRes]);

  const getDateParams = () => {
    if (filters.startDate || filters.endDate) {
      const start =
        filters.startDate instanceof Date
          ? filters.startDate
          : filters.startDate
            ? new Date(filters.startDate)
            : null;
      const end =
        filters.endDate instanceof Date
          ? filters.endDate
          : filters.endDate
            ? new Date(filters.endDate)
            : start;
      return {
        startDate: start ? format(start, "yyyy-MM-dd") : undefined,
        endDate: end ? format(end, "yyyy-MM-dd") : undefined,
      };
    }

    if (selectedDateFilter === "today") {
      const today = format(new Date(), "yyyy-MM-dd");
      return { startDate: today, endDate: today };
    }
    if (selectedDateFilter === "yesterday") {
      const day = format(subDays(new Date(), 1), "yyyy-MM-dd");
      return { startDate: day, endDate: day };
    }
    if (selectedDateFilter === "last7") {
      return {
        startDate: format(subDays(new Date(), 6), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
      };
    }
    if (selectedDateFilter === "last30") {
      return {
        startDate: format(subDays(new Date(), 29), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
      };
    }

    return {};
  };

  const filterFields = useMemo(
    () => [
      {
        name: "startDate",
        label: "From",
        Component: DateInput,
        control,
        handleChange: (value: Date) => {
          setValue("startDate", value);
          setSelectedDateFilter(null);
        },
        value: getValues("startDate"),
      },
      {
        name: "endDate",
        label: "To",
        Component: DateInput,
        control,
        handleChange: (value: Date) => {
          setValue("endDate", value);
          setSelectedDateFilter(null);
        },
        value: getValues("endDate"),
      },
      {
        name: "accountId",
        label: "Account",
        Component: FilterSelect,
        className: "w-full",
        handleChange: (v: string) => setValue("accountId", v),
        options: accountOptions,
        control,
      },
      {
        name: "accountType",
        label: "Account Type",
        Component: FilterSelect,
        className: "w-full",
        handleChange: (v: string) => setValue("accountType", v),
        options: [
          { label: "All types", value: "" },
          { label: "Cash", value: "cash" },
          { label: "Bank", value: "bank" },
          { label: "Wallet", value: "wallet" },
        ],
        control,
      },
      {
        name: "direction",
        label: "Direction",
        Component: FilterSelect,
        className: "w-full",
        handleChange: (v: string) => setValue("direction", v),
        options: [
          { label: "All", value: "" },
          { label: "Money In", value: "in" },
          { label: "Money Out", value: "out" },
        ],
        control,
      },
      {
        name: "category",
        label: "Category",
        Component: FilterSelect,
        className: "w-full",
        handleChange: (v: string) => setValue("category", v),
        options: [
          { label: "All", value: "" },
          { label: "Revenue", value: "revenue" },
          { label: "Expense", value: "expense" },
          { label: "Purchase", value: "purchase" },
          { label: "Deposit", value: "deposit" },
          { label: "Withdrawal", value: "withdraw" },
          { label: "Transfer", value: "transfer" },
        ],
        control,
      },
    ],
    [control, getValues, accountOptions, setValue],
  );

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
    reset({
      startDate: undefined,
      endDate: undefined,
      accountId: "",
      direction: "",
      category: "",
      accountType: "",
    });
    setFilters({});
    setSelectedDateFilter("today");
    handlePagination({ page: 1, limit: query.limit });
  };

  const { Component } = PageFilterSample(
    filterFields,
    handleSubmit,
    applyFilters,
    clearFilters,
  );

  const dateParams = getDateParams();

  const listQueryParams = {
    ...dateParams,
    ...(filters.accountId ? { accountId: filters.accountId } : {}),
    ...(filters.accountType ? { accountType: filters.accountType } : {}),
    ...(filters.direction ? { direction: filters.direction } : {}),
    ...(filters.category ? { category: filters.category } : {}),
  };

  const url = buildQueryString("ledger/list", {
    page: query.page,
    limit: query.limit,
    ...listQueryParams,
  });

  const {
    data: ledgerRes,
    isSuccess: success,
    refetch,
    isFetching,
  } = useGetApiQuery({ url }, { skip: !canView });

  const pagination: PaginationType = {
    page: ledgerRes?.data?.page ?? 1,
    limit: ledgerRes?.data?.limit ?? 20,
    total: ledgerRes?.data?.total ?? 0,
    totalPages: ledgerRes?.data?.totalPages ?? 0,
  };

  const summary = ledgerRes?.data?.summary;
  const serialStart =
    ((pagination.page || 1) - 1) * (pagination.limit || 20);

  const headers = [
    "S/N",
    "Date",
    "Account",
    "Category",
    "Direction",
    "Amount",
    "Details",
    "User",
    "Remarks",
  ];

  const data =
    success && ledgerRes?.data?.data
      ? (ledgerRes.data.data as any[]).map((row, index) => [
          serialStart + index + 1,
          row?.entryDate
            ? new Date(row.entryDate).toLocaleString()
            : "-",
          <div className="min-w-0">
            <div className="font-medium text-slate-800">
              {row?.account?.name || "-"}
            </div>
            <div className="text-[11px] capitalize text-slate-500">
              {row?.account?.accountType || ""}
            </div>
          </div>,
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${categoryBadgeClass(row?.category)}`}
          >
            {CATEGORY_LABELS[row?.category] || row?.category}
          </span>,
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              row?.direction === "in"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
            }`}
          >
            {row?.direction === "in" ? "In" : "Out"}
          </span>,
          <span
            className={`font-semibold ${
              row?.direction === "in" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {row?.direction === "in" ? "+" : "-"}
            {CurrencySign}
            {Number(row?.amount || 0).toFixed(2)}
          </span>,
          <span
            className="block max-w-[180px] truncate text-slate-600"
            title={row?.reference || row?.counterpartyAccount?.name || ""}
          >
            {row?.reference ||
              (row?.counterpartyAccount?.name
                ? row.counterpartyAccount.name
                : "-")}
          </span>,
          row?.user?.name || row?.user?.username || "-",
          <span
            className="block max-w-[200px] truncate"
            title={row?.remarks || ""}
          >
            {row?.remarks || "-"}
          </span>,
        ])
      : [];

  const handleDownload = async (type: "pdf" | "excel") => {
    try {
      setExporting(type);
      const exportUrl = buildQueryString("ledger/list", {
        page: 1,
        limit: 5000,
        ...listQueryParams,
      });
      const result = await fetchLedgerExport({ url: exportUrl }).unwrap();
      const rows = (result?.data?.data || []) as any[];
      const exportSummary = result?.data?.summary;
      const exportData = mapExportRows(rows);
      const title = `Cash-Bank-Ledger-${format(new Date(), "yyyy-MM-dd")}`;
      const summaryLines = [
        `Money In: ${CurrencySign}${Number(exportSummary?.moneyIn || 0).toFixed(2)}`,
        `Money Out: ${CurrencySign}${Number(exportSummary?.moneyOut || 0).toFixed(2)}`,
        `Net: ${CurrencySign}${Number(exportSummary?.net || 0).toFixed(2)}`,
        `Exported: ${new Date().toLocaleString()}`,
      ];

      if (type === "excel") {
        exportToExcel({
          title,
          headers: EXPORT_HEADERS,
          data: exportData,
        });
      } else {
        exportToPdf({
          title: "Cash & Bank Ledger",
          headers: EXPORT_HEADERS,
          data: exportData,
          summaryLines,
        });
      }
    } catch (error) {
      console.error("Ledger export failed", error);
    } finally {
      setExporting(null);
    }
  };

  if (!canView) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        You do not have permission to view the cash &amp; bank ledger.
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        showSearch={false}
        handleReloadButton={() => refetch()}
        subText="Watch every cash and bank money movement — inflows, outflows, and transfers."
      />

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3">
          <div className="text-[12px] font-medium text-emerald-700">
            Money In
          </div>
          <div className="mt-1 text-lg font-semibold text-emerald-800">
            {CurrencySign}
            {Number(summary?.moneyIn || 0).toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border border-rose-100 bg-rose-50/60 px-4 py-3">
          <div className="text-[12px] font-medium text-rose-700">Money Out</div>
          <div className="mt-1 text-lg font-semibold text-rose-800">
            {CurrencySign}
            {Number(summary?.moneyOut || 0).toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[12px] font-medium text-slate-600">Net</div>
          <div
            className={`mt-1 text-lg font-semibold ${
              Number(summary?.net || 0) >= 0
                ? "text-emerald-800"
                : "text-rose-800"
            }`}
          >
            {CurrencySign}
            {Number(summary?.net || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <FinanceQuickDateChips
          selected={selectedDateFilter}
          onSelect={(value) => {
            setSelectedDateFilter(value);
            setValue("startDate", undefined);
            setValue("endDate", undefined);
            setFilters((prev) => {
              const next = { ...prev };
              delete next.startDate;
              delete next.endDate;
              return next;
            });
            handlePagination({ page: 1, limit: query.limit });
          }}
          options={[
            { label: "Today", value: "today" },
            { label: "Yesterday", value: "yesterday" },
            { label: "Last 7 days", value: "last7" },
            { label: "Last 30 days", value: "last30" },
          ]}
        />
      </div>

      <PageFilterWrapper title="Ledger Filters">{Component}</PageFilterWrapper>

      {isFetching ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading ledger...
        </div>
      ) : (
        <Table
          headers={headers}
          data={data}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={!!exporting || !success}
          onClick={() => handleDownload("pdf")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileDown size={15} />
          {exporting === "pdf" ? "Preparing PDF..." : "Download PDF"}
        </button>
        <button
          type="button"
          disabled={!!exporting || !success}
          onClick={() => handleDownload("excel")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[13px] font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileSpreadsheet size={15} />
          {exporting === "excel" ? "Preparing Excel..." : "Download Excel"}
        </button>
      </div>
    </div>
  );
};

export default Ledger;
