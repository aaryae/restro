import { CurrencySign } from "@/constants";
import { PURCHASE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { Coffee, Package, ShoppingCart, Utensils } from "lucide-react";
import { ReportEmptyState, ReportSection } from "./ReportUI";

interface TotalPurchaseProps {
  dateParams?: string;
  periodLabel?: string;
}

const TotalPurchase = ({
  dateParams = "",
  periodLabel = "Today",
}: TotalPurchaseProps) => {
  const { data: purchaseData, isFetching } = useGetApiQuery({
    url: `${PURCHASE_URL}purchase-today${dateParams ? `?${dateParams}` : ""}`,
  });

  const categories = purchaseData?.data?.categories || [];
  const totalPurchase = purchaseData?.data?.totalPurchase ?? 0;

  const category1 = categories.find((cat: any) => cat.id === 6);
  const otherCategories = categories.filter((cat: any) => cat.id !== 6);
  const othersTotal = otherCategories.reduce(
    (sum: number, cat: any) => sum + (cat.totalPurchase || 0),
    0,
  );

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (
      name.includes("food") ||
      name.includes("grocery") ||
      name.includes("daily")
    ) {
      return <Utensils className="h-3.5 w-3.5" />;
    }
    if (
      name.includes("beverage") ||
      name.includes("drink") ||
      name.includes("coffee")
    ) {
      return <Coffee className="h-3.5 w-3.5" />;
    }
    if (name.includes("suppl") || name.includes("equip")) {
      return <Package className="h-3.5 w-3.5" />;
    }
    return <ShoppingCart className="h-3.5 w-3.5" />;
  };

  const hasRows = Boolean(category1) || othersTotal > 0;

  return (
    <ReportSection
      title={`Purchases · ${periodLabel}`}
      total={Number(totalPurchase)}
      totalTone="orange"
    >
      {isFetching ? (
        <div className="py-6 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !hasRows ? (
        <ReportEmptyState
          compact
          icon={ShoppingCart}
          title="No purchases"
          description="None recorded for this day."
        />
      ) : (
        <div className="space-y-2">
          {category1 && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                  {getCategoryIcon(category1.categoryName)}
                </span>
                <span className="text-[13px] font-medium text-slate-700">
                  {category1.categoryName}
                </span>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-orange-600">
                {CurrencySign}
                {Number(category1.totalPurchase).toLocaleString()}
              </span>
            </div>
          )}
          {othersTotal > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </span>
                <span className="text-[13px] font-medium text-slate-700">
                  Others
                </span>
              </div>
              <span className="text-[13px] font-semibold tabular-nums text-orange-600">
                {CurrencySign}
                {othersTotal.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </ReportSection>
  );
};

export default TotalPurchase;
