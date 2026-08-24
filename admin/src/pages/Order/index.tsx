import { Controller, useForm } from "react-hook-form";
import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";
import {
  ChefHat,
  ClipboardList,
  LayoutGrid,
  Plus,
  UtensilsCrossed,
} from "lucide-react";
import Loader from "@/components/Loader";
import "./posBrand.css";

const TableList = lazy(() => import("./components/TableList"));
const OrderList = lazy(() => import("./components/OrderList"));
const KotList = lazy(() => import("./components/KotList"));

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
      <div className="pos-panel rounded-xl p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="pos-header-badge inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <UtensilsCrossed size={20} />
            </span>
            <div className="min-w-0">
              <h1 className="pos-header-title truncate">Point of Sale</h1>
              <p className="pos-header-sub mt-0.5">
                Floor, orders, and kitchen tickets in one workspace
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
            <Controller
              name="accountType"
              control={control}
              render={({ field }) => (
                <div className="pos-segment inline-flex min-w-0 w-full rounded-lg p-1 sm:w-auto">
                  {headerOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = field.value === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className="pos-segment-item flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium sm:flex-none sm:px-4"
                        data-active={isActive}
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
            <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(ORDER_ADD_ROUTE)}
                className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primaryColor px-3.5 text-[13px] font-medium text-white transition hover:bg-primaryColor/90 sm:flex-none"
              >
                <Plus size={15} strokeWidth={2.25} className="shrink-0" />
                <span className="truncate">Create Order</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`pos-panel mt-3 rounded-xl p-2 transition-opacity duration-300 ease-out sm:p-3 ${
          contentReady ? "opacity-100" : "opacity-0"
        }`}
      >
        <Suspense fallback={<Loader />}>
          {selectedView === "table" && <TableList />}
          {selectedView === "order" && <OrderList />}
          {selectedView === "kot" && <KotList />}
        </Suspense>
      </div>
    </>
  );
}
