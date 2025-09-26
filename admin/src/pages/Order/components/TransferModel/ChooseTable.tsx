import Button from "@/components/Button";
import CustomDialog from "@/components/Dialog";
import { TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useState } from "react";
import ChooseItems from "./ChooseItems";

function ChooseTable({ tableId }: { tableId: number | null }) {
  const { data: table } = useGetApiQuery({ url: `${TABLE_URL}list` });
  const [selectedTable, setSelectedTable] = useState<number | null>(tableId);
  const [selectedDesiredTable, setSelectedDesiredTable] = useState<
    number | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleCancel = () => {
    setSelectedTable(null);
    setSelectedDesiredTable(null);
  };
  const handleSubmit = () => {
    console.log("clicked");

    setDialogOpen(true);
  };
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Current Table</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaryColor focus:border-primaryColor"
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(Number(e.target.value))}
            >
              <option value="">Select Table</option>
              {table?.data?.data?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.floor?.name} - {t.tableNo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Desired Table</label>
            <select
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaryColor focus:border-primaryColor"
              value={selectedDesiredTable || ""}
              onChange={(e) => setSelectedDesiredTable(Number(e.target.value))}
            >
              <option value="">Select Table</option>
              {table?.data?.data?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.floor?.name} - {t.tableNo}
                </option>
              ))}
            </select>
            {selectedTable &&
              selectedDesiredTable &&
              selectedTable === selectedDesiredTable && (
                <p className="mt-2 text-xs text-red-500">
                  Desired table must be different from the current table.
                </p>
              )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            type="button"
            className="bg-gray-200 text-gray-800 px-4 py-2 hover:bg-gray-300"
            handleClick={handleCancel}
          >
            Reset
          </Button>
          <Button
            disabled={
              !selectedTable ||
              !selectedDesiredTable ||
              selectedTable === selectedDesiredTable
            }
            type="button"
            className="bg-primaryColor text-white px-4 py-2 disabled:bg-gray-400"
            handleClick={() => handleSubmit()}
          >
            Submit
          </Button>
        </div>
      </div>
      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Change Details"
        contentClassName="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-auto p-2 sm:p-4"
      >
        <ChooseItems
          selectedTable={selectedTable}
          selectedDesiredTable={selectedDesiredTable}
          onComplete={() => setDialogOpen(false)}
        />
      </CustomDialog>
    </>
  );
}

export default ChooseTable;
