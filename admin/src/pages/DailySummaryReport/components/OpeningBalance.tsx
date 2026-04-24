import { useState, useEffect } from "react";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import Toast from "@/components/Toast";
import Input from "@/components/Input";

const STORAGE_KEY = "openingBalance";

interface OpeningBalanceProps {
  todayRevenue?: number;
}

export const OpeningBalance: React.FC<OpeningBalanceProps> = ({
  todayRevenue = 0,
}) => {
  const [value, setValue] = useState("");

  const { data: accounts } = useGetApiQuery({
    url: `${ACCOUNT_URL}1`,
  });

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

  const openingBalanceFromApi = parseFloat(accounts?.data?.openingBalance) || 0;
  const openingValue = parseFloat(value) || 0;
  const totalCounterCash = Number(openingValue) + Number(openingBalanceFromApi) + Number(todayRevenue);

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
          Total Counter Cash Amount: {totalCounterCash}
        </p>
      </div>
    </div>
  );
};
