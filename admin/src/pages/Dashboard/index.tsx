import { format, getHours } from "date-fns";
import { lazy, Suspense } from "react";
import { useAppSelector } from "@/redux/store/hooks";
import { useForm, Controller } from "react-hook-form";
import DashboardViewTabs, {
  type DashboardView,
} from "./components/DashboardViewTabs";
import DashboardQuickLinks from "./components/DashboardQuickLinks";
import AnimatedPanel from "./components/AnimatedPanel";
import { LayoutDashboard } from "lucide-react";
import Loader from "@/components/Loader";

const OverviewCards = lazy(() => import("./components/OverviewCards"));
const PurchaseExpenseSection = lazy(
  () => import("./components/PurchaseExpenseChart"),
);
const RevenueSection = lazy(() => import("./components/RevenueChart"));
const CashAndBank = lazy(() => import("./components/CashAndBank"));

const getPartOfDay = (date: Date = new Date()): string => {
  const hour = getHours(date);
  if (hour >= 0 && hour < 6) return "Night";
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 18) return "Afternoon";
  return "Evening";
};

export default function Dashboard() {
  const userName = useAppSelector((state) => state.profile.username);
  const todayDate = format(new Date(), "EEEE, MMMM d, yyyy");

  const { control, watch } = useForm<{ accountType: DashboardView }>({
    defaultValues: { accountType: "overview" },
  });
  const selectedView = watch("accountType");

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primaryColor/10 text-primaryColor">
              <LayoutDashboard size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
                Good {getPartOfDay()},{" "}
                <span className="text-primaryColor">{userName}</span>
              </h1>
              <p className="mt-0.5 text-[13px] text-slate-500">{todayDate}</p>
            </div>
          </div>

          <Controller
            name="accountType"
            control={control}
            render={({ field }) => (
              <DashboardViewTabs
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="mt-3">
        <DashboardQuickLinks />
      </div>
      u
      <div className="mt-4 min-w-0">
        <AnimatedPanel panelKey={selectedView}>
          <Suspense fallback={<Loader />}>
            {selectedView === "overview" && <OverviewCards />}
            {selectedView === "purchase-expense" && <PurchaseExpenseSection />}
            {selectedView === "revenue" && <RevenueSection />}
            {selectedView === "cashbanks" && <CashAndBank />}
          </Suspense>
        </AnimatedPanel>
      </div>
    </div>
  );
}
