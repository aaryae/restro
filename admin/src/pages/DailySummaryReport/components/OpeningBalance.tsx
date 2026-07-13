import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Input from "@/components/Input";
import { CurrencySign } from "@/constants";

const STORAGE_KEY = "openingBalance";
const TOAST_ID = "opening-balance-updated";

interface Revenue {
  accountId: number;
  accountName: string;
  accountType: string;
  totalRevenue: number;
  transactionCount: number;
}

interface OpeningBalanceProps {
  revenues?: Revenue[];
}

export const OpeningBalance: React.FC<OpeningBalanceProps> = ({
  revenues = [],
}) => {
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? "";
    setValue(saved);
    setSavedValue(saved);
  }, []);

  const hasChanges = value.trim() !== savedValue.trim();

  const handleUpdate = () => {
    if (!hasChanges) return;

    const next = value.trim();
    localStorage.setItem(STORAGE_KEY, next);
    setValue(next);
    setSavedValue(next);

    toast.success("Opening balance updated successfully", {
      position: "bottom-right",
      toastId: TOAST_ID,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleUpdate();
  };

  const openingValue = parseFloat(value) || 0;
  const counterCashRevenue =
    revenues.find((r: Revenue) => r.accountId === 1)?.totalRevenue || 0;
  const totalCounterCash = Number(openingValue) + Number(counterCashRevenue);

  return (
    <div>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-slate-500">
        Counter cash
      </h2>
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <label className="w-full text-[12px] font-medium text-slate-500 sm:w-auto sm:shrink-0">
            Opening balance
          </label>
          <div className="min-w-[140px] flex-1 sm:max-w-[220px]">
            <Input
              type="text"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            className="h-10 shrink-0 rounded-lg bg-primaryColor px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={handleUpdate}
            disabled={!hasChanges}
          >
            Update
          </button>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total counter cash
          </p>
          <p className="text-lg font-bold tabular-nums text-emerald-600">
            {CurrencySign}
            {totalCounterCash.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
