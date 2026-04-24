import TotalRevenue from "./components/TotalRevenue";
import TotalPurchase from "./components/TotalPurchase";
import TotalExpense from "./components/TotalExpense";
import { ADToBS } from "bikram-sambat-js";
import { formatDate } from "@/utils/formatDate";
import { formatNepaliDate } from "@/utils/formatNepaliDate";
import { OpeningBalance } from "./components/OpeningBalance";
import { REVENUE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
const PageHeader = () => {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold text-gray-900">
        Daily Summary Report
      </h1>
      <div className="flex items-center justify-between text-xl text-black font-bold">
        <p>Date: {formatDate(new Date())}</p>
        <p>{formatNepaliDate(ADToBS(new Date()))}</p>
      </div>
      <div className="flex justify-center">
        <p className="text-xl font-semibold border-x-2 px-4 border-black w-fit">
          {new Date().toLocaleDateString("en-US", { weekday: "long" })}
        </p>
      </div>
    </div>
  );
};

export const DailySummaryReport = () => {
  const { data: revenueData } = useGetApiQuery({
    url: `${REVENUE_URL}revenue-today`,
  });
  const todayRevenue = revenueData?.data?.totalRevenue || 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <PageHeader />
      </div>
      <div className="flex flex-col gap-4">
        <TotalRevenue />
        <TotalPurchase />
        <TotalExpense />
        <OpeningBalance todayRevenue={todayRevenue} />
      </div>
    </div>
  );
};
