import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import Select from "@/components/Select";
import {
  PaymentIntegration,
  PaymentIntegrationInput,
} from "@/redux/services/paymentIntegration";

const buildSchema = (isEdit: boolean) => {
  const secret = isEdit
    ? z.string().optional()
    : z.string().min(1, "Required");
  return z.object({
    merchantId: z.string().min(1, "Required"),
    merchantCategoryCode: z.string().min(1, "Required"),
    merchantName: z.string().min(1, "Required"),
    acquirerId: z.string().min(1, "Required"),
    merchantCity: z.string().min(1, "Required"),
    merchantPostalCode: z.string().min(1, "Required"),
    username: z.string().min(1, "Required"),
    password: secret,
    npiUsername: z.string().min(1, "Required"),
    accountId: z.string().optional(),
    webhookToken: secret,
    npiPrivateKey: secret,
    isActive: z.boolean().optional(),
  });
};

export type NepalPayFormType = z.infer<ReturnType<typeof buildSchema>>;

export const emptyNepalPayValues: NepalPayFormType = {
  merchantId: "",
  merchantCategoryCode: "",
  merchantName: "",
  acquirerId: "",
  merchantCity: "",
  merchantPostalCode: "",
  username: "",
  password: "",
  npiUsername: "",
  accountId: "",
  webhookToken: "",
  npiPrivateKey: "",
  isActive: true,
};

export interface NepalPayIntegrationFormHandle {
  validate: () => Promise<PaymentIntegrationInput | null>;
}

interface Props {
  editing?: PaymentIntegration | null;
  initialDraft?: PaymentIntegrationInput | null;
  accountId?: string;
  accountOptions?: { value: string; label: string }[];
  hideAccountSelect?: boolean;
  showActions?: boolean;
  submitLabel?: string;
  onSubmit?: (data: PaymentIntegrationInput) => Promise<void>;
  isSubmitting?: boolean;
}

const NepalPayIntegrationForm = forwardRef<
  NepalPayIntegrationFormHandle,
  Props
>(
  (
    {
      editing,
      initialDraft,
      accountId,
      accountOptions = [],
      hideAccountSelect = false,
      showActions = false,
      submitLabel = "Save Payment Mode",
      onSubmit,
      isSubmitting = false,
    },
    ref,
  ) => {
    const isEdit = Boolean(editing);

    const {
      register,
      control,
      handleSubmit,
      reset,
      trigger,
      getValues,
      formState: { errors },
    } = useForm<NepalPayFormType>({
      resolver: zodResolver(buildSchema(isEdit)),
      defaultValues: emptyNepalPayValues,
    });

    useEffect(() => {
      if (editing) {
        reset({
          ...emptyNepalPayValues,
          merchantId: editing.merchantId ?? "",
          merchantCategoryCode: editing.merchantCategoryCode ?? "",
          merchantName: editing.merchantName ?? "",
          acquirerId: editing.acquirerId ?? "",
          merchantCity: editing.merchantCity ?? "",
          merchantPostalCode: editing.merchantPostalCode ?? "",
          username: editing.username ?? "",
          npiUsername: editing.npiUsername ?? "",
          accountId: editing.accountId ? String(editing.accountId) : "",
          isActive: editing.isActive,
          password: "",
          webhookToken: "",
          npiPrivateKey: "",
        });
      } else if (initialDraft) {
        reset({
          ...emptyNepalPayValues,
          merchantId: initialDraft.merchantId ?? "",
          merchantCategoryCode: initialDraft.merchantCategoryCode ?? "",
          merchantName: initialDraft.merchantName ?? "",
          acquirerId: initialDraft.acquirerId ?? "",
          merchantCity: initialDraft.merchantCity ?? "",
          merchantPostalCode: initialDraft.merchantPostalCode ?? "",
          username: initialDraft.username ?? "",
          npiUsername: initialDraft.npiUsername ?? "",
          accountId: initialDraft.accountId
            ? String(initialDraft.accountId)
            : accountId ?? "",
          isActive: initialDraft.isActive ?? true,
        });
      } else {
        reset({
          ...emptyNepalPayValues,
          accountId: accountId ?? "",
        });
      }
    }, [editing, initialDraft, accountId, reset]);

    const toPayload = (data: NepalPayFormType): PaymentIntegrationInput => {
      const body: PaymentIntegrationInput = {
        name: data.merchantName,
        merchantId: data.merchantId,
        merchantCategoryCode: data.merchantCategoryCode,
        merchantName: data.merchantName,
        acquirerId: data.acquirerId,
        merchantCity: data.merchantCity,
        merchantPostalCode: data.merchantPostalCode,
        username: data.username,
        npiUsername: data.npiUsername,
        accountId: (accountId || data.accountId)
          ? Number(accountId || data.accountId)
          : null,
        isActive: data.isActive ?? true,
      };
      if (data.password) body.password = data.password;
      if (data.webhookToken) body.webhookToken = data.webhookToken;
      if (data.npiPrivateKey) body.npiPrivateKey = data.npiPrivateKey;
      return body;
    };

    useImperativeHandle(ref, () => ({
      validate: async () => {
        const valid = await trigger();
        if (!valid) return null;
        return toPayload(getValues());
      },
    }));

    const secretPlaceholder = isEdit
      ? "Leave blank to keep current"
      : undefined;

    const handleFormSubmit = handleSubmit(async (data) => {
      if (!onSubmit) return;
      await onSubmit(toPayload(data));
    });

    return (
      <form
        onSubmit={handleFormSubmit}
        className={showActions ? "space-y-4" : "space-y-4"}
      >
        {!hideAccountSelect && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              NepalPay Dynamic QR Setup
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Enter your NepalPay details. A new QR code will be created automatically at checkout.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Merchant ID"
            placeholder="Enter Merchant ID"
            isRequired
            {...register("merchantId")}
            error={errors.merchantId?.message}
          />
          <Input
            label="Merchant Category Code"
            placeholder="Enter Merchant Category Code"
            isRequired
            {...register("merchantCategoryCode")}
            error={errors.merchantCategoryCode?.message}
          />
          <Input
            label="Merchant Name"
            placeholder="Enter Merchant Name"
            isRequired
            {...register("merchantName")}
            error={errors.merchantName?.message}
          />
          <Input
            label="Acquirer ID"
            placeholder="Enter Acquirer ID"
            isRequired
            {...register("acquirerId")}
            error={errors.acquirerId?.message}
          />
          <Input
            label="Merchant City"
            placeholder="Enter Merchant City"
            isRequired
            {...register("merchantCity")}
            error={errors.merchantCity?.message}
          />
          <Input
            label="Merchant Postal Code"
            placeholder="Enter Merchant Postal Code"
            isRequired
            {...register("merchantPostalCode")}
            error={errors.merchantPostalCode?.message}
          />
          <Input
            label="Username"
            placeholder="Enter Username"
            isRequired
            {...register("username")}
            error={errors.username?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder={secretPlaceholder ?? "Enter Password"}
            isRequired={!isEdit}
            {...register("password")}
            error={errors.password?.message}
          />
          <Input
            label="NPI Username"
            placeholder="Enter NPI Username"
            isRequired
            {...register("npiUsername")}
            error={errors.npiUsername?.message}
          />
          {!hideAccountSelect && (
            <Controller
              control={control}
              name="accountId"
              render={({ field }) => (
                <Select
                  label={
                    <>
                      Linked Account <span className="text-red-500">*</span>
                    </>
                  }
                  options={accountOptions}
                  name={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  error={errors.accountId?.message}
                />
              )}
            />
          )}
          <Input
            label="Webhook Token"
            type="password"
            placeholder={secretPlaceholder ?? "Enter Webhook Token"}
            isRequired={!isEdit}
            {...register("webhookToken")}
            error={errors.webhookToken?.message}
            className="md:col-span-2"
          />
        </div>

        <div className="input-container">
          <label className="input-label">
            NPI Private Key {!isEdit && <span className="text-red-500">*</span>}
          </label>
          <textarea
            rows={4}
            placeholder={secretPlaceholder ?? "Enter NPI Private Key"}
            className="w-full border rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#36a77d]"
            {...register("npiPrivateKey")}
          />
          {errors.npiPrivateKey?.message && (
            <span className="input-error">{errors.npiPrivateKey.message}</span>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register("isActive")} />
          Set as the active payment mode (used to generate QR)
        </label>

        {showActions && (
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() =>
                reset(
                  editing
                    ? {
                        ...emptyNepalPayValues,
                        merchantId: editing.merchantId ?? "",
                        merchantCategoryCode: editing.merchantCategoryCode ?? "",
                        merchantName: editing.merchantName ?? "",
                        acquirerId: editing.acquirerId ?? "",
                        merchantCity: editing.merchantCity ?? "",
                        merchantPostalCode: editing.merchantPostalCode ?? "",
                        username: editing.username ?? "",
                        npiUsername: editing.npiUsername ?? "",
                        accountId: editing.accountId
                          ? String(editing.accountId)
                          : "",
                        isActive: editing.isActive,
                      }
                    : { ...emptyNepalPayValues, accountId: accountId ?? "" },
                )
              }
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-md"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#36a77d] hover:bg-[#36a77d]/80 disabled:opacity-60 text-white px-6 py-2 rounded-md"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        )}
      </form>
    );
  },
);

NepalPayIntegrationForm.displayName = "NepalPayIntegrationForm";

export default NepalPayIntegrationForm;
