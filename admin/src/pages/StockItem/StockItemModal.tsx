import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Package } from "lucide-react";
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
  })
  .superRefine((data, ctx) => {
    const qty = Number(data.openingQuantity || 0);
    if (qty <= 0) return;
    if (!data.accountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the cash or bank account used for this purchase",
        path: ["accountId"],
      });
    }
    if (!data.supplierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Supplier is required when quantity is greater than 0",
        path: ["supplierId"],
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

  const openingQuantity = useWatch({ control, name: "openingQuantity" });
  const defaultPrice = useWatch({ control, name: "defaultPrice" });
  const openingValue =
    Number(openingQuantity || 0) * Number(defaultPrice || 0);
  const needsPayment = !isEdit && Number(openingQuantity || 0) > 0;

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
    });
  }, [isEdit, itemResp, reset, defaultSupplierId]);

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
    };

    if (!isEdit) {
      const price = Number(data.defaultPrice || 0);
      const qty = Number(data.openingQuantity || 0);
      body.openingQuantity = qty;
      body.openingRate = price;
      if (qty > 0) {
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
        description="Unit, pricing, group, and optional opening stock."
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
            required={needsPayment}
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
                placeholder={
                  needsPayment
                    ? "Select supplier"
                    : "Select supplier (optional)"
                }
                leftSection={<FieldIcon icon={Truck} />}
                clearable={!needsPayment}
                clearLabel="No supplier"
                isRequired={needsPayment}
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
            Low Stock. Leave blank to ignore.
          </p>
        </div>

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
              Value is Quantity × Default Price. Leave quantity at 0 if you are
              only registering the item name for now.
            </p>

            {needsPayment ? (
              <div className="mt-4 space-y-4 border-t border-[var(--serve-border)] pt-4">
                <p className="text-[12px] leading-snug text-[var(--serve-muted)]">
                  This stock is treated as a purchase: money is deducted from
                  the account you choose, and a Finance purchase is created.
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

export default StockItemModal;
