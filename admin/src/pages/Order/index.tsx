import { Controller, useForm } from "react-hook-form";
import OrderList from "./components/OrderList";
import TableList from "./components/TableList";
import KotList from "./components/KotList";
import Button from "@/components/Button";
import { useNavigate } from "react-router-dom";
import { ORDER_ADD_ROUTE } from "@/routes/routeNames";
import CustomDialog from "@/components/Dialog";
import ChooseTable from "./components/TransferModel/ChooseTable";
import { useState } from "react";

export default function Order() {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const headerOptions = [
    { label: "Tables", value: "table" },
    { label: "Orders", value: "order" },
    { label: "KOT", value: "kot" },
  ];

  const { control, watch } = useForm<{ accountType: string }>({
    defaultValues: { accountType: "table" },
  });
  const selectedView = watch("accountType");

  const [dialogOpen, setDialogOpen] = useState(false);

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
        <div className="flex md:justify-end items-center gap-3 grow">
          {["table", "order", "kot"].includes(selectedView) && (
            <Button
              className="md:w-fit w-auto bg-primaryColor text-white px-6 sm:px-8 rounded-lg py-[12px] sm:py-[10px]"
              handleClick={() => navigate(ORDER_ADD_ROUTE)}
            >
              Create Order
            </Button>
          )}
          {selectedView === "table" && (
            <Button
              className="md:w-fit w-fit bg-primaryColor text-white px-6 sm:px-8 rounded-lg py-[12px] sm:py-[10px]"
              handleClick={() => setDialogOpen(true)}
            >
              Transfer Table
            </Button>
          )}
        </div>
      </div>

      {selectedView === "table" && <TableList />}
      {selectedView === "order" && <OrderList />}
      {selectedView === "kot" && <KotList />}
      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Choose Table"
        contentClassName="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-auto p-2 sm:p-4"
      >
        <ChooseTable tableId={selectedTable} />
      </CustomDialog>
    </>
  );
}
