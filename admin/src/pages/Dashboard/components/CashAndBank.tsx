import { useGetApiQuery } from "@/redux/services/crudApi";
import { CurrencySign } from "@/constants";
import { PiggyBank, Wallet, Building2 } from "lucide-react";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import SummaryCard, { type SummaryTint } from "@/components/SummaryCard";
import {
  formatCurrencyAmount,
  sumAccountBalances,
} from "@/utils/formatCurrency";

/** Accounts are genuinely distinct categories, so they cycle the palette. */
const ACCOUNT_TINTS: SummaryTint[] = [
  "teal",
  "cerulean",
  "plum",
  "bronze",
  "indigo",
  "olive",
  "violet",
  "vermilion",
];

function CashAndBank() {
  const { data: totalAndBalancesData, isLoading } = useGetApiQuery({
    url: `${ACCOUNT_URL}total-and-balances`,
  });

  if (isLoading) {
    return (
      <div className="min-w-0 space-y-4">
        <div className="h-28 animate-pulse rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface-2)]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[76px] animate-pulse rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface-2)]"
            />
          ))}
        </div>
      </div>
    );
  }

  const accounts = totalAndBalancesData?.data?.accounts || [];
  const totalBalance = sumAccountBalances(accounts);

  return (
    <div className="min-w-0 space-y-4">
      {totalAndBalancesData?.success && (
        <div className="dash-card dash-kpi overflow-hidden p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="dash-kpi-label">Total Balance</p>
              <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight text-[var(--serve-fg)] sm:text-3xl">
                {`${CurrencySign}${formatCurrencyAmount(totalBalance)}`}
              </p>
              <p className="mt-1.5 text-[12px] text-[var(--serve-muted)]">
                Across {accounts.length} account
                {accounts.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className="dash-kpi-icon h-11 w-11 rounded-xl">
              <PiggyBank className="h-5 w-5" />
            </span>
          </div>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {accounts.map((account: any, index: number) => {
            const isBank =
              (account?.accountType || account?.type || "").toLowerCase() ===
              "bank";
            const Icon = isBank ? Building2 : Wallet;

            return (
              <SummaryCard
                key={account.id}
                title={account.name}
                value={`${CurrencySign}${formatCurrencyAmount(account.currentBalance)}`}
                amount={Number(account.currentBalance) || 0}
                tint={ACCOUNT_TINTS[index % ACCOUNT_TINTS.length]}
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
