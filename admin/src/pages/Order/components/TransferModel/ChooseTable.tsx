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
      <div className="flex flex-col gap-3">
        <div className="flex">
          <div>Current Table:</div>
          <div>
            <select
              className="bg-white border border-gray-300 rounded-md"
              name=""
              id=""
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(Number(e.target.value))}
            >
              <option value="">Select Table</option>
              {table?.data?.data?.map((table: any) => (
                <option key={table.id} value={table.id}>
                  {table.floor?.name} - {table.tableNo}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex">
          <div>Desired Table: </div>
          <div>
            <select
              className="bg-white border border-gray-300 rounded-md"
              name=""
              id=""
              value={selectedDesiredTable || ""}
              onChange={(e) => setSelectedDesiredTable(Number(e.target.value))}
            >
              <option value="">Select Table</option>
              {table?.data?.data?.map((table: any) => (
                <option key={table.id} value={table.id}>
                  {table.floor?.name} - {table.tableNo}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          {/* <Button
            type="button"
            className="bg-red-500 text-white px-4 py-2"
            handleClick={() => {}}
          >
            Cancel
          </Button> */}
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
