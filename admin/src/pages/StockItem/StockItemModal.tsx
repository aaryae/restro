import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import CustomDialog from "@/components/Dialog";
import AddEditSupplier from "@/pages/SuppliersModule/AddEditSupplier";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { STOCK_ITEM_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildQueryString } from "@/utils/generalHelper";

const emptyToUndef = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : v;

const optionalAmount = z.preprocess(
  emptyToUndef,
  z.coerce.number().min(0).optional(),
);

const StockItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  measuringUnitId: z.string().min(1, "Measuring unit is required"),
  stockGroupId: z.string().optional(),
  supplierId: z.string().optional(),
  defaultPrice: optionalAmount,
  openingQuantity: optionalAmount,
  openingRate: optionalAmount,
  lowStockThreshold: optionalAmount,
});

type StockItemFormType = z.infer<typeof StockItemSchema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editId?: number | null;
};

const blankCreateValues = {
  name: "",
  measuringUnitId: "",
  stockGroupId: "",
  supplierId: "",
  defaultPrice: "" as unknown as number | undefined,
  openingQuantity: "" as unknown as number | undefined,
  openingRate: "" as unknown as number | undefined,
  lowStockThreshold: "" as unknown as number | undefined,
};

const StockItemModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  editId = null,
}) => {
  const isEdit = Boolean(editId);
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
  const openingRate = useWatch({ control, name: "openingRate" });
  const defaultPrice = useWatch({ control, name: "defaultPrice" });
  const openingValue = Number(openingQuantity || 0) * Number(openingRate || 0);

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

  const { data: unitsResp } = useGetApiQuery(
    { url: unitsUrl },
    { skip: !isOpen },
  );
  const { data: groupsResp } = useGetApiQuery(
    { url: groupsUrl },
    { skip: !isOpen },
  );
  const { data: suppliersResp, refetch: refetchSuppliers } = useGetApiQuery(
    { url: suppliersUrl },
    { skip: !isOpen },
  );
  const { data: itemResp } = useGetApiQuery(
    { url: `${STOCK_ITEM_URL}${editId}` },
    { skip: !isOpen || !isEdit },
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

  useEffect(() => {
    if (!isOpen) return;
    if (!isEdit) {
      reset(blankCreateValues);
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
      openingRate:
        row.defaultPrice == null || row.defaultPrice === ""
          ? ("" as any)
          : Number(row.defaultPrice),
      lowStockThreshold:
        row.lowStockThreshold == null || row.lowStockThreshold === ""
          ? ("" as any)
          : Number(row.lowStockThreshold),
    });
  }, [isOpen, isEdit, itemResp, reset]);

  const handleClose = () => {
    setAddSupplierOpen(false);
    reset(blankCreateValues);
    onClose();
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
      body.openingQuantity = Number(data.openingQuantity || 0);
      body.openingRate = Number(data.openingRate || 0);
      if (!body.defaultPrice && body.openingRate) {
        body.defaultPrice = body.openingRate;
      }
    }

    try {
      const response = isEdit
        ? await updateApi({
            url: `${STOCK_ITEM_URL}${editId}`,
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
          handleClose();
          onSuccess();
        },
      });
    } catch (error) {
      handleError({ error });
    }
  };

  const saving = isSubmitting || creating || updating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Stock Item" : "Create Stock Item"}
      size="large"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Item Name"
            placeholder="Enter name of stock"
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
                clearable
                clearLabel="No group"
                error={errors.stockGroupId?.message}
              />
            )}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <label className="input-label text-left">Supplier</label>
              <CustomDialog
                buttonTitle={
                  <button
                    type="button"
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-primaryColor px-2 text-[11px] font-medium text-white transition hover:bg-primaryColor/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddSupplierOpen(true);
                    }}
                  >
                    <Plus size={12} strokeWidth={2.5} />
                    Add
                  </button>
                }
                dialogOpen={addSupplierOpen}
                setDialogOpen={setAddSupplierOpen}
                title="Add New Supplier"
                contentClassName="max-h-none max-w-lg gap-3 overflow-hidden p-5 sm:p-5"
              >
                <AddEditSupplier
                  isComponent={true}
                  closeModal={async (created?: any) => {
                    setAddSupplierOpen(false);
                    await refetchSuppliers();
                    const id = created?.id;
                    if (id != null) {
                      setValue("supplierId", String(id), {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </CustomDialog>
            </div>
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <Select
                  options={supplierOptions}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  placeholder="Select supplier (optional)"
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
              {...register("lowStockThreshold")}
              error={errors.lowStockThreshold?.message as string | undefined}
            />
            <p className="text-[11px] leading-snug text-slate-500">
              When quantity falls to this level or below, the item counts toward
              Low Stock on the Stock Items page. Leave blank to ignore.
            </p>
          </div>
        </div>

        {!isEdit && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">
              Opening Stock
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                label="Rate (Rs)"
                type="number"
                step="0.01"
                min={0}
                placeholder="0"
                {...register("openingRate", {
                  onChange: (e) => {
                    const raw = e.target.value;
                    const rate = raw === "" ? undefined : Number(raw);
                    setValue("openingRate", (raw === "" ? "" : rate) as any);
                    if (
                      rate != null &&
                      !Number.isNaN(rate) &&
                      rate > 0 &&
                      (defaultPrice === undefined ||
                        defaultPrice === null ||
                        defaultPrice === ("" as any) ||
                        Number(defaultPrice) === 0)
                    ) {
                      setValue("defaultPrice", rate);
                    }
                  },
                })}
                error={errors.openingRate?.message as string | undefined}
              />
              <Input
                label="Value (Rs)"
                type="number"
                value={openingValue.toFixed(2)}
                disabled
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <Button
            type="submit"
            className="submit-button !h-10 !rounded-lg !px-5 !py-0 !text-sm !font-medium"
            disabled={saving}
            isLoading={saving}
          >
            {isEdit ? "Update Item" : "Save Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StockItemModal;
