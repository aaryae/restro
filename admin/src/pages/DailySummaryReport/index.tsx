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

  const revenues = revenueData?.data?.revenues || [];
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
      iconClass: "bg-[#0F766E] text-white",
      valueClass: "text-[#0F766E]",
    },
    {
      label: "Purchase",
      value: totalPurchase,
      icon: ArrowDownCircle,
      iconClass: "bg-[#B45309] text-white",
      valueClass: "text-[#B45309]",
    },
    {
      label: "Expense",
      value: totalExpense,
      icon: ArrowUpCircle,
      iconClass: "bg-[#BE123C] text-white",
      valueClass: "text-[#BE123C]",
    },
    {
      label: "Net",
      value: net,
      icon: Scale,
      iconClass:
        net >= 0 ? "bg-primaryColor text-white" : "bg-[#BE123C] text-white",
      valueClass: net >= 0 ? "text-slate-900" : "text-[#BE123C]",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Daily Summary Report
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            <span className="font-medium text-slate-800">
              {formatDate(dateRange.startDate)}
            </span>
            <span className="mx-1.5 text-slate-300">·</span>
            {weekday}
            <span className="mx-1.5 text-slate-300">·</span>
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
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-slate-500">{label}</p>
                <p
                  className={`mt-1.5 text-2xl font-bold tabular-nums tracking-tight ${valueClass}`}
                >
                  {CurrencySign}
                  {value.toLocaleString()}
                </p>
                <p className="mt-1 text-[12px] text-slate-400">{periodLabel}</p>
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

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <TotalRevenue dateParams={dateParams} periodLabel={periodLabel} />
        <div className="border-t border-slate-100 pt-5">
          <OpeningBalance revenues={revenues} />
        </div>
        <div className="grid gap-6 border-t border-slate-100 pt-5 lg:grid-cols-2">
          <TotalPurchase dateParams={dateParams} periodLabel={periodLabel} />
          <TotalExpense dateParams={dateParams} periodLabel={periodLabel} />
        </div>
      </div>
    </div>
  );
};
