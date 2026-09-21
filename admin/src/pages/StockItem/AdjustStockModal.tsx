import React, { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import {
  useCreateApiMutation,
  useGetApiQuery,
} from "@/redux/services/crudApi";
import { STOCK_ITEM_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildQueryString } from "@/utils/generalHelper";
import {
  AlignLeft,
  Banknote,
  Hash,
  PackageMinus,
  Scale,
  Truck,
  Wallet,
} from "lucide-react";

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
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
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
  isComponent = true,
  closeModal,
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

  useEffect(() => {
    reset({
      type: "adjustment_in",
      quantity: 0,
      rate: defaultRate,
      note: "",
      accountId: "",
      supplierId: defaultSupplierId ? String(defaultSupplierId) : "",
      paymentTerms: "cash",
    });
  }, [itemId, defaultRate, defaultSupplierId, reset]);

  const accountsUrl = buildQueryString("account/list", {
    page: 1,
    limit: 50,
  });
  const suppliersUrl = buildQueryString("supplier/list", {
    page: 1,
    limit: 200,
  });

  const { data: accountsResp } = useGetApiQuery(
    { url: accountsUrl },
    { skip: !isPurchase },
  );
  const { data: suppliersResp } = useGetApiQuery(
    { url: suppliersUrl },
    { skip: !isPurchase },
  );
  const [createApi, { isLoading }] = useCreateApiMutation();

  const accountOptions = useMemo(() => {
    const rows = accountsResp?.data?.data ?? accountsResp?.data ?? [];
    return (Array.isArray(rows) ? rows : [])
      .filter((a: any) => a?.status === "active" || a?.status == null)
      .map((a: any) => ({
        label: `${a.name}${a.accountType ? ` (${a.accountType})` : ""}`,
        value: String(a.id),
      }));
  }, [accountsResp]);

  const supplierOptions = useMemo(
    () =>
      (suppliersResp?.data?.data ?? []).map((s: any) => ({
        label: s.name,
        value: String(s.id),
      })),
    [suppliersResp],
  );

  const finish = () => {
    reset();
    onSuccess?.();
    closeModal?.();
  };

  const onCancel = () => {
    reset();
    closeModal?.();
  };

  const onSubmit = async (data: AdjustFormType) => {
    if (!itemId) return;
    const body: Record<string, unknown> = {
      type: data.type,
      quantity: Number(data.quantity),
      rate: data.rate != null ? Number(data.rate) : undefined,
      note: data.note || undefined,
    };
    if (data.type === "purchase") {
      body.accountId = Number(data.accountId);
      body.supplierId = Number(data.supplierId);
      body.paymentTerms = data.paymentTerms || "cash";
    }

    try {
      const response = await createApi({
        url: `${STOCK_ITEM_URL}${itemId}/adjust`,
        body,
      }).unwrap();

      handleResponse({
        res: {
          success: true,
          msg: response?.message || "Stock adjusted successfully.",
        },
        onSuccess: finish,
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <EntityForm
      title={itemName ? `Adjust Stock — ${itemName}` : "Adjust Stock"}
      sectionTitle="Adjustment details"
      description="Record a purchase, in/out adjustment, or waste."
      icon={PackageMinus}
      embedded={isComponent}
      columns={1}
      maxWidthClass="max-w-2xl"
      onSubmit={handleSubmit(onSubmit)}
      onCancel={onCancel}
      isSaving={isSubmitting || isLoading}
      submitLabel="Save Adjustment"
    >
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Select
            label="Adjustment Type"
            options={typeOptions}
            value={field.value}
            onValueChange={field.onChange}
            leftSection={<FieldIcon icon={Scale} />}
            isRequired
            error={errors.type?.message}
          />
        )}
      />

      {isPurchase ? (
        <div className="space-y-4 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] p-4">
          <p className="text-[12px] leading-snug text-[var(--serve-muted)]">
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
                leftSection={<FieldIcon icon={Wallet} />}
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
                leftSection={<FieldIcon icon={Truck} />}
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
        leftSection={<FieldIcon icon={Hash} />}
        {...register("quantity")}
        error={errors.quantity?.message}
        isRequired
      />
      <Input
        label="Rate (Rs)"
        type="number"
        step="0.01"
        leftSection={<FieldIcon icon={Banknote} />}
        {...register("rate")}
        error={errors.rate?.message}
      />
      <TextArea
        label="Note"
        placeholder="Optional note"
        rows={2}
        leftSection={<FieldIcon icon={AlignLeft} />}
        {...register("note")}
        error={errors.note?.message}
      />
    </EntityForm>
  );
};

export default AdjustStockModal;
