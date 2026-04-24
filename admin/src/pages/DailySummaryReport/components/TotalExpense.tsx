import { CurrencySign } from "@/constants";
import { EXPENSE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { Receipt, CreditCard, DollarSign } from "lucide-react";

const TotalExpense = () => {
  const { data: expenseData, isFetching } = useGetApiQuery({
    url: `${EXPENSE_URL}expense-today`,
  });

  const categories = expenseData?.data?.categories || [];
  const totalExpense = expenseData?.data?.totalExpense;

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || "";
    if (name.includes("utilit")) {
      return <DollarSign className="w-5 h-5" />;
    }
    if (name.includes("rent") || name.includes("maintenance")) {
      return <Receipt className="w-5 h-5" />;
    }
    if (name.includes("suppl") || name.includes("equip")) {
      return <CreditCard className="w-5 h-5" />;
    }
    return <Receipt className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4 border border-[#DDDDDD] rounded-lg p-6 bg-white">
      <div className="border-b border-[#DDDDDD] pb-4">
        <p className="text-xl font-bold">
          Total Expense of Today : {CurrencySign}
          {totalExpense?.toLocaleString()}
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
                <span className="text-red-600">
                  {getCategoryIcon(category.categoryName)}
                </span>
                <span className="font-medium text-gray-700">
                  {category.categoryName}
                </span>
              </div>
              <span className="text-red-600 font-semibold text-lg">
                {CurrencySign}
                {category.totalExpense.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-10">No expense data found</p>
      )}
    </div>
  );
};

export default TotalExpense;
