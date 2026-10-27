import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Control,
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Package, Trash2 } from "lucide-react";
import Input from "@/components/Input";
import Select from "@/components/Select";
import CustomDialog from "@/components/Dialog";
import {
  EntityForm,
  FieldHeader,
  FieldIcon,
} from "@/components/EntityForm";
import AddEditSupplier from "@/pages/SuppliersModule/AddEditSupplier";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { STOCK_ITEM_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildQueryString } from "@/utils/generalHelper";
import { Banknote, Boxes, Hash, Ruler, Truck, Type } from "lucide-react";
import { equivalenceLabel, resolveUnitRows } from "@/utils/unitChain";

const emptyToUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

const optionalAmount = z.preprocess(
  emptyToUndef,
  z.coerce.number().min(0).optional(),
);

const StockItemSchema = z
  .object({
    name: z.string().min(1, "Item name is required"),
    measuringUnitId: z.string().min(1, "Measuring unit is required"),
    stockGroupId: z.string().optional(),
    supplierId: z.string().optional(),
    defaultPrice: optionalAmount,
    openingQuantity: optionalAmount,
    lowStockThreshold: optionalAmount,
    accountId: z.string().optional(),
    paymentTerms: z.enum(["cash", "cheque", "credit"]).optional(),
    units: z
      .array(
        z.object({
          measuringUnitId: z.string(),
          ofUnitId: z.string(),
          factor: z.union([z.string(), z.number()]),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    const chain = resolveUnitRows(data.measuringUnitId, data.units || []);
    if (chain.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: chain.error,
        path: ["units"],
      });
    }
    const qty = Number(data.openingQuantity || 0);
    if (qty > 0 && data.supplierId && !data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the cash or bank account used for this purchase",
        path: ["accountId"],
      });
    }
  });

type StockItemFormType = z.infer<typeof StockItemSchema>;

type Props = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
  /** Called after a successful create with the new stock item. */
  onCreated?: (item: {
    id: number;
    name: string;
    defaultPrice: number;
  }) => void;
  /** Prefill supplier when creating from Purchase. */
  defaultSupplierId?: number | string | null;
};

const blankCreateValues = {
  name: "",
  measuringUnitId: "",
  stockGroupId: "",
  supplierId: "",
  defaultPrice: "" as unknown as number | undefined,
  openingQuantity: "" as unknown as number | undefined,
  lowStockThreshold: "" as unknown as number | undefined,
  accountId: "",
  paymentTerms: "cash" as const,
  units: [] as { measuringUnitId: string; ofUnitId: string; factor: string }[],
};

const paymentTermOptions = [
  { label: "Cash", value: "cash" },
  { label: "Cheque", value: "cheque" },
  { label: "Credit", value: "credit" },
];

const StockItemModal: React.FC<Props> = ({
  id: idProp,
  isComponent = true,
  closeModal,
  onSuccess,
  onCreated,
  defaultSupplierId = null,
}) => {
  const id =
    idProp !== undefined && idProp !== null ? String(idProp) : undefined;
  const isEdit = Boolean(id);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StockItemFormType>({
    resolver: zodResolver(StockItemSchema),
    defaultValues: blankCreateValues,
  });

  const { fields: unitFields, append: appendUnit, remove: removeUnit } =
    useFieldArray({ control, name: "units" });
  const unitRows = useWatch({ control, name: "units" }) || [];
  const baseUnitId = useWatch({ control, name: "measuringUnitId" }) || "";
  const previousBaseUnitId = useRef(baseUnitId);

  const openingQuantity = useWatch({ control, name: "openingQuantity" });
  const defaultPrice = useWatch({ control, name: "defaultPrice" });
  const supplierId = useWatch({ control, name: "supplierId" });
  const openingValue =
    Number(openingQuantity || 0) * Number(defaultPrice || 0);
  const needsPayment =
    !isEdit && Number(openingQuantity || 0) > 0 && Boolean(supplierId);

  const unitsUrl = buildQueryString("measuring-unit/list", {
    page: 1,
    limit: 200,
  });
  const groupsUrl = buildQueryString("stock-group/list", {
    page: 1,
    limit: 200,
  });
  const suppliersUrl = buildQueryString("supplier/list", {
    page: 1,
    limit: 200,
  });
  const accountsUrl = buildQueryString("account/list", {
    page: 1,
    limit: 50,
  });

  const { data: unitsResp } = useGetApiQuery({ url: unitsUrl });
  const { data: groupsResp } = useGetApiQuery({ url: groupsUrl });
  const { data: suppliersResp, refetch: refetchSuppliers } = useGetApiQuery({
    url: suppliersUrl,
  });
  const { data: accountsResp } = useGetApiQuery(
    { url: accountsUrl },
    { skip: isEdit },
  );
  const { data: itemResp, isLoading } = useGetApiQuery(
    { url: `${STOCK_ITEM_URL}${id}` },
    { skip: !isEdit },
  );

  const [createApi, { isLoading: creating }] = useCreateApiMutation();
  const [updateApi, { isLoading: updating }] = useUpdateApiMutation();

  const unitOptions = useMemo(
    () =>
      (unitsResp?.data?.data ?? []).map((u: any) => ({
        label: `${u.name} (${u.symbol})`,
        value: String(u.id),
      })),
    [unitsResp],
  );
  const baseUnitLabel = shortUnitLabel(
    unitOptions.find((option) => option.value === baseUnitId)?.label || "",
  );
  const groupOptions = useMemo(
    () =>
      (groupsResp?.data?.data ?? []).map((g: any) => ({
        label: g.name,
        value: String(g.id),
      })),
    [groupsResp],
  );
  const supplierOptions = useMemo(
    () =>
      (suppliersResp?.data?.data ?? []).map((s: any) => ({
        label: s.name,
        value: String(s.id),
      })),
    [suppliersResp],
  );
  const accountOptions = useMemo(() => {
    const rows = accountsResp?.data?.data ?? accountsResp?.data ?? [];
    return (Array.isArray(rows) ? rows : [])
      .filter((a: any) => a?.status === "active" || a?.status == null)
      .map((a: any) => ({
        label: `${a.name}${a.accountType ? ` (${a.accountType})` : ""}`,
        value: String(a.id),
      }));
  }, [accountsResp]);

  useEffect(() => {
    if (!isEdit) {
      reset({
        ...blankCreateValues,
        supplierId: defaultSupplierId ? String(defaultSupplierId) : "",
      });
      return;
    }
    const row = itemResp?.data as any;
    if (!row) return;
    reset({
      name: row.name || "",
      measuringUnitId: row.measuringUnitId ? String(row.measuringUnitId) : "",
      stockGroupId: row.stockGroupId ? String(row.stockGroupId) : "",
      supplierId: row.supplierId ? String(row.supplierId) : "",
      defaultPrice:
        row.defaultPrice == null || row.defaultPrice === ""
          ? ("" as any)
          : Number(row.defaultPrice),
      openingQuantity:
        row.openingQuantity == null || row.openingQuantity === ""
          ? ("" as any)
          : Number(row.openingQuantity),
      lowStockThreshold:
        row.lowStockThreshold == null || row.lowStockThreshold === ""
          ? ("" as any)
          : Number(row.lowStockThreshold),
      accountId: "",
      paymentTerms: "cash",
      units: Array.isArray(row.units)
        ? row.units.map((level: any) => ({
            measuringUnitId: String(level.measuringUnitId),
            ofUnitId: String(level.ofUnitId),
            factor: String(Number(level.factor)),
          }))
        : [],
    });
  }, [isEdit, itemResp, reset, defaultSupplierId]);

  useEffect(() => {
    if (
      previousBaseUnitId.current &&
      baseUnitId &&
      previousBaseUnitId.current !== baseUnitId
    ) {
      setValue("units", []);
    }
    previousBaseUnitId.current = baseUnitId;
  }, [baseUnitId, setValue]);

  const finish = (created?: {
    id: number;
    name: string;
    defaultPrice: number;
  }) => {
    setAddSupplierOpen(false);
    if (created) onCreated?.(created);
    onSuccess?.();
    closeModal?.();
  };

  const onCancel = () => {
    setAddSupplierOpen(false);
    closeModal?.();
  };

  const onSubmit = async (data: StockItemFormType) => {
    const body: Record<string, unknown> = {
      name: data.name,
      measuringUnitId: Number(data.measuringUnitId),
      stockGroupId: data.stockGroupId ? Number(data.stockGroupId) : null,
      supplierId: data.supplierId ? Number(data.supplierId) : null,
      defaultPrice: Number(data.defaultPrice || 0),
      lowStockThreshold:
        data.lowStockThreshold === undefined || data.lowStockThreshold === null
          ? null
          : Number(data.lowStockThreshold),
      units: (data.units || []).map((level) => ({
        measuringUnitId: Number(level.measuringUnitId),
        ofUnitId: Number(level.ofUnitId),
        factor: Number(level.factor),
      })),
    };

    if (!isEdit) {
      const price = Number(data.defaultPrice || 0);
      const qty = Number(data.openingQuantity || 0);
      body.openingQuantity = qty;
      body.openingRate = price;
      if (qty > 0 && data.supplierId) {
        body.accountId = Number(data.accountId);
        body.paymentTerms = data.paymentTerms || "cash";
      }
    }

    try {
      const response = isEdit
        ? await updateApi({
            url: `${STOCK_ITEM_URL}${id}`,
            body,
          }).unwrap()
        : await createApi({ url: STOCK_ITEM_URL, body }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg:
            response?.msg ||
            response?.message ||
            (isEdit
              ? "Stock item updated successfully."
              : "Stock item created successfully."),
        },
        onSuccess: () => {
          const created =
            !isEdit && response?.data?.id != null
              ? {
                  id: Number(response.data.id),
                  name: String(response.data.name || data.name),
                  defaultPrice: Number(
                    response.data.defaultPrice ?? data.defaultPrice ?? 0,
                  ),
                }
              : undefined;
          finish(created);
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <>
      <EntityForm
        title={isEdit ? "Edit Stock Item" : "Create Stock Item"}
        sectionTitle="Stock item details"
        description="Base unit, pack sizes, pricing, and opening stock."
        icon={Package}
        embedded={isComponent}
        columns={2}
        maxWidthClass="max-w-4xl"
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onCancel}
        isSaving={isSubmitting || creating || updating}
        isLoading={isEdit && isLoading && !itemResp}
        submitLabel={isEdit ? "Update Item" : "Save Item"}
      >
        <Input
          label="Item Name"
          placeholder="Enter name of stock"
          leftSection={<FieldIcon icon={Type} />}
          {...register("name")}
          error={errors.name?.message}
          isRequired
        />
        <Controller
          name="measuringUnitId"
          control={control}
          render={({ field }) => (
            <Select
              label="Measuring Unit"
              options={unitOptions}
              value={field.value}
              onValueChange={field.onChange}
              placeholder="Select unit"
              leftSection={<FieldIcon icon={Ruler} />}
              isRequired
              error={errors.measuringUnitId?.message}
            />
          )}
        />
        <Input
          label="Default Price (Rs)"
          type="number"
          step="0.01"
          min={0}
          placeholder="e.g. 100"
          leftSection={<FieldIcon icon={Banknote} />}
          {...register("defaultPrice")}
          error={errors.defaultPrice?.message as string | undefined}
        />
        <Controller
          name="stockGroupId"
          control={control}
          render={({ field }) => (
            <Select
              label="Group"
              options={groupOptions}
              value={field.value || ""}
              onValueChange={field.onChange}
              placeholder="Select group (optional)"
              leftSection={<FieldIcon icon={Boxes} />}
              clearable
              clearLabel="No group"
              error={errors.stockGroupId?.message}
            />
          )}
        />
        <div className="flex min-w-0 flex-col">
          <FieldHeader
            label="Supplier"
            actions={
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1 rounded-md bg-primaryColor px-2 text-[11px] font-medium text-white transition hover:bg-primaryColor/90"
                onClick={() => setAddSupplierOpen(true)}
              >
                <Plus size={12} strokeWidth={2.5} />
                Add
              </button>
            }
          />
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <Select
                options={supplierOptions}
                value={field.value || ""}
                onValueChange={field.onChange}
                placeholder="Select supplier (optional)"
                leftSection={<FieldIcon icon={Truck} />}
                clearable
                clearLabel="No supplier"
                error={errors.supplierId?.message}
              />
            )}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <Input
            label="Low Stock Threshold"
            type="number"
            step="0.01"
            min={0}
            placeholder="e.g. 10"
            leftSection={<FieldIcon icon={Hash} />}
            {...register("lowStockThreshold")}
            error={errors.lowStockThreshold?.message as string | undefined}
          />
          <p className="text-[11px] leading-snug text-[var(--serve-muted)]">
            When quantity falls to this level or below, the item counts toward
            Low Stock. Leave blank to ignore. The threshold uses the base unit.
          </p>
        </div>

        <UnitRelations
          control={control}
          fields={unitFields}
          rows={unitRows}
          baseUnitId={baseUnitId}
          unitOptions={unitOptions}
          error={
            (errors.units as { message?: string; root?: { message?: string } })
              ?.message ||
            (errors.units as { root?: { message?: string } })?.root?.message
          }
          onAdd={() => {
            const previous = unitRows[unitRows.length - 1];
            appendUnit({
              measuringUnitId: "",
              ofUnitId: previous?.measuringUnitId || baseUnitId,
              factor: "",
            });
          }}
          onRemove={removeUnit}
        />

        {!isEdit ? (
          <div className="md:col-span-2 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-4">
            <h4 className="mb-3 text-sm font-semibold text-[var(--serve-fg)]">
              Opening Stock
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Quantity"
                type="number"
                step="0.01"
                min={0}
                placeholder="0"
                {...register("openingQuantity")}
                error={errors.openingQuantity?.message as string | undefined}
              />
              <Input
                label="Value (Rs)"
                type="number"
                value={openingValue.toFixed(2)}
                disabled
              />
            </div>
            <p className="mt-2 text-[11px] leading-snug text-[var(--serve-muted)]">
              Quantity is counted in the base unit
              {baseUnitLabel ? ` (${baseUnitLabel})` : ""}. Value is Quantity ×
              Default Price. Using a name that already exists creates a new
              stock row. Supplier is optional.
            </p>

            {needsPayment ? (
              <div className="mt-4 space-y-4 border-t border-[var(--serve-border)] pt-4">
                <p className="text-[12px] leading-snug text-[var(--serve-muted)]">
                  A supplier is optional. With a supplier, this quantity is a
                  purchase and the account you choose is charged. Without a
                  supplier, the quantity is added and the info note shows it
                  is not from a supplier. A second Meat stays separate until
                  you press Sync on the stock list.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="accountId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Pay From Account"
                        options={accountOptions}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select account"
                        isRequired
                        error={errors.accountId?.message}
                      />
                    )}
                  />
                  <Controller
                    name="paymentTerms"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Payment Terms"
                        options={paymentTermOptions}
                        value={field.value || "cash"}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </EntityForm>

      <CustomDialog
        buttonTitle={null}
        dialogOpen={addSupplierOpen}
        setDialogOpen={setAddSupplierOpen}
        title="Add New Supplier"
        nested
        closeOnOutsideClick={false}
        contentClassName="max-h-none max-w-lg gap-3 overflow-hidden p-5 sm:p-5"
      >
        <AddEditSupplier
          isComponent={true}
          closeModal={async (created?: any) => {
            setAddSupplierOpen(false);
            await refetchSuppliers();
            const createdId = created?.id;
            if (createdId != null) {
              setValue("supplierId", String(createdId), {
                shouldValidate: true,
              });
            }
          }}
        />
      </CustomDialog>
    </>
  );
};

const shortUnitLabel = (label: string) => {
  const match = label.match(/\(([^)]+)\)\s*$/);
  return match?.[1] || label;
};

function UnitRelations({
  control,
  fields,
  rows,
  baseUnitId,
  unitOptions,
  error,
  onAdd,
  onRemove,
}: {
  control: Control<StockItemFormType>;
  fields: { id: string }[];
  rows: {
    measuringUnitId?: string;
    ofUnitId?: string;
    factor?: string | number;
  }[];
  baseUnitId: string;
  unitOptions: { label: string; value: string }[];
  error?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const labelOf = (id: string) => {
    const match = unitOptions.find((option) => option.value === id);
    return match ? shortUnitLabel(match.label) : "";
  };
  const baseLabel = labelOf(baseUnitId);
  const preview = equivalenceLabel(
    baseUnitId,
    baseLabel,
    rows.map((row) => ({
      measuringUnitId: row.measuringUnitId || "",
      ofUnitId: row.ofUnitId || "",
      factor: row.factor || "",
    })),
    labelOf,
  );

  return (
    <div className="md:col-span-2 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-4">
      <FieldHeader
        label="Unit relations"
        actions={
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-md bg-primaryColor px-2 text-[11px] font-medium text-white transition hover:bg-primaryColor/90 disabled:opacity-50"
            disabled={!baseUnitId}
            onClick={onAdd}
          >
            <Plus size={12} strokeWidth={2.5} />
            Add larger unit
          </button>
        }
      />
      <p className="mb-3 text-[11px] leading-snug text-[var(--serve-muted)]">
        Stock is stored in the base unit. Add how larger units break down, for
        example 1 packet = 20 piece and 1 dozen = 12 packet. Selling one piece
        then reduces the piece, packet, and dozen counts together.
      </p>

      {fields.length === 0 ? (
        <p className="text-sm text-slate-500">
          No larger units. This item is counted only in{" "}
          {baseLabel || "its base unit"}.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const usedElsewhere = new Set(
              rows
                .filter((_, rowIndex) => rowIndex !== index)
                .map((row) => row.measuringUnitId)
                .filter(Boolean),
            );
            const largerOptions = unitOptions.filter(
              (option) =>
                option.value !== baseUnitId &&
                option.value !== rows[index]?.ofUnitId &&
                !usedElsewhere.has(option.value),
            );
            const containedIds = new Set<string>(
              baseUnitId ? [baseUnitId] : [],
            );
            rows.forEach((row, rowIndex) => {
              if (rowIndex !== index && row.measuringUnitId) {
                containedIds.add(row.measuringUnitId);
              }
            });
            const containedOptions = unitOptions.filter(
              (option) =>
                containedIds.has(option.value) &&
                option.value !== rows[index]?.measuringUnitId,
            );
            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface)] p-3 sm:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)_auto]"
              >
                <Controller
                  name={`units.${index}.measuringUnitId`}
                  control={control}
                  render={({ field: unitField }) => (
                    <Select
                      label="1 of"
                      options={largerOptions}
                      value={unitField.value || ""}
                      onValueChange={unitField.onChange}
                      placeholder="Larger unit"
                    />
                  )}
                />
                <Controller
                  name={`units.${index}.factor`}
                  control={control}
                  render={({ field: factorField }) => (
                    <Input
                      label="contains"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="12"
                      value={factorField.value ?? ""}
                      onChange={factorField.onChange}
                    />
                  )}
                />
                <Controller
                  name={`units.${index}.ofUnitId`}
                  control={control}
                  render={({ field: ofField }) => (
                    <Select
                      label="of"
                      options={containedOptions}
                      value={ofField.value || ""}
                      onValueChange={ofField.onChange}
                      placeholder="Smaller unit"
                    />
                  )}
                />
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center self-end rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                  onClick={() => onRemove(index)}
                  title="Remove unit"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {preview ? (
        <p className="mt-3 text-sm font-medium text-slate-700">{preview}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export default StockItemModal;
