import { Controller, useForm } from "react-hook-form";
import OrderList from "./components/OrderList";
import TableList from "./components/TableList";
import KotList from "./components/KotList";
import { useNavigate } from "react-router-dom";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";
import CustomDialog from "@/components/Dialog";
import ChooseTable from "./components/TransferModel/ChooseTable";
import { useEffect, useRef, useState } from "react";
import { ChefHat, ClipboardList, LayoutGrid, Plus, Repeat } from "lucide-react";

export default function Order() {
  const navigate = useNavigate();
  const headerOptions = [
    { label: "Tables", value: "table", icon: LayoutGrid },
    { label: "Orders", value: "order", icon: ClipboardList },
    { label: "KOT", value: "kot", icon: ChefHat },
  ] as const;

  const { control, watch } = useForm<{ accountType: string }>({
    defaultValues: { accountType: "table" },
  });
  const selectedView = watch("accountType");
  const [contentReady, setContentReady] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    setContentReady(false);
    const timer = window.setTimeout(() => setContentReady(true), 120);
    return () => window.clearTimeout(timer);
  }, [selectedView]);

  useEffect(() => {
    const activeIndex = headerOptions.findIndex(
      (option) => option.value === selectedView,
    );
    const activeTab = tabsRef.current[activeIndex];
    if (!activeTab) return;

    setIndicator({
      left: activeTab.offsetLeft,
      width: activeTab.offsetWidth,
    });
  }, [selectedView]);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-3">
        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <div className="relative flex w-full rounded-full bg-slate-100 p-1 sm:w-auto">
              <span
                className="absolute top-1 bottom-1 rounded-full bg-primaryColor shadow-sm transition-all duration-300 ease-out"
                style={{
                  left: indicator.left,
                  width: indicator.width,
                }}
              />
              {headerOptions.map((option, index) => {
                const Icon = option.icon;
                const isActive = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    ref={(el) => {
                      tabsRef.current[index] = el;
                    }}
                    className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300 sm:flex-none sm:min-w-[104px] sm:px-5 ${
                      isActive
                        ? "text-white"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    onClick={() => field.onChange(option.value)}
                  >
                    <Icon size={15} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        />
        <div className="flex grow items-center gap-2 md:justify-end">
          {["table", "order", "kot"].includes(selectedView) && (
            <button
              type="button"
              onClick={() => navigate(ORDER_ADD_ROUTE)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primaryColor bg-primaryColor px-3.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-primaryColor/90"
            >
              <Plus size={15} strokeWidth={2.25} />
              Create Order
            </button>
          )}
          {selectedView === "table" && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-[13px] font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
            >
              <Repeat size={14} strokeWidth={2.25} />
              Transfer Table
            </button>
          )}
        </div>
      </div>

      <div
        className={`mt-2 rounded-xl border border-slate-200/80 bg-white p-2 transition-opacity duration-300 ease-out ${
          contentReady ? "opacity-100" : "opacity-0"
        }`}
      >
        {selectedView === "table" && <TableList />}
        {selectedView === "order" && <OrderList />}
        {selectedView === "kot" && <KotList />}
      </div>
      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Transfer Table"
        titleDescription="Move orders from one table to another."
        contentClassName="max-w-xl"
      >
        <ChooseTable
          tableId={null}
          onClose={() => setDialogOpen(false)}
        />
      </CustomDialog>
    </>
  );
}
