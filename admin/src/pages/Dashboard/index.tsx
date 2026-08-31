import { format, getHours } from "date-fns";
import { lazy, Suspense, useState } from "react";
import { useAppSelector } from "@/redux/store/hooks";
import { useForm, Controller } from "react-hook-form";
import DashboardViewTabs, {
  type DashboardView,
} from "./components/DashboardViewTabs";
import DashboardQuickLinks from "./components/DashboardQuickLinks";
import AnimatedPanel from "./components/AnimatedPanel";
import Loader from "@/components/Loader";
import "./dashboard.css";

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
  const [revenueMountKey, setRevenueMountKey] = useState(0);

  return (
    <div className="dash w-full min-w-0 max-w-full overflow-x-hidden">
      <header className="dash-hero">
        <div className="dash-hello">
          <h1 className="dash-title">
            Good {getPartOfDay()}, <span>{userName}</span>
          </h1>
          <p className="dash-date">{todayDate}</p>
        </div>

        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <DashboardViewTabs
              value={field.value}
              onChange={(view) => {
                field.onChange(view);
                if (view === "revenue") {
                  setRevenueMountKey((key) => key + 1);
                }
              }}
            />
          )}
        />
      </header>

      <DashboardQuickLinks />

      <div className="min-w-0">
        <AnimatedPanel panelKey={selectedView}>
          <Suspense fallback={<Loader />}>
            {selectedView === "overview" && <OverviewCards />}
            {selectedView === "purchase-expense" && <PurchaseExpenseSection />}
            {selectedView === "revenue" && (
              <RevenueSection key={revenueMountKey} />
            )}
            {selectedView === "cashbanks" && <CashAndBank />}
          </Suspense>
        </AnimatedPanel>
      </div>
    </div>
  );
}
