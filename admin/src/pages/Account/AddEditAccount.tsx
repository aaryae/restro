import React, { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
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
import { Banknote, Building2, Check, ImagePlus, QrCode, Wallet, X } from "lucide-react";
import { buildAssetUrl } from "@/utils/buildAssetUrl";

type AccountFromType = z.infer<typeof AccountSchema>;

const fieldClass = "w-full max-w-xl";

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
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "border-primaryColor bg-primaryColor text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
    <div className={`flex flex-col ${fieldClass}`}>
      <label className="mb-2 text-sm font-medium text-slate-700">
        Static QR <span className="text-red-500">*</span>
      </label>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 sm:mx-0">
            {staticQrUrl ? (
              <img
                src={buildAssetUrl(staticQrUrl)}
                alt="Static QR preview"
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
                <QrCode size={28} strokeWidth={1.5} />
                <span className="text-[11px] font-medium">QR preview</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-slate-800">
              {staticQrUrl ? "QR image selected" : "Upload a QR code image"}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              {hint ||
                "JPG, PNG, or GIF · max 1MB. Shown to customers at checkout."}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <MediaComponent
                title={
                  <span className="inline-flex items-center gap-2 rounded-xl border border-primaryColor/25 bg-primaryColor/5 px-3.5 py-2 text-sm font-medium text-primaryColor transition hover:bg-primaryColor/10">
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
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
        <p className="mt-1.5 text-xs text-red-500">
          {(errors as any)?.staticQrUrl?.message as string}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-w-0 max-w-3xl">
      <PageTitle title={isEditMode ? "Edit Account" : "Add Account"} isBack />

      {isEditMode && isFetchingAccount ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-slate-500">
          Loading account…
        </div>
      ) : (
        <form
          className="mt-4 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Account details
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {isEditMode ? "Update cash, bank, or wallet" : "Create a new account"}
            </h2>
          </div>

          <Input
            label="Account Name"
            placeholder="Enter account name"
            className={fieldClass}
            {...register("accountName")}
            error={errors?.accountName?.message as string}
          isRequired
        />

          {!isEditMode && (
            <div className={fieldClass}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Account Type
                <span className="ml-0.5 text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
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
            <div className={fieldClass}>
              <Controller
                name="isPrimaryBank"
                control={control}
                render={({ field }) => (
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                      field.value
                        ? "border-primaryColor/40 bg-primaryColor/5"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primaryColor focus:ring-primaryColor/40"
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-800">
                        Show in checkout
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
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
            <div className="space-y-5 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Bank &amp; QR
              </p>

              <Input
                label="Account Number"
                placeholder="Enter bank account number"
                className={fieldClass}
                {...register("bankAccountNumber")}
                error={errors?.bankAccountNumber?.message as string}
          isRequired
        />

              <div className={fieldClass}>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  QR Type
                </label>
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
                <p className="mt-2 text-xs text-slate-500">
                  Static uses an uploaded QR image. Dynamic generates a NepalPay
                  QR at checkout.
                </p>
              </div>

              {qrType === "static" &&
                renderQrUpload(
                  "Upload your bank QR image. JPG, PNG, or GIF · max 1MB.",
                )}

              {qrType === "dynamic" && (
                <div
                  className={`flex flex-wrap items-center gap-3 ${fieldClass}`}
                >
                  <button
                    type="button"
                    onClick={() => setDynamicModalOpen(true)}
                    className="inline-flex items-center rounded-xl border border-primaryColor/30 bg-primaryColor/5 px-4 py-2.5 text-sm font-medium text-primaryColor transition hover:bg-primaryColor/10"
                  >
                    {isDynamicConfigured
                      ? "Edit NepalPay Dynamic"
                      : "Setup NepalPay Dynamic"}
                  </button>
                  {isDynamicConfigured && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primaryColor/10 px-2.5 py-1 text-xs font-medium text-primaryColor">
                      <Check size={12} />
                      Dynamic ready
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {accountType === "wallet" && (
            <div className="space-y-5 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Wallet details
                </p>
                <p className="mt-1 text-[13px] text-slate-500">
                  Add the wallet ID and QR customers will scan at checkout.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Wallet Name"
                  placeholder="e.g. eSewa, Khalti"
                  className="w-full"
                  {...register("walletAccountName")}
                  error={errors?.walletAccountName?.message as string}
          isRequired
        />
                <Input
                  label="Wallet ID"
                  placeholder="Enter wallet ID / number"
                  className="w-full"
                  {...register("walletId")}
                  error={errors?.walletId?.message as string}
          isRequired
        />
              </div>

              {renderQrUpload(
                "Upload this wallet’s QR image. JPG, PNG, or GIF · max 1MB.",
              )}
            </div>
          )}

          <div className="space-y-5 border-t border-slate-100 pt-5">
            <div className={fieldClass}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
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

            <Input
              label="Opening Balance"
              type="number"
              step={0.01}
              placeholder="0"
              className={fieldClass}
              {...register("openingBalance", { valueAsNumber: true })}
              error={errors?.openingBalance?.message as string}
            />

            <TextArea
              label="Description"
              placeholder="Optional notes"
              className={fieldClass}
              rows={3}
              {...register("description")}
              error={errors?.description?.message as string}
            />
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <Button
              type="submit"
              className="submit-button min-w-[7rem]"
              disabled={isSaving}
            >
              <span className="text-white">
                {isSaving
                  ? "Saving…"
                  : isEditMode
                    ? translate("Update")
                    : translate("Submit")}
              </span>
            </Button>
            <Button
              type="button"
              className="min-w-[7rem] bg-slate-500 hover:bg-slate-600"
              onClick={() => {
                reset();
                setDynamicQrDraft(null);
              }}
            >
              <span className="text-white">{translate("Reset")}</span>
            </Button>
          </div>
        </form>
      )}

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
    </div>
  );
};

export default AddEditAccount;
