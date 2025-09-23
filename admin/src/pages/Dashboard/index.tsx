import { format, getHours } from "date-fns";
import { useAppSelector } from "@/redux/store/hooks";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import OverviewCards from "./components/OverviewCards";
import PurchaseSection from "./components/PurchaseChart";
import RevenueSection from "./components/RevenueChart";
import PurchaseExpenseSection from "./components/PurchaseExpenseChart";

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date);
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function Dashboard() {
  const userName = useAppSelector((state) => state.profile.username);
  const todayDate = format(new Date(), "PPPP");

  const headerOptions = [
    { label: "Overview", value: "overview" },
    { label: "Purchase & Expense", value: "purchase-expense" },
    { label: "Revenue", value: "revenue" },
    { label: "Cash & Banks", value: "cashbanks" },
  ];

  const { control, watch } = useForm<{ accountType: string }>({
    defaultValues: { accountType: "overview" },
  });
  const selectedView = watch("accountType");

  return (
    <>
      <div className="w-full flex justify-between">
        <div className="flex flex-col">
          <div className="text-left text-2xl font-bold">
            Good {getPartOfDay()},{" "}
            <span className="text-green-500">{userName}</span>
          </div>
          <div className="flex">
            <span className="text-blue-500 font-semibold">{todayDate}</span>
          </div>
        </div>
      </div>
      <div className="flex mt-4">
        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <div className="flex p-1 gap-[18px] rounded-lg justify-between">
              {headerOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex border-2 md:py-3 md:px-8 py-4 px-6 justify-between text-base font-medium rounded-md transition-colors ${
                    field.value === option.value
                      ? "bg-primaryColor text-white border-none"
                      : "bg-white text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => field.onChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        />
      </div>
      {/* Overview content */}
      {selectedView === "overview" && (
        <>
          <OverviewCards />
        </>
      )}
      {/* Revenue content */}
      {selectedView === "purchase-expense" && (
        <>
          <PurchaseExpenseSection />
        </>
      )}
      {/* Revenue content */}
      {selectedView === "revenue" && (
        <>
          <RevenueSection />
        </>
      )}
      {/* Purchase content */}
      {selectedView === "purchase" && (
        <>
          <PurchaseSection />
        </>
      )}
    </>
  );
}
