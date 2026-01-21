import Button from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencySign } from "@/constants";
import { ORDER_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useCheckoutOrderMutation } from "@/redux/services/orders";
import { buildQueryString } from "@/utils/generalHelper";
import { useState } from "react";

interface Account {
  id: string;
  name: string;
  accountType: string;
  amount: number;
  isSelected: boolean;
}

interface SplitPaymentProps {
  id: number | [number] | null;
  setSplitPaymentData: React.Dispatch<any>;
  closeSplitPayment: () => void;
}

function SplitPayment({
  id,
  setSplitPaymentData,
  closeSplitPayment,
}: SplitPaymentProps) {
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});

  const [checkoutOrderApi] = useCheckoutOrderMutation();
  const { data: tableOrder } = useGetApiQuery(
    { url: `${ORDER_URL}active-orders/${id}` },
    // { url: `order/${id}?itemStatus=active` },

    { skip: id === null || id === undefined },
  );

  const url = buildQueryString("account/list", { page: 1, limit: 99999 });
  const { data: allAccount, isSuccess: accountSuccess } = useGetApiQuery({
    url,
  });

  const handleAmountChange = (
    accountId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    if (Number.isNaN(Number(value))) return;
    setAmounts((prev) => ({
      ...prev,
      [accountId]: value,
    }));
  };

  const calculateRemaining = (): number => {
    const totalPaid = Object.values(amounts).reduce((sum, amount) => {
      return sum + (parseFloat(amount) || 0);
    }, 0);

    const grandTotal = tableOrder?.data?.totalAmount || 0;
    return grandTotal - totalPaid;
  };

  const getTotalPaid = () => {
    return Object.values(amounts).reduce((sum, amount) => {
      return sum + (parseFloat(amount) || 0);
    }, 0);
  };

  const findPaymentType = (accountId: string) => {
    let type = allAccount?.data?.data?.find(
      (a: any) => a.id == accountId,
    )?.accountType;
    if (type != "cash") {
      type = "online";
    }
    return type;
  };
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Split Payment</h2>
        <div className="text-right">
          <div className="text-sm text-gray-500">Grand Total</div>
          <div className="text-2xl font-bold text-green-600">
            {CurrencySign}

            {tableOrder?.data?.sessionTotal || "0.00"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {accountSuccess &&
                  allAccount?.data?.data?.map((account: any) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex gap-4 items-center">
                          <label
                            htmlFor={account.id}
                            className="text-lg font-semibold text-gray-900 cursor-pointer"
                          >
                            {account.name}
                          </label>
                          <p className="text-sm text-gray-500">
                            {account.accountType}
                          </p>
                        </div>
                      </div>

                      <div className="w-32">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            {CurrencySign}
                          </span>
                          <input
                            type="number"
                            className="pl-6 text-right border rounded-md p-2 w-full bg-white"
                            placeholder="0.00"
                            value={amounts[account.id] || ""}
                            onChange={(e) => handleAmountChange(account.id, e)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Grand Total:</span>
                  <span className="font-medium">
                    {CurrencySign}
                    {tableOrder?.data?.sessionTotal?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium">
                    {CurrencySign}
                    {getTotalPaid()}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>Remaining:</span>
                    <span
                      className={
                        calculateRemaining() > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {CurrencySign}
                      {calculateRemaining()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    handleClick={async () => {
                      const payments = Object.entries(amounts)
                        .map(([accountId, amount]) => ({
                          paymentMethod: findPaymentType(accountId),
                          amount: Number(amount),
                          accountId: Number(accountId),
                        }))
                        .filter((acc) => acc.amount > 0);
                      setSplitPaymentData(payments);
                      closeSplitPayment();
                    }}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={calculateRemaining() !== 0}
                    style={{
                      backgroundColor: "#2563eb",
                      color: "white",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      width: "100%",
                      marginTop: "1rem",
                      cursor:
                        calculateRemaining() !== 0 ? "not-allowed" : "pointer",
                      opacity: calculateRemaining() !== 0 ? 0.7 : 1,
                    }}
                  >
                    Confirm Payment
                  </Button>
                </div>
              </div>
              <p className="text-sm mt-3 font-semibold text-left text-red-500">
                *Since no user is assigned, the total amount should be equal to
                the total billed amount.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SplitPayment;
