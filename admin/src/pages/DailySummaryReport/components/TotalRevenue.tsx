import { CurrencySign } from "@/constants";
import { REVENUE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { Wallet, Building2, CreditCard } from "lucide-react";

interface TotalRevenueProps {
  dateParams?: string;
}

const TotalRevenue = ({ dateParams = "" }: TotalRevenueProps) => {
  const { data: revenueByAccountData, isFetching } = useGetApiQuery({
    url: `${REVENUE_URL}revenue-today${dateParams ? `?${dateParams}` : ""}`,
  });

  const revenues = revenueByAccountData?.data?.revenues || [];
  const totalRevenue = revenueByAccountData?.data?.totalRevenue;

  const groupByAccountType = () => {
    const groups: Record<string, any[]> = {
      cash: [],
      bank: [],
      wallet: [],
    };

    revenues.forEach((revenue: any) => {
      const type = revenue.accountType?.toLowerCase() || "unknown";
      if (groups[type]) {
        groups[type].push(revenue);
      }
    });

    return groups;
  };

  const groupedAccounts = groupByAccountType();

  const accountTypes = [
    { key: "cash", label: "Cash", Icon: Wallet, color: "text-green-600" },
    { key: "bank", label: "Bank", Icon: Building2, color: "text-blue-600" },
    {
      key: "wallet",
      label: "Wallet",
      Icon: CreditCard,
      color: "text-purple-600",
    },
  ];

  const getTotalByType = (type: string) => {
    return groupedAccounts[type].reduce(
      (sum: number, r: any) => sum + r.totalRevenue,
      0,
    );
  };

  return (
    <div className="space-y-4 border border-[#DDDDDD] rounded-lg p-6 bg-white">
      <div className="">
        <p className="text-xl font-bold mb-4">
          Total Revenue of Today: {CurrencySign}
          {totalRevenue?.toLocaleString()}
        </p>
      </div>

      {isFetching ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accountTypes.map(({ key, label, Icon, color }) => (
            <div
              key={key}
              className="border border-[#DDDDDD] rounded-lg bg-white overflow-hidden"
            >
              <div
                className={`bg-gray-50 px-4 py-3 border-b border-[#DDDDDD] ${color}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-lg">{label}</span>
                </div>
                <div className="text-lg mt-1">
                  Total: {CurrencySign}
                  {getTotalByType(key).toLocaleString()}
                </div>
              </div>

              <div className="p-4">
                {groupedAccounts[key].length > 0 ? (
                  <div className="space-y-2">
                    {groupedAccounts[key].map((revenue: any) => (
                      <div
                        key={revenue.accountId}
                        className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-gray-700 text-lg">
                          {revenue.accountName}
                        </span>
                        <span className="text-green-600 font-medium text-lg">
                          {CurrencySign}
                          {revenue.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No accounts
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TotalRevenue;
