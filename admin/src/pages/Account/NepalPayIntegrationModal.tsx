import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import {
  PaymentIntegration,
  useCreatePaymentIntegrationMutation,
  useUpdatePaymentIntegrationMutation,
} from "@/redux/services/paymentIntegration";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editing?: PaymentIntegration | null;
}

const buildSchema = (isEdit: boolean) => {
  // On edit, secrets may be left blank to keep the stored value.
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
    accountId: z.string().min(1, "Required"),
    webhookToken: secret,
    npiPrivateKey: secret,
    isActive: z.boolean().optional(),
  });
};

type FormType = z.infer<ReturnType<typeof buildSchema>>;

const emptyValues: FormType = {
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

const NepalPayIntegrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  editing,
}) => {
  const isEdit = Boolean(editing);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormType>({
    resolver: zodResolver(buildSchema(isEdit)),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      reset({
        ...emptyValues,
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
        // secrets always blank in the form
        password: "",
        webhookToken: "",
        npiPrivateKey: "",
      });
    } else {
      reset(emptyValues);
    }
  }, [isOpen, editing, reset]);

  const { data: accountsData } = useGetApiQuery({
    url: buildQueryString("account/list", { page: 1, limit: 100 }),
  });

  const accountOptions = useMemo(() => {
    const accounts: any[] = accountsData?.data?.data || [];
    return accounts
      .filter((a) => a?.accountType === "bank" || a?.accountType === "wallet")
      .map((a) => ({
        value: String(a.id),
        label: `${a.name} (${a.accountType})`,
      }));
  }, [accountsData]);

  const [createIntegration, { isLoading: creating }] =
    useCreatePaymentIntegrationMutation();
  const [updateIntegration, { isLoading: updating }] =
    useUpdatePaymentIntegrationMutation();

  const onSubmit = async (data: FormType) => {
    try {
      const body: any = {
        name: data.merchantName,
        merchantId: data.merchantId,
        merchantCategoryCode: data.merchantCategoryCode,
        merchantName: data.merchantName,
        acquirerId: data.acquirerId,
        merchantCity: data.merchantCity,
        merchantPostalCode: data.merchantPostalCode,
        username: data.username,
        npiUsername: data.npiUsername,
        accountId: data.accountId ? Number(data.accountId) : null,
        isActive: data.isActive ?? true,
      };
      // Only send secrets when provided (blank = keep existing on edit).
      if (data.password) body.password = data.password;
      if (data.webhookToken) body.webhookToken = data.webhookToken;
      if (data.npiPrivateKey) body.npiPrivateKey = data.npiPrivateKey;

      const res =
        isEdit && editing
          ? await updateIntegration({ id: editing.id, body }).unwrap()
          : await createIntegration(body).unwrap();

      handleResponse({ res, onSuccess: () => onSuccess?.() });
      reset(emptyValues);
      onClose();
    } catch (error) {
      handleError({ error });
    }
  };

  if (!isOpen) return null;

  const secretPlaceholder = isEdit
    ? "Leave blank to keep current"
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 md:px-8 py-4 border-b flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEdit ? "Edit Nepal Pay Integration" : "Create Nepal Pay Integration"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 md:p-8 space-y-4 overflow-y-auto"
        >
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
            <Select
              label={
                <>
                  Payment Mode <span className="text-red-500">*</span>
                </>
              }
              options={accountOptions}
              {...register("accountId")}
              error={errors.accountId?.message}
            />
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

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => reset(emptyValues)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-md"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting || creating || updating}
              className="bg-[#36a77d] hover:bg-[#36a77d]/80 disabled:opacity-60 text-white px-6 py-2 rounded-md"
            >
              {isSubmitting || creating || updating
                ? "Saving..."
                : "Save Payment Mode"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NepalPayIntegrationModal;
