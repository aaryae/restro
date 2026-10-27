import { useMemo } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormSetValue,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { FieldHeader } from "@/components/EntityForm";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";

type RecipeRow = {
  stockItemId: string;
  measuringUnitId: string;
  quantity?: number | string;
};

type FormShape = {
  recipes?: RecipeRow[];
};

type UnitRef = { id: number; name: string; symbol: string };

type GlobalUnit = UnitRef & {
  equalsUnitId?: number | null;
  equalsFactor?: number | string | null;
  equalsCount?: number | string | null;
};

type StockRow = {
  id: number;
  name: string;
  isNewStock?: boolean;
  measuringUnitId: number;
  measuringUnit?: UnitRef;
  units?: {
    measuringUnitId: number;
    factorToBase?: number | string | null;
    measuringUnit?: UnitRef;
  }[];
};

const reachesBase = (
  unitId: number,
  baseId: number,
  stock: Map<number, number>,
  globals: Map<number, GlobalUnit>,
  seen = new Set<number>(),
): boolean => {
  if (unitId === baseId || stock.has(unitId)) return true;
  if (seen.has(unitId)) return false;
  const unit = globals.get(unitId);
  const next = Number(unit?.equalsUnitId);
  const right = Number(unit?.equalsFactor);
  const left = Number(unit?.equalsCount) || 1;
  if (!next || !(right > 0) || !(left > 0)) return false;
  seen.add(unitId);
  return reachesBase(next, baseId, stock, globals, seen);
};

const unitChoices = (item: StockRow | undefined, globals: GlobalUnit[]) => {
  if (!item?.measuringUnit) return [];
  const baseId = Number(item.measuringUnitId);
  const stock = new Map<number, number>();
  const direct = new Set<number>([baseId]);
  for (const level of item.units || []) {
    const id = Number(level.measuringUnit?.id || level.measuringUnitId);
    if (!id) continue;
    direct.add(id);
    if (level.factorToBase != null && level.factorToBase !== "") {
      stock.set(id, Number(level.factorToBase));
    }
  }
  const byId = new Map(globals.map((unit) => [unit.id, unit]));
  const candidates = new Map<number, UnitRef>();
  candidates.set(baseId, item.measuringUnit);
  for (const level of item.units || []) {
    if (level.measuringUnit) candidates.set(level.measuringUnit.id, level.measuringUnit);
  }
  for (const unit of globals) candidates.set(unit.id, unit);

  return [...candidates.values()]
    .filter(
      (unit) =>
        direct.has(unit.id) ||
        reachesBase(unit.id, baseId, stock, byId),
    )
    .map((unit) => ({
      label: `${unit.name} (${unit.symbol})`,
      value: String(unit.id),
    }));
};

export default function ProductRecipes({
  control,
  errors,
  setValue,
  note = "Piece, packet, and dozen on Cigarette come from that stock item: Piece is the base unit, and packet and dozen are its pack sizes. A unit related on Measuring Unit, such as 1 liter = 1 piece, appears here too and deducts that many pieces.",
}: {
  control: Control<FormShape>;
  errors: FieldErrors<FormShape>;
  setValue: UseFormSetValue<FormShape>;
  note?: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "recipes",
  });
  const recipes = useWatch({ control, name: "recipes" }) || [];

  const { data } = useGetApiQuery({
    url: buildQueryString("stock-item/list", { page: 1, limit: 300 }),
  });
  const { data: unitList } = useGetApiQuery({
    url: buildQueryString("measuring-unit/list", { page: 1, limit: 300 }),
  });

  const stockItems: StockRow[] = data?.data?.data ?? [];
  const globalUnits: GlobalUnit[] = unitList?.data?.data ?? [];
  const stockOptions = useMemo(
    () =>
      stockItems.map((item) => ({
        label: item.isNewStock ? `${item.name} (New stock)` : item.name,
        value: String(item.id),
      })),
    [stockItems],
  );
  const byId = useMemo(() => {
    const map = new Map<string, StockRow>();
    stockItems.forEach((item) => map.set(String(item.id), item));
    return map;
  }, [stockItems]);

  const listError = errors.recipes as
    | { message?: string; root?: { message?: string } }
    | undefined;
  const recipeError = listError?.message || listError?.root?.message;

  return (
    <div className="md:col-span-2 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-4">
      <FieldHeader
        label="Inventory used when this is sold"
        actions={
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-md bg-primaryColor px-2 text-[11px] font-medium text-white transition hover:bg-primaryColor/90"
            onClick={() =>
              append({
                stockItemId: "",
                measuringUnitId: "",
                quantity: "",
              })
            }
          >
            <Plus size={12} strokeWidth={2.5} />
            Add ingredient
          </button>
        }
      />
      <p className="mb-3 text-[11px] leading-snug text-[var(--serve-muted)]">
        {note}
      </p>

      {fields.length === 0 ? (
        <p className="text-sm text-slate-500">
          No inventory linked yet. Sales of this item will not change stock.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const selected = byId.get(String(recipes[index]?.stockItemId || ""));
            const rowErrors = (
              errors.recipes as
                | {
                    stockItemId?: { message?: string };
                    measuringUnitId?: { message?: string };
                    quantity?: { message?: string };
                  }[]
                | undefined
            )?.[index];
            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] p-3 sm:grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1fr)_auto]"
              >
                <Controller
                  name={`recipes.${index}.stockItemId`}
                  control={control}
                  render={({ field: stockField }) => (
                    <Select
                      label="Stock item"
                      options={stockOptions}
                      value={stockField.value || ""}
                      onValueChange={(value) => {
                        stockField.onChange(value);
                        const item = byId.get(value);
                        const allowed = new Set(
                          unitChoices(item, globalUnits).map(
                            (option) => option.value,
                          ),
                        );
                        const current = String(
                          recipes[index]?.measuringUnitId || "",
                        );
                        if (item && !allowed.has(current)) {
                          setValue(
                            `recipes.${index}.measuringUnitId`,
                            String(item.measuringUnitId),
                            { shouldValidate: true, shouldDirty: true },
                          );
                        }
                      }}
                      placeholder="Select stock"
                      error={rowErrors?.stockItemId?.message}
                      isRequired
                    />
                  )}
                />
                <Controller
                  name={`recipes.${index}.quantity`}
                  control={control}
                  render={({ field: qtyField }) => (
                    <Input
                      label="Quantity"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="5"
                      value={qtyField.value ?? ""}
                      onChange={qtyField.onChange}
                      error={rowErrors?.quantity?.message}
                      isRequired
                    />
                  )}
                />
                <Controller
                  name={`recipes.${index}.measuringUnitId`}
                  control={control}
                  render={({ field: unitField }) => (
                    <Select
                      label="Unit"
                      options={unitChoices(selected, globalUnits)}
                      value={unitField.value || ""}
                      onValueChange={unitField.onChange}
                      placeholder="Unit"
                      error={rowErrors?.measuringUnitId?.message}
                      isRequired
                    />
                  )}
                />
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center self-end rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                  onClick={() => remove(index)}
                  title="Remove ingredient"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {recipeError ? (
        <p className="mt-2 text-xs text-rose-600">{recipeError}</p>
      ) : null}
    </div>
  );
}
