import { Controller, useForm } from "react-hook-form";
import OrderList from "./components/OrderList";
import TableList from "./components/TableList";
import KotList from "./components/KotList";
import Button from "@/components/Button";

export default function Order() {
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
                    ? "bg-blue-500 text-white border-none"
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

      {selectedView === "table" && <TableList />}
      {selectedView === "order" && <OrderList />}
      {selectedView === "kot" && <KotList />}
    </>
  );
}
