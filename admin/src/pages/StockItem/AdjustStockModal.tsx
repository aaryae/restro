import React, { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import {
  useCreateApiMutation,
  useGetApiQuery,
} from "@/redux/services/crudApi";
import { STOCK_ITEM_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildQueryString } from "@/utils/generalHelper";

const AdjustSchema = z
  .object({
    type: z.enum(["purchase", "adjustment_in", "adjustment_out", "waste"]),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    rate: z.coerce.number().min(0).optional(),
    note: z.string().optional(),
    accountId: z.string().optional(),
    supplierId: z.string().optional(),
    paymentTerms: z.enum(["cash", "cheque", "credit"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "purchase") return;
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
        message: "Supplier is required for Purchase / Restock",
        path: ["supplierId"],
      });
    }
  });

type AdjustFormType = z.infer<typeof AdjustSchema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemId: number | null;
  itemName?: string;
  defaultRate?: number;
  defaultSupplierId?: number | null;
};

const typeOptions = [
  { label: "Purchase / Restock", value: "purchase" },
  { label: "Adjustment In", value: "adjustment_in" },
  { label: "Adjustment Out", value: "adjustment_out" },
  { label: "Waste", value: "waste" },
];

const paymentTermOptions = [
  { label: "Cash", value: "cash" },
  { label: "Cheque", value: "cheque" },
  { label: "Credit", value: "credit" },
];

const AdjustStockModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  itemId,
  itemName,
  defaultRate = 0,
  defaultSupplierId = null,
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustFormType>({
    resolver: zodResolver(AdjustSchema),
    defaultValues: {
      type: "adjustment_in",
      quantity: 0,
      rate: defaultRate,
      note: "",
      accountId: "",
      supplierId: defaultSupplierId ? String(defaultSupplierId) : "",
      paymentTerms: "cash",
    },
  });

  const adjustType = useWatch({ control, name: "type" });
  const isPurchase = adjustType === "purchase";

  const accountsUrl = buildQueryString("account/list", { page: 1, limit: 50 });
  const suppliersUrl = buildQueryString("supplier/list", {
    page: 1,
    limit: 200,
  });

  const { data: accountsResp } = useGetApiQuery(
    { url: accountsUrl },
    { skip: !isOpen },
  );
  const { data: suppliersResp } = useGetApiQuery(
    { url: suppliersUrl },
    { skip: !isOpen },
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

  const supplierOptions = useMemo(() => {
    const rows = suppliersResp?.data?.data ?? suppliersResp?.data ?? [];
    return (Array.isArray(rows) ? rows : []).map((s: any) => ({
      label: s.name,
      value: String(s.id),
    }));
  }, [suppliersResp]);

  const [createApi, { isLoading }] = useCreateApiMutation();

  React.useEffect(() => {
    if (!isOpen) return;
    reset({
      type: "adjustment_in",
      quantity: 0,
      rate: defaultRate,
      note: "",
      accountId: "",
      supplierId: defaultSupplierId ? String(defaultSupplierId) : "",
      paymentTerms: "cash",
    });
  }, [isOpen, defaultRate, defaultSupplierId, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: AdjustFormType) => {
    if (!itemId) return;
    try {
      const body: Record<string, unknown> = {
        type: data.type,
        quantity: Number(data.quantity),
        rate: data.rate === undefined ? undefined : Number(data.rate),
        note: data.note || undefined,
      };

      if (data.type === "purchase") {
        body.accountId = Number(data.accountId);
        body.supplierId = Number(data.supplierId);
        body.paymentTerms = data.paymentTerms || "cash";
      }

      const response = await createApi({
        url: `${STOCK_ITEM_URL}${itemId}/adjust`,
        body,
      }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg: response?.message || "Stock adjusted successfully.",
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

  const saving = isSubmitting || isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={itemName ? `Adjust Stock — ${itemName}` : "Adjust Stock"}
      size="medium"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              label="Adjustment Type"
              options={typeOptions}
              value={field.value}
              onValueChange={field.onChange}
              isRequired
              error={errors.type?.message}
            />
          )}
        />

        {isPurchase ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[12px] leading-snug text-slate-600">
              Purchase / Restock records a Finance purchase and deducts the
              selected cash or bank account (except credit).
            </p>
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
              name="supplierId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Supplier"
                  options={supplierOptions}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  placeholder="Select supplier"
                  isRequired
                  error={errors.supplierId?.message}
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
        ) : null}

        <Input
          label="Quantity"
          type="number"
          step="0.01"
          {...register("quantity")}
          error={errors.quantity?.message}
          isRequired
        />
        <Input
          label="Rate (Rs)"
          type="number"
          step="0.01"
          {...register("rate")}
          error={errors.rate?.message}
        />
        <TextArea
          label="Note"
          placeholder="Optional note"
          {...register("note")}
          error={errors.note?.message}
        />
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
            Save Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdjustStockModal;
