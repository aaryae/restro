import React, { useEffect, useMemo, useState } from "react";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import {
  EntityForm,
  FieldIcon,
} from "@/components/EntityForm";
import { Controller, useForm } from "react-hook-form";
import useTranslation from "@/locale/useTranslation";
import { useParams, useNavigate } from "react-router-dom";
import MediaComponent from "@/components/MediaComponent";
import { useAppSelector } from "@/redux/store/hooks";
import Toast from "@/components/Toast";
import { BANK_LIST_ROUTE } from "@/routes/routeNames";
import { AccountSchema } from "./schema";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import NepalPayIntegrationModal from "./NepalPayIntegrationModal";
import {
  PaymentIntegration,
  PaymentIntegrationInput,
  useCreatePaymentIntegrationMutation,
  useGetPaymentIntegrationsQuery,
  useUpdatePaymentIntegrationMutation,
} from "@/redux/services/paymentIntegration";
import {
  Banknote,
  Building2,
  Check,
  ImagePlus,
  Landmark,
  QrCode,
  Type,
  Wallet,
  X,
} from "lucide-react";
import { buildAssetUrl } from "@/utils/buildAssetUrl";

type AccountFromType = z.infer<typeof AccountSchema>;

function PillToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-[var(--primary-fg)] shadow-sm"
                : "border-[var(--serve-border)] bg-[var(--serve-surface)] text-[var(--serve-muted)] hover:border-[var(--serve-muted)] hover:bg-[var(--serve-surface-2)]"
            }`}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const AddEditAccount: React.FC = () => {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicModalOpen, setDynamicModalOpen] = useState(false);
  const [dynamicQrDraft, setDynamicQrDraft] =
    useState<PaymentIntegrationInput | null>(null);

  const selectedImage = useAppSelector((state) => state.media.selectedImage) as
    | string
    | "";

  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AccountFromType>({
    resolver: zodResolver(AccountSchema),
    defaultValues: {
      accountName: "",
      accountType: "cash",
      status: "active",
      openingBalance: 0,
      description: "",
      isPrimaryBank: false,
      qrType: "static",
    } as AccountFromType,
  });

  const [createAccount] = useCreateApiMutation();
  const [updateAccount] = useUpdateApiMutation();
  const [createIntegration] = useCreatePaymentIntegrationMutation();
  const [updateIntegration] = useUpdatePaymentIntegrationMutation();

  const accountGetUrl = isEditMode ? `${ACCOUNT_URL}${id}` : undefined;
  const { data: accountResp, isFetching: isFetchingAccount } = useGetApiQuery(
    accountGetUrl ? { url: accountGetUrl } : ({} as any),
  );

  const { data: integrationsResp } = useGetPaymentIntegrationsQuery();

  const existingIntegration = useMemo<PaymentIntegration | null>(() => {
    if (!isEditMode || !id) return null;
    const integrations: PaymentIntegration[] = integrationsResp?.data || [];
    return (
      integrations.find((item) => item.accountId === Number(id)) ?? null
    );
  }, [integrationsResp, id, isEditMode]);

  const isDynamicConfigured = Boolean(dynamicQrDraft || existingIntegration);

  const onSubmit = async (form: AccountFromType) => {
    if (
      form.accountType === "bank" &&
      form.qrType === "dynamic" &&
      !isDynamicConfigured
    ) {
      Toast("Setup NepalPay first.", "warning");
      setDynamicModalOpen(true);
      return;
    }

    const integrationPayload =
      form.accountType === "bank" && form.qrType === "dynamic"
        ? dynamicQrDraft
        : null;

    const payload: any = {
      accountType: form.accountType,
      openingBalance: Number(form.openingBalance) || 0,
      description: form.description || "",
      name: form.accountName,
    };

    if (form.accountType === "bank") {
      payload.isDefault = Boolean(form.isPrimaryBank);
      payload.bankAccountNumber = form.bankAccountNumber;
      if (form.qrType === "static" && form.staticQrUrl) {
        payload.staticQrUrl = form.staticQrUrl;
      }
    } else if (form.accountType === "cash") {
      payload.isDefault = Boolean(form.isPrimaryBank);
    } else if (form.accountType === "wallet") {
      payload.walletId = form.walletId;
      payload.staticQrUrl = form.staticQrUrl;
    }

    try {
      setIsSaving(true);
      let res;
      let accountId = id ? Number(id) : null;

      if (isEditMode) {
        payload.status = (form.status || "active").toLowerCase();
        res = await updateAccount({
          url: `${ACCOUNT_URL}${id}`,
          body: payload,
        }).unwrap();
      } else {
        res = await createAccount({ url: ACCOUNT_URL, body: payload }).unwrap();
        accountId = res?.data?.account?.id ?? res?.data?.id ?? null;
      }

      if (
        form.accountType === "bank" &&
        form.qrType === "dynamic" &&
        integrationPayload &&
        accountId
      ) {
        const body = { ...integrationPayload, accountId };
        if (existingIntegration) {
          await updateIntegration({
            id: existingIntegration.id,
            body,
          }).unwrap();
        } else {
          await createIntegration(body).unwrap();
        }
      }

      handleResponse({ res, onSuccess: () => navigate(BANK_LIST_ROUTE) });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isEditMode) return;
    const row = accountResp?.data;
    if (!row) return;

    reset({
      accountName: row?.name || "",
      accountType: row?.accountType || "cash",
      openingBalance: Number(row?.openingBalance) || undefined,
      description: row?.description || "",
      bankAccountNumber: row?.bankAccount?.bankAccountNumber || "",
      walletAccountName: row?.accountType === "wallet" ? row?.name || "" : "",
      walletId: row?.walletAccount?.walletId || "",
      staticQrUrl:
        row?.bankAccount?.staticQrUrl || row?.walletAccount?.staticQrUrl || "",
      status: row?.status || "active",
      isPrimaryBank: Boolean(row?.isDefault),
      qrType: existingIntegration ? "dynamic" : "static",
    });
    setDynamicQrDraft(null);
  }, [isEditMode, accountResp, existingIntegration, reset]);

  const accountType = watch("accountType");
  const qrType = watch("qrType");

  useEffect(() => {
    if (accountType === "cash") {
      setValue("bankAccountNumber", undefined);
      setValue("walletAccountName", undefined);
      setValue("walletId", undefined);
      setValue("staticQrUrl", undefined as unknown as string, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue("qrType", "static");
      setDynamicQrDraft(null);
    }
    if (accountType === "bank") {
      setValue("walletAccountName", undefined);
      setValue("walletId", undefined);
    }
    if (accountType === "wallet") {
      setValue("bankAccountNumber", undefined);
      setValue("isPrimaryBank", false);
      setValue("qrType", "static");
      setDynamicQrDraft(null);
    }
  }, [accountType, setValue]);

  useEffect(() => {
    if (qrType === "static") {
      setDynamicQrDraft(null);
    } else {
      setValue("staticQrUrl", undefined as unknown as string, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [qrType, setValue]);

  const staticQrUrl = watch("staticQrUrl");

  const renderQrUpload = (hint?: string) => (
    <div className="min-w-0 md:col-span-2">
      <span className="mb-1.5 block text-xs font-medium text-[var(--serve-muted)]">
        Static QR <span className="text-[var(--serve-negative)]">*</span>
      </span>

      <div className="overflow-hidden rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface)]">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-[10px] border border-dashed border-[var(--serve-border)] bg-[var(--serve-surface-2)] sm:mx-0">
            {staticQrUrl ? (
              <img
                src={buildAssetUrl(staticQrUrl)}
                alt="Static QR preview"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[var(--serve-muted)]">
                <QrCode size={24} strokeWidth={1.5} />
                <span className="text-[11px] font-medium">QR preview</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-[var(--serve-fg)]">
              {staticQrUrl ? "QR image selected" : "Upload a QR code image"}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--serve-muted)]">
              {hint ||
                "JPG, PNG, or GIF · max 1MB. Shown to customers at checkout."}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <MediaComponent
                title={
                  <span className="inline-flex items-center gap-2 rounded-[10px] border border-[color-mix(in_srgb,var(--primary-color)_25%,var(--serve-border))] bg-[color-mix(in_srgb,var(--primary-color)_8%,transparent)] px-3 py-1.5 text-sm font-medium text-[var(--primary-ink)] transition hover:bg-[color-mix(in_srgb,var(--primary-color)_14%,transparent)]">
                    <ImagePlus size={15} />
                    {staticQrUrl ? "Change image" : "Choose image"}
                  </span>
                }
                handleConfirmImage={() => {
                  if (typeof selectedImage === "string") {
                    setValue("staticQrUrl", selectedImage, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    });
                  }
                  setMediaOpen(false);
                }}
                isMultiSelect={false}
                open={mediaOpen}
                setOpen={setMediaOpen}
                acceptFiles="image/*"
              />

              {staticQrUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setValue("staticQrUrl", "" as unknown as string, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface)] px-3 py-1.5 text-sm font-medium text-[var(--serve-muted)] transition hover:border-[color-mix(in_srgb,var(--serve-negative)_30%,var(--serve-border))] hover:bg-[color-mix(in_srgb,var(--serve-negative)_8%,transparent)] hover:text-[var(--serve-negative)]"
                >
                  <X size={14} />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <input type="hidden" {...register("staticQrUrl")} />
      {(errors as any)?.staticQrUrl && (
        <p className="mt-1.5 text-xs text-[var(--serve-negative)]">
          {(errors as any)?.staticQrUrl?.message as string}
        </p>
      )}
    </div>
  );

  return (
    <>
      <EntityForm
        title={isEditMode ? "Edit Account" : "Add Account"}
        sectionTitle="Account details"
        description="Cash, bank, or wallet used at checkout."
        icon={Landmark}
        maxWidthClass="max-w-3xl"
        columns={2}
        onSubmit={handleSubmit(onSubmit)}
        onCancel={() => navigate(BANK_LIST_ROUTE)}
        isSaving={isSaving}
        isLoading={isEditMode && isFetchingAccount && !accountResp}
        submitLabel={isEditMode ? translate("Update") : translate("Submit")}
        footerExtra={
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--serve-border)] bg-[var(--serve-surface)] px-4 text-sm font-semibold text-[var(--serve-fg)] transition hover:border-[var(--serve-muted)]"
            onClick={() => {
              reset();
              setDynamicQrDraft(null);
            }}
          >
            {translate("Reset")}
          </button>
        }
      >
        <Input
          label="Account Name"
          placeholder="Enter account name"
          leftSection={<FieldIcon icon={Type} />}
          {...register("accountName")}
          error={errors?.accountName?.message as string}
          isRequired
        />

        <div className="flex min-w-0 flex-col">
          <span className="mb-1.5 text-xs font-medium text-[var(--serve-muted)]">
            Status
          </span>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <PillToggle
                value={field.value}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {!isEditMode && (
          <div className="min-w-0 md:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-[var(--serve-muted)]">
              Account Type
              <span className="text-[var(--serve-negative)]"> *</span>
            </span>
            <Controller
              name="accountType"
              control={control}
              render={({ field }) => (
                <PillToggle
                  value={field.value}
                  options={[
                    {
                      label: "Cash",
                      value: "cash",
                      icon: <Banknote size={16} />,
                    },
                    {
                      label: "Bank",
                      value: "bank",
                      icon: <Building2 size={16} />,
                    },
                    {
                      label: "Wallet",
                      value: "wallet",
                      icon: <Wallet size={16} />,
                    },
                  ]}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}

        {(accountType === "cash" || accountType === "bank") && (
          <div className="min-w-0 md:col-span-2">
            <Controller
              name="isPrimaryBank"
              control={control}
              render={({ field }) => (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-[10px] border px-3.5 py-2.5 transition ${
                    field.value
                      ? "border-[color-mix(in_srgb,var(--primary-color)_40%,var(--serve-border))] bg-[color-mix(in_srgb,var(--primary-color)_6%,transparent)]"
                      : "border-[var(--serve-border)] bg-[var(--serve-surface-2)] hover:border-[var(--serve-muted)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-[var(--serve-border)] text-[var(--primary-color)] focus:ring-[color-mix(in_srgb,var(--primary-color)_40%,transparent)]"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-[var(--serve-fg)]">
                      Show in checkout
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--serve-muted)]">
                      {accountType === "cash"
                        ? "This cash account will appear in checkout payment options."
                        : "This bank will appear in checkout payment options."}
                    </span>
                  </span>
                </label>
              )}
            />
          </div>
        )}

        {accountType === "bank" && (
          <>
            <Input
              label="Account Number"
              placeholder="Enter bank account number"
              leftSection={<FieldIcon icon={Building2} />}
              {...register("bankAccountNumber")}
              error={errors?.bankAccountNumber?.message as string}
              isRequired
            />

            <div className="flex min-w-0 flex-col">
              <span className="mb-1.5 text-xs font-medium text-[var(--serve-muted)]">
                QR Type
              </span>
              <Controller
                name="qrType"
                control={control}
                render={({ field }) => (
                  <PillToggle
                    value={field.value}
                    options={[
                      { label: "Static", value: "static" },
                      { label: "Dynamic", value: "dynamic" },
                    ]}
                    onChange={(v) => {
                      field.onChange(v);
                      if (v === "dynamic" && !isDynamicConfigured) {
                        setDynamicModalOpen(true);
                      }
                    }}
                  />
                )}
              />
              <p className="mt-1.5 text-[11px] text-[var(--serve-muted)]">
                Static uses an uploaded QR. Dynamic generates NepalPay at
                checkout.
              </p>
            </div>

            {qrType === "static" &&
              renderQrUpload(
                "Upload your bank QR image. JPG, PNG, or GIF · max 1MB.",
              )}

            {qrType === "dynamic" && (
              <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setDynamicModalOpen(true)}
                  className="inline-flex items-center rounded-[10px] border border-[color-mix(in_srgb,var(--primary-color)_30%,var(--serve-border))] bg-[color-mix(in_srgb,var(--primary-color)_6%,transparent)] px-4 py-2 text-sm font-medium text-[var(--primary-ink)] transition hover:bg-[color-mix(in_srgb,var(--primary-color)_12%,transparent)]"
                >
                  {isDynamicConfigured
                    ? "Edit NepalPay Dynamic"
                    : "Setup NepalPay Dynamic"}
                </button>
                {isDynamicConfigured && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--primary-color)_12%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--primary-ink)]">
                    <Check size={12} />
                    Dynamic ready
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {accountType === "wallet" && (
          <>
            <Input
              label="Wallet Name"
              placeholder="e.g. eSewa, Khalti"
              leftSection={<FieldIcon icon={Wallet} />}
              {...register("walletAccountName")}
              error={errors?.walletAccountName?.message as string}
              isRequired
            />
            <Input
              label="Wallet ID"
              placeholder="Enter wallet ID / number"
              leftSection={<FieldIcon icon={QrCode} />}
              {...register("walletId")}
              error={errors?.walletId?.message as string}
              isRequired
            />
            {renderQrUpload(
              "Upload this wallet’s QR image. JPG, PNG, or GIF · max 1MB.",
            )}
          </>
        )}

        <Input
          label="Opening Balance"
          type="number"
          step={0.01}
          placeholder="0"
          leftSection={<FieldIcon icon={Banknote} />}
          {...register("openingBalance", { valueAsNumber: true })}
          error={errors?.openingBalance?.message as string}
        />

        <TextArea
          label="Description"
          placeholder="Optional notes"
          rows={2}
          className="md:col-span-2"
          {...register("description")}
          error={errors?.description?.message as string}
        />
      </EntityForm>

      <NepalPayIntegrationModal
        isOpen={dynamicModalOpen}
        onClose={() => setDynamicModalOpen(false)}
        draftMode
        hideAccountSelect
        accountId={id}
        initialDraft={dynamicQrDraft}
        editing={existingIntegration}
        onSaveDraft={(payload) => {
          setDynamicQrDraft(payload);
          Toast("NepalPay saved.", "success");
        }}
      />
    </>
  );
};

export default AddEditAccount;
