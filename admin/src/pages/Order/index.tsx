import { Controller, useForm } from "react-hook-form";
import OrderList from "./components/OrderList";
import TableList from "./components/TableList";
import KotList from "./components/KotList";
import Button from "@/components/Button";
import { useNavigate } from "react-router-dom";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";

export default function Order() {
  const navigate = useNavigate();
  const headerOptions = [
    { label: "Tables", value: "table" },
    { label: "Orders", value: "order" },
    { label: "KOT", value: "kot" },
  ];

  const { control, watch } = useForm<{ accountType: string }>({
    defaultValues: { accountType: "table" },
  });
  const selectedView = watch("accountType");

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <div className="flex space-x-5 p-1 rounded-lg">
              {headerOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex border-2 py-3 px-8 text-base font-medium rounded-md transition-colors ${
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
        <div className="flex items-center w-full sm:w-auto">
          {["table", "order", "kot"].includes(selectedView) && (
            <Button
              className="md:w-full w-auto bg-primaryColor text-white px-6 sm:px-8 rounded-lg py-[12px] sm:py-[10px]"
              handleClick={() => navigate(ORDER_ADD_ROUTE)}
            >
              Create Order
            </Button>
          )}
        </div>
      </div>

      {selectedView === "table" && <TableList />}
      {selectedView === "order" && <OrderList />}
      {selectedView === "kot" && <KotList />}
    </>
  );
}
