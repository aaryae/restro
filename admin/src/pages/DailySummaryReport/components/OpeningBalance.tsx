import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, Check } from "lucide-react";
import Input from "@/components/Input";
import { appToast } from "@/components/Toast";
import { CurrencySign } from "@/constants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { ReportSection } from "./ReportUI";

const STORAGE_PREFIX = "counterCashOpening";

interface OpeningBalanceProps {
  dateParams?: string;
}

function getDateKey(dateParams: string) {
  const match = dateParams.match(/(?:^|&)start=([^&]+)/);
  return match?.[1] || new Date().toISOString().slice(0, 10);
}

function storageKeyForDate(dateKey: string) {
  return `${STORAGE_PREFIX}:${dateKey}`;
}

function formatAmount(amount: number) {
  return `${CurrencySign}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const OpeningBalance: React.FC<OpeningBalanceProps> = ({
  dateParams = "",
}) => {
  const dateKey = useMemo(() => getDateKey(dateParams), [dateParams]);
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");

  const { data, isFetching } = useGetApiQuery({
    url: `report/counter-cash${dateParams ? `?${dateParams}` : ""}`,
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKeyForDate(dateKey)) ?? "";
    setValue(saved);
    setSavedValue(saved);
  }, [dateKey]);

  const hasChanges = value.trim() !== savedValue.trim();

  const handleUpdate = () => {
    if (!hasChanges) return;

    const next = value.trim();
    localStorage.setItem(storageKeyForDate(dateKey), next);
    setValue(next);
    setSavedValue(next);
    appToast.success("Opening balance updated");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleUpdate();
  };

  const openingBalance = parseFloat(value) || 0;
  const cashRevenue = Number(data?.data?.cashRevenue || 0);
  const cashPurchases = Number(data?.data?.cashPurchases || 0);
  const cashExpenses = Number(data?.data?.cashExpenses || 0);
  const totalCounterCash =
    openingBalance + cashRevenue - cashPurchases - cashExpenses;

  const rows = [
    {
      key: "in",
      label: "Cash in",
      hint: "Sales paid to Counter Cash",
      amount: cashRevenue,
      tone: "in" as const,
      Icon: ArrowDownLeft,
    },
    {
      key: "purchase",
      label: "Purchases",
      hint: "Paid from Counter Cash",
      amount: cashPurchases,
      tone: "out" as const,
      Icon: ArrowUpRight,
    },
    {
      key: "expense",
      label: "Expenses",
      hint: "Paid from Counter Cash",
      amount: cashExpenses,
      tone: "out" as const,
      Icon: ArrowUpRight,
    },
  ];

  return (
    <ReportSection title="Counter cash" total={totalCounterCash} totalTone="green">
      <div className="overflow-hidden rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)]">
        <div className="flex flex-col gap-3 border-b border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--serve-surface)] text-[var(--serve-muted)] shadow-sm ring-1 ring-[var(--serve-border)]">
              <Banknote size={16} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[13px] font-medium text-[var(--serve-fg)]">
                Opening balance
              </p>
              <p className="text-[12px] text-[var(--serve-muted)]">
                Starting cash in the drawer for this day
              </p>
            </div>
          </div>

          <div className="flex items-stretch">
            <div className="w-full sm:w-[180px] [&_.input-wrapper]:!rounded-r-none [&_.input-wrapper]:!border-r-0 [&_.input-wrapper]:!h-10">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                leftSection={
                  <span className="text-[13px] font-medium text-[var(--serve-muted)]">
                    {CurrencySign}
                  </span>
                }
              />
            </div>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={!hasChanges}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-l-none rounded-r-lg bg-primaryColor px-3.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={15} strokeWidth={2.25} />
              Save
            </button>
          </div>
        </div>

        <div className="divide-y divide-[var(--serve-border)]">
          {rows.map(({ key, label, hint, amount, tone, Icon }) => {
            const isOut = tone === "out";
            const display = isFetching
              ? "…"
              : `${isOut ? "−" : "+"} ${formatAmount(amount)}`;

            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                      isOut
                        ? "bg-[color-mix(in_srgb,var(--serve-negative)_14%,transparent)] text-[var(--serve-negative)]"
                        : "bg-[color-mix(in_srgb,var(--serve-positive)_14%,transparent)] text-[var(--serve-positive)]"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--serve-fg)]">
                      {label}
                    </p>
                    <p className="truncate text-[11px] text-[var(--serve-muted)]">{hint}</p>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-[13px] font-semibold tabular-nums ${
                    isOut ? "text-[var(--serve-negative)]" : "text-[var(--serve-positive)]"
                  }`}
                >
                  {display}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-4 py-3.5">
          <div>
            <p className="text-[13px] font-semibold text-[var(--serve-fg)]">
              Total counter cash
            </p>
            <p className="text-[11px] text-[var(--serve-muted)]">
              Opening + cash in − purchases − expenses
            </p>
          </div>
          <p className="text-xl font-bold tabular-nums text-[var(--serve-positive)]">
            {formatAmount(totalCounterCash)}
          </p>
        </div>
      </div>
    </ReportSection>
  );
};
