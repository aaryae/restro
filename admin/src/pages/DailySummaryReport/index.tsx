import TotalRevenue from "./components/TotalRevenue";
import TotalPurchase from "./components/TotalPurchase";
import TotalExpense from "./components/TotalExpense";
import { ADToBS } from "bikram-sambat-js";
import { formatDate } from "@/utils/formatDate";
import { formatNepaliDate } from "@/utils/formatNepaliDate";
import { OpeningBalance } from "./components/OpeningBalance";
import {
  EXPENSE_URL,
  PURCHASE_URL,
  REVENUE_URL,
} from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { subDays } from "date-fns";
import { useMemo, useState } from "react";
import { CurrencySign } from "@/constants";
import { ReportDateChip } from "./components/ReportUI";
import { ReportDatePickerDialog } from "./components/ReportDatePickerDialog";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  TrendingUp,
} from "lucide-react";

export const DailySummaryReport = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("today");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });

  const handleDateFilter = (type: string) => {
    const today = new Date();
    if (type === "today") {
      setDateRange({ startDate: today, endDate: today });
    } else if (type === "yesterday") {
      const yesterday = subDays(today, 1);
      setDateRange({ startDate: yesterday, endDate: yesterday });
    }
    setSelectedDateFilter(type);
    setShowDatePicker(false);
  };

  const dateParams = useMemo(() => {
    const fmt = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    return `start=${fmt(dateRange.startDate)}&end=${fmt(dateRange.endDate)}`;
  }, [dateRange]);

  const periodLabel = useMemo(() => {
    if (selectedDateFilter === "today") return "Today";
    if (selectedDateFilter === "yesterday") return "Yesterday";
    return formatDate(dateRange.startDate);
  }, [selectedDateFilter, dateRange.startDate]);

  const { data: revenueData } = useGetApiQuery({
    url: `${REVENUE_URL}revenue-today?${dateParams}`,
  });
  const { data: purchaseData } = useGetApiQuery({
    url: `${PURCHASE_URL}purchase-today?${dateParams}`,
  });
  const { data: expenseData } = useGetApiQuery({
    url: `${EXPENSE_URL}expense-today?${dateParams}`,
  });

  const totalRevenue = Number(revenueData?.data?.totalRevenue || 0);
  const totalPurchase = Number(purchaseData?.data?.totalPurchase || 0);
  const totalExpense = Number(expenseData?.data?.totalExpense || 0);
  const net = totalRevenue - totalPurchase - totalExpense;

  const weekday = dateRange.startDate.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const kpis = [
    {
      label: "Revenue",
      value: totalRevenue,
      icon: TrendingUp,
      iconClass: "bg-[var(--serve-positive)] text-white",
      valueClass: "text-[var(--serve-positive)]",
    },
    {
      label: "Purchase",
      value: totalPurchase,
      icon: ArrowDownCircle,
      iconClass: "bg-[var(--serve-info)] text-white",
      valueClass: "text-[var(--serve-info)]",
    },
    {
      label: "Expense",
      value: totalExpense,
      icon: ArrowUpCircle,
      iconClass: "bg-[var(--serve-negative)] text-white",
      valueClass: "text-[var(--serve-negative)]",
    },
    {
      label: "Net",
      value: net,
      icon: Scale,
      iconClass:
        net >= 0
          ? "bg-primaryColor text-white"
          : "bg-[var(--serve-negative)] text-white",
      valueClass:
        net >= 0 ? "text-[var(--serve-fg)]" : "text-[var(--serve-negative)]",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--serve-fg)]">
            Daily Summary Report
          </h1>
          <p className="mt-1 text-[13px] text-[var(--serve-muted)]">
            <span className="font-medium text-[var(--serve-fg)]">
              {formatDate(dateRange.startDate)}
            </span>
            <span className="mx-1.5 text-[var(--serve-border)]">·</span>
            {weekday}
            <span className="mx-1.5 text-[var(--serve-border)]">·</span>
            {formatNepaliDate(ADToBS(dateRange.startDate))}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ReportDateChip
            active={selectedDateFilter === "yesterday"}
            onClick={() => handleDateFilter("yesterday")}
          >
            Yesterday
          </ReportDateChip>
          <ReportDateChip
            active={selectedDateFilter === "today"}
            onClick={() => handleDateFilter("today")}
          >
            Today
          </ReportDateChip>
          <ReportDateChip
            active={selectedDateFilter === "custom" || showDatePicker}
            onClick={() => setShowDatePicker(true)}
          >
            Custom
          </ReportDateChip>
        </div>
      </div>

      <ReportDatePickerDialog
        open={showDatePicker}
        onOpenChange={setShowDatePicker}
        selectedDate={dateRange.startDate}
        onConfirm={(date) => {
          setDateRange({ startDate: date, endDate: date });
          setSelectedDateFilter("custom");
        }}
      />

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, iconClass, valueClass }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[var(--serve-muted)]">{label}</p>
                <p
                  className={`mt-1.5 text-2xl font-bold tabular-nums tracking-tight ${valueClass}`}
                >
                  {CurrencySign}
                  {value.toLocaleString()}
                </p>
                <p className="mt-1 text-[12px] text-[var(--serve-muted)]">{periodLabel}</p>
              </div>
              <span
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
              >
                <Icon size={18} strokeWidth={2} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] p-4 sm:p-5">
        <TotalRevenue dateParams={dateParams} periodLabel={periodLabel} />
        <div className="border-t border-[var(--serve-border)] pt-5">
          <OpeningBalance dateParams={dateParams} />
        </div>
        <div className="grid gap-6 border-t border-[var(--serve-border)] pt-5 lg:grid-cols-2">
          <TotalPurchase dateParams={dateParams} periodLabel={periodLabel} />
          <TotalExpense dateParams={dateParams} periodLabel={periodLabel} />
        </div>
      </div>
    </div>
  );
};
