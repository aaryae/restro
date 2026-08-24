import { CurrencySign } from "@/constants";
import { EXPENSE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { CreditCard, DollarSign, Receipt } from "lucide-react";
import { ReportEmptyState, ReportSection } from "./ReportUI";

interface TotalExpenseProps {
  dateParams?: string;
  periodLabel?: string;
}

const TotalExpense = ({
  dateParams = "",
  periodLabel = "Today",
}: TotalExpenseProps) => {
  const { data: expenseData, isFetching } = useGetApiQuery({
    url: `${EXPENSE_URL}expense-today${dateParams ? `?${dateParams}` : ""}`,
  });

  const categories = expenseData?.data?.categories || [];
  const totalExpense = expenseData?.data?.totalExpense ?? 0;

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("utilit")) {
      return <DollarSign className="h-3.5 w-3.5" />;
    }
    if (name.includes("rent") || name.includes("maintenance")) {
      return <Receipt className="h-3.5 w-3.5" />;
    }
    if (name.includes("suppl") || name.includes("equip")) {
      return <CreditCard className="h-3.5 w-3.5" />;
    }
    return <Receipt className="h-3.5 w-3.5" />;
  };

  return (
    <ReportSection
      title={`Expenses · ${periodLabel}`}
      total={Number(totalExpense)}
      totalTone="red"
    >
      {isFetching ? (
        <div className="py-6 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : categories.length === 0 ? (
        <ReportEmptyState
          compact
          icon={Receipt}
          title="No expenses"
          description="None recorded for this day."
        />
      ) : (
        <div className="space-y-2">
          {categories.map((category: any, index: number) => (
            <div
              key={category.id ?? index}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                  {getCategoryIcon(category.categoryName)}
                </span>
                <span className="text-[13px] font-medium text-slate-700">
                  {category.categoryName}
                </span>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-rose-600">
                {CurrencySign}
                {Number(category.totalExpense).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </ReportSection>
  );
};

export default TotalExpense;
