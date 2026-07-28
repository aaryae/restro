import { Controller, useForm } from "react-hook-form";
import OrderList from "./components/OrderList";
import TableList from "./components/TableList";
import KotList from "./components/KotList";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";
import CustomDialog from "@/components/Dialog";
import ChooseTable from "./components/TransferModel/ChooseTable";
import { useEffect, useState } from "react";
import { ChefHat, ClipboardList, LayoutGrid, Plus, Repeat } from "lucide-react";

const VIEW_VALUES = ["table", "order", "kot"] as const;
type OrderView = (typeof VIEW_VALUES)[number];

function resolveView(raw: string | null): OrderView {
  if (raw && (VIEW_VALUES as readonly string[]).includes(raw)) {
    return raw as OrderView;
  }
  return "table";
}

export default function Order() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const headerOptions = [
    { label: "Tables", value: "table", icon: LayoutGrid },
    { label: "Orders", value: "order", icon: ClipboardList },
    { label: "KOT", value: "kot", icon: ChefHat },
  ] as const;

  const { control, watch, setValue } = useForm<{ accountType: OrderView }>({
    defaultValues: { accountType: resolveView(searchParams.get("view")) },
  });
  const selectedView = watch("accountType");
  const [contentReady, setContentReady] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fromUrl = resolveView(searchParams.get("view"));
    if (fromUrl !== selectedView) {
      setValue("accountType", fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const current = searchParams.get("view");
    if (selectedView === "table" && (current == null || current === "")) {
      return;
    }
    if (current !== selectedView) {
      const next = new URLSearchParams(searchParams);
      if (selectedView === "table") next.delete("view");
      else next.set("view", selectedView);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedView]);

  useEffect(() => {
    setContentReady(false);
    const timer = window.setTimeout(() => setContentReady(true), 120);
    return () => window.clearTimeout(timer);
  }, [selectedView]);

  return (
    <>
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-3">
        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <div className="flex min-w-0 w-full shrink-0 rounded-full bg-slate-100 p-1 lg:w-auto">
              {headerOptions.map((option) => {
                const Icon = option.icon;
                const isActive = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-all duration-200 sm:px-4 lg:flex-none lg:min-w-[104px] lg:px-5 ${
                      isActive
                        ? "bg-primaryColor text-white shadow-sm"
                        : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                    }`}
                    onClick={() => field.onChange(option.value)}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        <div className="flex min-w-0 w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          {["table", "order", "kot"].includes(selectedView) && (
            <button
              type="button"
              onClick={() => navigate(ORDER_ADD_ROUTE)}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primaryColor bg-primaryColor px-3.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-primaryColor/90 sm:flex-none"
            >
              <Plus size={15} strokeWidth={2.25} className="shrink-0" />
              <span className="truncate">Create Order</span>
            </button>
          )}
          {selectedView === "table" && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-[13px] font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 sm:flex-none"
            >
              <Repeat size={14} strokeWidth={2.25} className="shrink-0" />
              <span className="truncate">Transfer Table</span>
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
