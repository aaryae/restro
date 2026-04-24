import { CurrencySign } from "@/constants";
import { PURCHASE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { Package, ShoppingCart, Utensils, Coffee } from "lucide-react";

const TotalPurchase = () => {
  const { data: purchaseData, isFetching } = useGetApiQuery({
    url: `${PURCHASE_URL}purchase-today`,
  });

  const categories = purchaseData?.data?.categories || [];
  const totalPurchase = purchaseData?.data?.totalPurchase;

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (
      name.includes("food") ||
      name.includes("grocery") ||
      name.includes("daily")
    ) {
      return <Utensils className="w-5 h-5" />;
    }
    if (
      name.includes("beverage") ||
      name.includes("drink") ||
      name.includes("coffee")
    ) {
      return <Coffee className="w-5 h-5" />;
    }
    if (name.includes("suppl") || name.includes("equip")) {
      return <Package className="w-5 h-5" />;
    }
    return <ShoppingCart className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4 border border-[#DDDDDD] rounded-lg p-6 bg-white">
      <div className="border-b border-[#DDDDDD] pb-4">
        <p className="text-xl font-bold">
          Total Purchase of Today : {CurrencySign}
          {totalPurchase?.toLocaleString()}
        </p>
      </div>

      {isFetching ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 px-4 border border-[#DDDDDD] rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-orange-600">
                  {getCategoryIcon(category.categoryName)}
                </span>
                <span className="font-medium text-gray-700">
                  {category.categoryName}
                </span>
              </div>
              <span className="text-orange-600 font-semibold text-lg">
                {CurrencySign}
                {category.totalPurchase.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">
          No purchase data found
        </p>
      )}
    </div>
  );
};

export default TotalPurchase;
