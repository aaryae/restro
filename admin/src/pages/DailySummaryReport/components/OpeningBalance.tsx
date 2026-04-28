import { useState, useEffect } from "react";

import Toast from "@/components/Toast";
import Input from "@/components/Input";

const STORAGE_KEY = "openingBalance";

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

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setValue(saved);
    }
  }, []);

  const handleUpdate = () => {
    localStorage.setItem(STORAGE_KEY, value);
    Toast("Opening balance updated successfully", "success");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUpdate();
    }
  };

  const openingValue = parseFloat(value) || 0;
  const counterCashRevenue =
    revenues.find((r: Revenue) => r.accountId === 1)?.totalRevenue || 0;
  const totalCounterCash = Number(openingValue) + Number(counterCashRevenue);

  return (
    <div className="space-y-4 border border-[#DDDDDD] rounded-lg p-6 bg-white">
      <div className="flex items-center gap-4">
        <p className="text-lg font-medium">Opening counter cash balance:</p>
        <Input
          type="text"
          placeholder="0.00"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          type="button"
          onClick={handleUpdate}
        >
          Update
        </button>
      </div>
      <div>
        <p className="text-lg font-medium">
          Total Counter Cash Amount:{" "}
          <span className="border border-[#dddddd] px-4 py-2 rounded-lg text-green-600">
            {totalCounterCash}
          </span>
        </p>
      </div>
    </div>
  );
};
