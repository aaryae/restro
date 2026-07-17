import Select from "@/components/Select";
import { TABLE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useMemo, useState } from "react";
import ChooseItems from "./ChooseItems";
import CustomDialog from "@/components/Dialog";
import { buildTableSelectOptions } from "@/utils/tableSelectOptions";
import { ArrowRightLeft } from "lucide-react";

function ChooseTable({
  tableId,
  onClose,
}: {
  tableId: number | null;
  onClose?: () => void;
}) {
  const { data: table } = useGetApiQuery({ url: `${TABLE_URL}list` });
  const [selectedTable, setSelectedTable] = useState<number | null>(tableId);
  const [selectedDesiredTable, setSelectedDesiredTable] = useState<
    number | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { options: tableOptions, getTableLabel } = useMemo(
    () =>
      buildTableSelectOptions(table?.data?.data ?? [], {
        includeEmptyOption: true,
        emptyOptionLabel: "Select Table",
        groupByFloor: true,
      }),
    [table],
  );

  const sameTable =
    !!selectedTable &&
    !!selectedDesiredTable &&
    selectedTable === selectedDesiredTable;

  const canSubmit =
    !!selectedTable && !!selectedDesiredTable && !sameTable;

  const handleReset = () => {
    setSelectedTable(tableId);
    setSelectedDesiredTable(null);
  };

  const handleTransferComplete = () => {
    setDialogOpen(false);
    setSelectedDesiredTable(null);
    onClose?.();
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
            <ArrowRightLeft size={16} />
          </span>
          <p className="text-sm leading-relaxed text-slate-600">
            Select the current table and the destination table, then continue to
            choose which orders to move.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Current Table"
            value={selectedTable ?? ""}
            options={tableOptions}
            resolveLabel={getTableLabel}
            onValueChange={(next) =>
              setSelectedTable(next ? Number(next) : null)
            }
          />

          <div>
            <Select
              label="Desired Table"
              value={selectedDesiredTable ?? ""}
              options={tableOptions}
              resolveLabel={getTableLabel}
              onValueChange={(next) =>
                setSelectedDesiredTable(next ? Number(next) : null)
              }
            />
            {sameTable && (
              <p className="mt-2 text-xs text-rose-600">
                Desired table must be different from the current table.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            className={`inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium text-white transition ${
              canSubmit
                ? "bg-primaryColor hover:bg-primaryColor/90"
                : "cursor-not-allowed bg-slate-300"
            }`}
            onClick={() => setDialogOpen(true)}
          >
            Continue
          </button>
        </div>
      </div>

      <CustomDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        title="Select Orders"
        titleDescription="Choose the orders you want to move to the destination table."
        contentClassName="max-w-2xl"
      >
        <ChooseItems
          selectedTable={selectedTable}
          selectedDesiredTable={selectedDesiredTable}
          onComplete={handleTransferComplete}
        />
      </CustomDialog>
    </>
  );
}

export default ChooseTable;
