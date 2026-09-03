import React, { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import DateInput from "@/components/DateInput";
import FinanceQuickDateChips from "@/components/FinanceQuickDateChips";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { checkAccess } from "@/utils/accessHelper";

const typeLabel: Record<string, string> = {
  opening: "Opening",
  purchase: "Purchase",
  adjustment_in: "Adjustment In",
  adjustment_out: "Adjustment Out",
  waste: "Waste",
};

const formatMoney = (amount: number | string) =>
  `Rs ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const toYmd = (date: Date) => format(date, "yyyy-MM-dd");

const StockHistory: React.FC = () => {
  const accessList = checkAccess("Stock History");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null,
  );
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const dateParams = useMemo(() => {
    if (fromDate || toDate) {
      return {
        from: fromDate ? toYmd(fromDate) : undefined,
        to: toDate ? toYmd(toDate) : undefined,
      };
    }

    if (!selectedDateFilter || selectedDateFilter === "all") {
      return {};
    }

    const today = new Date();
    if (selectedDateFilter === "today") {
      const day = toYmd(today);
      return { from: day, to: day };
    }
    if (selectedDateFilter === "yesterday") {
      const day = toYmd(subDays(today, 1));
      return { from: day, to: day };
    }
    if (selectedDateFilter === "last7") {
      return {
        from: toYmd(subDays(today, 6)),
        to: toYmd(today),
      };
    }
    if (selectedDateFilter === "last30") {
      return {
        from: toYmd(subDays(today, 29)),
        to: toYmd(today),
      };
    }
    return {};
  }, [fromDate, toDate, selectedDateFilter]);

  const url = buildQueryString("stock-history/list", {
    page: query.page,
    limit: query.limit,
    search: dateParams,
  });

  const {
    data: apiData,
    isSuccess: success,
    refetch,
  } = useGetApiQuery({ url });

  const rows: any[] = success ? (apiData?.data?.data ?? []) : [];

  const filtered = searchTerm
    ? rows.filter((r) =>
        String(r.stockItem?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    : rows;

  const pagination: PaginationType = {
    page: apiData?.data?.total === 0 ? 0 : apiData?.data?.page,
    limit: apiData?.data?.limit,
    total: apiData?.data?.total,
    totalPages: apiData?.data?.totalPages,
  };

  const headers = [
    "Date",
    "Stock Item",
    "Type",
    "Quantity",
    "Rate",
    "Value",
    "Note",
    "By",
  ];

  const resetToPageOne = () => {
    handlePagination({ page: 1, limit: query.limit });
  };

  const clearCustomDates = () => {
    setFromDate(undefined);
    setToDate(undefined);
  };

  const data = filtered.map((r: any) => {
    const symbol = r.stockItem?.measuringUnit?.symbol;
    const qty = Number(r.quantity || 0).toFixed(2);
    const creator = r.creator
      ? [r.creator.firstName, r.creator.lastName].filter(Boolean).join(" ") ||
        r.creator.username
      : "—";

    return [
      <span className="text-slate-600">
        {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
      </span>,
      <span className="text-sm font-semibold text-slate-800">
        {r.stockItem?.name || "—"}
      </span>,
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
        {typeLabel[r.type] || r.type}
      </span>,
      <span className="text-slate-700">
        {qty}
        {symbol ? ` ${symbol}` : ""}
      </span>,
      <span className="text-slate-700">{formatMoney(r.rate)}</span>,
      <span className="text-slate-700">{formatMoney(r.value)}</span>,
      <span className="text-slate-600">{r.note || "—"}</span>,
      <span className="text-slate-600">{creator}</span>,
    ];
  });

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search by stock item..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={false}
        handleReloadButton={() => refetch()}
        subText="Immutable ledger of stock movements. Filter by date range below."
        filters={
          <FinanceQuickDateChips
            selected={selectedDateFilter}
            onSelect={(value) => {
              clearCustomDates();
              setSelectedDateFilter(value);
              resetToPageOne();
            }}
            onClear={() => {
              setSelectedDateFilter(null);
              clearCustomDates();
              resetToPageOne();
            }}
            options={[
              { label: "Today", value: "today" },
              { label: "Yesterday", value: "yesterday" },
              { label: "Last 7 days", value: "last7" },
              { label: "Last 30 days", value: "last30" },
            ]}
          />
        }
      />

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-2 text-[12px] font-medium text-slate-500">
          Custom date range
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 sm:max-w-[220px]">
            <DateInput
              label="From date"
              value={fromDate}
              handleChange={(value) => {
                setFromDate(value);
                setSelectedDateFilter(null);
                resetToPageOne();
              }}
            />
          </div>
          <div className="min-w-0 flex-1 sm:max-w-[220px]">
            <DateInput
              label="To date"
              value={toDate}
              handleChange={(value) => {
                setToDate(value);
                setSelectedDateFilter(null);
                resetToPageOne();
              }}
            />
          </div>
          {(fromDate || toDate || selectedDateFilter) && (
            <button
              type="button"
              onClick={() => {
                clearCustomDates();
                setSelectedDateFilter(null);
                resetToPageOne();
              }}
              className="inline-flex h-[42px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {accessList.includes("view") ? (
        <Table
          data={data}
          headers={headers}
          handlePagination={handlePagination}
          pagination={pagination}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view stock history.
        </div>
      )}
    </div>
  );
};

export default StockHistory;
