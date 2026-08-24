import { CurrencySign } from "@/constants";
import { REVENUE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { Building2, CreditCard, Wallet } from "lucide-react";
import { ReportEmptyState, ReportSection } from "./ReportUI";

interface TotalRevenueProps {
  dateParams?: string;
  periodLabel?: string;
}

const TotalRevenue = ({
  dateParams = "",
  periodLabel = "Today",
}: TotalRevenueProps) => {
  const { data: revenueByAccountData, isFetching } = useGetApiQuery({
    url: `${REVENUE_URL}revenue-today${dateParams ? `?${dateParams}` : ""}`,
  });

  const revenues = revenueByAccountData?.data?.revenues || [];
  const totalRevenue = revenueByAccountData?.data?.totalRevenue ?? 0;

  const groupedAccounts: Record<string, any[]> = {
    cash: [],
    bank: [],
    wallet: [],
  };

  revenues.forEach((revenue: any) => {
    const type = revenue.accountType?.toLowerCase() || "unknown";
    if (groupedAccounts[type]) {
      groupedAccounts[type].push(revenue);
    }
  });

  const accountTypes = [
    {
      key: "cash",
      label: "Cash",
      Icon: Wallet,
      amount: "text-emerald-600",
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      key: "bank",
      label: "Bank",
      Icon: Building2,
      amount: "text-sky-600",
      iconBg: "bg-sky-50 text-sky-600",
    },
    {
      key: "wallet",
      label: "Wallet",
      Icon: CreditCard,
      amount: "text-violet-600",
      iconBg: "bg-violet-50 text-violet-600",
    },
  ];

  const getTotalByType = (type: string) =>
    groupedAccounts[type].reduce(
      (sum: number, r: any) => sum + (r.totalRevenue || 0),
      0,
    );

  return (
    <ReportSection
      title={`Revenue by payment · ${periodLabel}`}
      total={Number(totalRevenue)}
      totalTone="green"
    >
      {isFetching ? (
        <div className="py-6 text-center text-sm text-slate-500">
          Loading revenue…
        </div>
      ) : revenues.length === 0 ? (
        <ReportEmptyState
          compact
          icon={Wallet}
          title="No revenue recorded"
          description="Settled payments will appear here by cash, bank, and wallet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {accountTypes.map(({ key, label, Icon, amount, iconBg }) => (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {label}
                  </span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${amount}`}>
                  {CurrencySign}
                  {getTotalByType(key).toLocaleString()}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {groupedAccounts[key].length > 0 ? (
                  groupedAccounts[key].map((revenue: any) => (
                    <div
                      key={revenue.accountId}
                      className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200/80"
                    >
                      <span className="truncate text-[13px] text-slate-600">
                        {revenue.accountName}
                      </span>
                      <span
                        className={`ml-2 shrink-0 text-[13px] font-semibold tabular-nums ${amount}`}
                      >
                        {CurrencySign}
                        {Number(revenue.totalRevenue).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-2 text-center text-[12px] text-slate-400">
                    No accounts
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ReportSection>
  );
};

export default TotalRevenue;
