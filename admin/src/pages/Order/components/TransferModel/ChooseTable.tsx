import Button from "@/components/Button";
import CustomDialog from "@/components/Dialog";
import Select from "@/components/Select";
import { TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useMemo, useState } from "react";
import ChooseItems from "./ChooseItems";

function ChooseTable({ tableId }: { tableId: number | null }) {
  const { data: table } = useGetApiQuery({ url: `${TABLE_URL}list` });
  const [selectedTable, setSelectedTable] = useState<number | null>(tableId);
  const [selectedDesiredTable, setSelectedDesiredTable] = useState<
    number | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tableOptions = useMemo(
    () => [
      { value: "", label: "Select Table" },
      ...(table?.data?.data?.map((t: any) => ({
        value: String(t.id),
        label: `${t.floor?.name} - ${t.tableNo}`,
      })) || []),
    ],
    [table],
  );

  const handleCancel = () => {
    setSelectedTable(null);
    setSelectedDesiredTable(null);
  };

  const handleSubmit = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Current Table"
            value={selectedTable ?? ""}
            options={tableOptions}
            onValueChange={(next) =>
              setSelectedTable(next ? Number(next) : null)
            }
          />

          <div>
            <Select
              label="Desired Table"
              value={selectedDesiredTable ?? ""}
              options={tableOptions}
              onValueChange={(next) =>
                setSelectedDesiredTable(next ? Number(next) : null)
              }
            />
            {selectedTable &&
              selectedDesiredTable &&
              selectedTable === selectedDesiredTable && (
                <p className="mt-2 text-xs text-red-500">
                  Desired table must be different from the current table.
                </p>
              )}
          </div>
        </div>

        <div className="flex flex-col justify-end gap-2 sm:flex-row">
          <Button
            type="button"
            className="bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
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
            className="bg-primaryColor px-4 py-2 text-white disabled:bg-gray-400"
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
