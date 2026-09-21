import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import Select from "@/components/Select";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import {
  CUSTOMER_URL,
  REVENUE_URL,
  ACCOUNT_URL,
} from "@/constants/apiUrlConstants";
import { REVENUE_LIST_ROUTE } from "@/routes/routeNames";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildQueryString } from "@/utils/generalHelper";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { RevenueSchema } from "./schema";
import {
  Banknote,
  CreditCard,
  Landmark,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

type RevenueFormType = z.infer<typeof RevenueSchema>;

type AddEditRevenueProps = {
  id?: number | string | null;
  isComponent?: boolean;
  closeModal?: () => void;
  onSuccess?: () => void;
};

export default function AddEditRevenue({
  id: idProp,
  isComponent = false,
  closeModal,
  onSuccess,
}: AddEditRevenueProps = {}) {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id =
    idProp !== undefined && idProp !== null ? String(idProp) : paramId;
  const isEditMode = !!id;
  const authUserId = useSelector((state: RootState) => state.auth.id);

  const finish = () => {
    onSuccess?.();
    closeModal?.();
  };

  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    label: string;
  } | null>(null);

  const customerUrl = useMemo(
    () =>
      buildQueryString(`${CUSTOMER_URL}list`, {
        page: 1,
        limit: 5,
        search: {
          isCombo: true,
          phone: customerQuery,
        },
      }),
    [customerQuery],
  );

  const {
    data: customerSearch,
    isSuccess: customerSuccess,
    isLoading: customerDataLoading,
    refetch: customerRefetch,
  } = useGetApiQuery({ url: customerUrl });

  const accountUrl = useMemo(
    () =>
      buildQueryString(`${ACCOUNT_URL}list`, {
        page: 1,
        limit: 25,
      }),
    [],
  );
  const { data: accountsResp, isSuccess: accountsSuccess } = useGetApiQuery({
    url: accountUrl,
  });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RevenueFormType>({
    resolver: zodResolver(RevenueSchema),
  });

  const [createRevenue, { isLoading: creating }] = useCreateApiMutation();
  const [updateRevenue, { isLoading: updating }] = useUpdateApiMutation();

  const { data: revenueData, isLoading: revenueLoading } = useGetApiQuery(
    { url: `${REVENUE_URL}${id}` },
    { skip: !isEditMode },
  );

  useEffect(() => {
    if (isEditMode && revenueData?.data) {
      const d = revenueData.data as any;
      reset({
        amount: Number(d.amount) || 0,
        paymentMethod: d.paymentMethod || "cash",
        cash_or_credit: d.cash_or_credit || "cash",
        accountId: d.accountId,
        remarks: d.remarks || "",
      });
      if (d.customer && d.customer.id) {
        const c = d.customer;
        setSelectedCustomer({
          id: c.id,
          label:
            `${c.firstName || ""} ${c.lastName || ""} (${c.mobileNo || c.email || "-"})`.trim(),
        });
      } else if (d.customerId && d.customerName) {
        setSelectedCustomer({ id: d.customerId, label: d.customerName });
      }
    }
  }, [isEditMode, revenueData, reset]);

  useEffect(() => {
    if (!isEditMode && accountsSuccess && accountsResp?.data?.data?.length) {
      const accounts: any[] = accountsResp.data.data;
      const defaultActive = accounts.find(
        (a) => a.isDefault && a.status === "active",
      );
      const active = accounts.find((a) => a.status === "active");
      const chosen = defaultActive || active || accounts[0];
      if (chosen?.id) {
        setValue("accountId", Number(chosen.id));
      }
    }
  }, [isEditMode, accountsSuccess, accountsResp, setValue]);

  const handleSuccess = () => {
    if (isComponent) finish();
    else navigate(REVENUE_LIST_ROUTE);
  };

  const onSubmit = async (form: RevenueFormType) => {
    const body: any = { ...form, userId: authUserId };
    if (isEditMode) {
      delete body.accountId;
    }
    if (selectedCustomer?.id) body.customerId = selectedCustomer.id;
    try {
      const response = isEditMode
        ? await updateRevenue({ url: `${REVENUE_URL}${id}`, body }).unwrap()
        : await createRevenue({ url: `${REVENUE_URL}`, body }).unwrap();

      handleResponse({ res: response, onSuccess: handleSuccess });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <EntityForm
      title={isEditMode ? "Edit Revenue" : "Add Revenue"}
      sectionTitle="Revenue details"
      description="Customer, amount, account, and payment."
      icon={TrendingUp}
      embedded={isComponent}
      maxWidthClass="max-w-4xl"
      columns={3}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => {
        if (isComponent) closeModal?.();
        else navigate(REVENUE_LIST_ROUTE);
      }}
      isSaving={isSubmitting || creating || updating}
      isLoading={isEditMode && revenueLoading && !revenueData}
      submitLabel={isEditMode ? "Update" : "Submit"}
    >
      <div className="relative min-w-0 sm:col-span-2 lg:col-span-3">
        <Input
          label="Customer"
          leftSection={<FieldIcon icon={UserRound} />}
          value={selectedCustomer ? selectedCustomer.label : customerQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSelectedCustomer(null);
            setCustomerQuery(e.target.value);
          }}
          placeholder="Search by name, phone or email"
        />
        {selectedCustomer ? (
          <button
            type="button"
            className="absolute right-2 top-[2.05rem] inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-[var(--serve-negative)] hover:bg-[color-mix(in_srgb,var(--serve-negative)_8%,transparent)]"
            onClick={() => {
              setSelectedCustomer(null);
              setCustomerQuery("");
            }}
          >
            <X size={12} />
            Clear
          </button>
        ) : null}

        {!selectedCustomer && customerDataLoading ? (
          <p className="mt-1 text-xs text-[var(--serve-muted)]">
            Loading customers…
          </p>
        ) : null}

        {!selectedCustomer &&
        customerSuccess &&
        customerSearch?.data?.data?.length > 0 &&
        customerQuery.trim().length > 0 ? (
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[var(--serve-border)] bg-[var(--serve-surface)] shadow-lg">
            {customerSearch?.data?.data?.map((c: any) => (
              <button
                type="button"
                key={c.id}
                className="w-full px-3 py-2.5 text-left transition hover:bg-[var(--serve-surface-2)]"
                onClick={() => {
                  setSelectedCustomer({
                    id: c.id,
                    label:
                      `${c.firstName || ""} ${c.lastName || ""} (${c.mobileNo || c.email || "-"})`.trim(),
                  });
                  setCustomerQuery("");
                }}
              >
                <div className="text-sm font-medium text-[var(--serve-fg)]">
                  {c.firstName} {c.lastName}
                </div>
                <div className="text-xs text-[var(--serve-muted)]">
                  {c.mobileNo || c.email || "-"}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {!selectedCustomer &&
        customerQuery.trim().length > 0 &&
        !customerDataLoading &&
        !(customerSuccess && customerSearch?.data?.data?.length > 0) ? (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-[var(--serve-negative)]">
              No customers found
            </p>
            <button
              type="button"
              onClick={() => customerRefetch()}
              className="text-xs font-medium text-[var(--primary-ink)] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>

      <Input
        label="Amount"
        type="number"
        step="0.01"
        placeholder="Enter amount"
        leftSection={<FieldIcon icon={Banknote} />}
        {...register("amount", { valueAsNumber: true })}
        error={errors.amount?.message}
        isRequired
      />

      <Controller
        name="accountId"
        control={control}
        render={({ field }) => (
          <Select
            label="Account"
            disabled={isEditMode}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            name={field.name}
            error={errors.accountId?.message}
            placeholder="Select Account"
            leftSection={<FieldIcon icon={Landmark} />}
            options={[
              { value: "", label: "Select Account" },
              ...((accountsSuccess &&
                accountsResp?.data?.data?.map((acc: any) => ({
                  value: String(acc.id),
                  label: `${acc.name}${acc.isDefault ? " (Default)" : ""} - ${acc.accountType}`,
                  disabled: acc.status !== "active",
                }))) ||
                []),
            ]}
            onValueChange={(next) =>
              field.onChange(next ? Number(next) : undefined)
            }
            isRequired
          />
        )}
      />

      <Controller
        name="paymentMethod"
        control={control}
        render={({ field }) => (
          <Select
            label="Payment Method"
            value={field.value ?? ""}
            onBlur={field.onBlur}
            name={field.name}
            error={errors.paymentMethod?.message}
            leftSection={<FieldIcon icon={CreditCard} />}
            options={[
              { value: "cash", label: "Cash" },
              { value: "card", label: "Card" },
              { value: "online", label: "Online" },
            ]}
            onValueChange={field.onChange}
            isRequired
          />
        )}
      />

      <Controller
        name="cash_or_credit"
        control={control}
        render={({ field }) => (
          <Select
            label="Cash or Credit"
            value={field.value ?? ""}
            onBlur={field.onBlur}
            name={field.name}
            error={errors.cash_or_credit?.message}
            leftSection={<FieldIcon icon={Banknote} />}
            options={[
              { value: "cash", label: "Cash" },
              { value: "credit", label: "Credit" },
            ]}
            onValueChange={field.onChange}
            isRequired
          />
        )}
      />

      <TextArea
        label="Remarks"
        placeholder="Add any notes (optional)"
        className="sm:col-span-2 lg:col-span-3"
        rows={2}
        {...register("remarks")}
        error={errors.remarks as any}
      />
    </EntityForm>
  );
}
