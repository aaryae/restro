import { useGetApiQuery } from "@/redux/services/crudApi";
import { CurrencySign } from "@/constants";
import { PiggyBank, Wallet, Building2 } from "lucide-react";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import SummaryCard from "@/components/SummaryCard";

const accountTones = ["emerald", "sky", "violet", "teal", "indigo", "amber"] as const;

function CashAndBank() {
  const { data: totalAndBalancesData, isLoading } = useGetApiQuery({
    url: `${ACCOUNT_URL}total-and-balances`,
  });

  if (isLoading) {
    return (
      <div className="min-w-0 space-y-4">
        <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[76px] animate-pulse rounded-xl border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
      </div>
    );
  }

  const accounts = totalAndBalancesData?.data?.accounts || [];

  return (
    <div className="min-w-0 space-y-4">
      {totalAndBalancesData?.success && (
        <div className="overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-violet-700">
                Total Balance
              </p>
              <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
                {`${CurrencySign}${totalAndBalancesData?.data?.totalBalance.toLocaleString()}`}
              </p>
              <p className="mt-1.5 text-[12px] text-slate-500">
                Across {accounts.length} account
                {accounts.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 ring-1 ring-violet-200">
              <PiggyBank className="h-5 w-5" />
            </span>
          </div>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {accounts.map((account: any, index: number) => {
            const isBank =
              (account?.accountType || "").toLowerCase() === "bank";
            const Icon = isBank ? Building2 : Wallet;
            const tone = accountTones[index % accountTones.length];

            return (
              <SummaryCard
                key={account.id}
                title={account.name}
                value={`${CurrencySign}${account.currentBalance.toLocaleString()}`}
                tone={tone}
                Icon={Icon}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CashAndBank;
