import React from "react";
import PageTitle from "@/components/PageTitle";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import { Controller, useForm } from "react-hook-form";
import useTranslation from "@/locale/useTranslation";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MediaComponent from "@/components/MediaComponent";
import { ImageInputUI } from "@/components/ImageComponent";
import { useState } from "react";
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

type AccountFromType = z.infer<typeof AccountSchema>;

const AddEditAccount: React.FC = () => {
  const [mediaOpen, setMediaOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
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
      accountType: "cash",
      status: "active",
      openingBalance: 0,
      description: "",
    },
  });

  const accountTypeOptions = [
    { label: "Cash", value: "cash" },
    { label: "Bank", value: "bank" },
    { label: "Wallet", value: "wallet" },
  ];

  // const statusOptions = [
  //   { label: "Active", value: "active" },
  //   { label: "Inactive", value: "inactive" },
  // ];

  const [createAccount] = useCreateApiMutation();
  const [updateAccount] = useUpdateApiMutation();

  const accountGetUrl = isEditMode ? `${ACCOUNT_URL}${id}` : undefined;
  const { data: accountResp, isFetching: isFetchingAccount } = useGetApiQuery(
    accountGetUrl ? { url: accountGetUrl } : ({} as any),
  );

  const onSubmit = async (form: AccountFromType) => {
    if (form.accountType === "bank" && !form.bankAccountNumber) {
      Toast("Please enter bank account number.", "warning");
      return;
    }
    if (
      form.accountType === "wallet" &&
      (!form.walletId || !form.walletAccountName)
    ) {
      Toast("Please enter wallet account name and ID.", "warning");
      return;
    }

    // Static QR is optional now; if provided, it will be saved for bank/wallet

    const payload: any = {
      accountType: form.accountType,
      openingBalance: Number(form.openingBalance) || 0,
      description: form.description || "",
      name: form.accountName,
    };
    if (form.accountType === "bank") {
      payload.bankAccountNumber = form.bankAccountNumber;
      payload.staticQrUrl = form.staticQrUrl; // required by schema
    } else if (form.accountType === "wallet") {
      payload.walletId = form.walletId;
      payload.staticQrUrl = form.staticQrUrl; // required by schema
    }

    try {
      setIsSaving(true);
      let res;
      if (isEditMode) {
        // include status only for update to align with backend validation
        payload.status = (form.status || "active").toLowerCase();
        res = await updateAccount({
          url: `${ACCOUNT_URL}${id}`,
          body: payload,
        }).unwrap();
      } else {
        res = await createAccount({ url: ACCOUNT_URL, body: payload }).unwrap();
      }
      handleResponse({ res, onSuccess: () => navigate(BANK_LIST_ROUTE) });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSaving(false);
    }
  };
  // Prefill form in edit mode from API
  useEffect(() => {
    if (!isEditMode) return;
    const row = accountResp?.data;
    if (!row) return;
    const formDefaults: any = {
      accountName: row?.name || "",
      accountType: row?.accountType || "cash",
      openingBalance: Number(row?.openingBalance) || undefined,
      description: row?.description || "",
      bankAccountNumber: row?.bankAccount?.bankAccountNumber || "",
      // Prefill wallet account display name from account name for wallet accounts
      walletAccountName: row?.accountType === "wallet" ? row?.name || "" : "",
      walletId: row?.walletAccount?.walletId || "",
      staticQrUrl:
        row?.bankAccount?.staticQrUrl || row?.walletAccount?.staticQrUrl || "",
      status: row?.status || "active",
    };
    reset(formDefaults);
  }, [isEditMode, accountResp, reset]);

  const accountType = watch("accountType");

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
    }
    if (accountType === "bank") {
      setValue("walletAccountName", undefined);
      setValue("walletId", undefined);
    }
    if (accountType === "wallet") {
      setValue("bankAccountNumber", undefined);
    }
  }, [accountType, setValue]);

  return (
    <>
      <PageTitle title={isEditMode ? "Edit Account" : "Add Account"} isBack />
      {isEditMode && isFetchingAccount ? (
        <div className="flex items-center justify-center p-6">Loading...</div>
      ) : (
        <form
          className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Input
            label="Account Name"
            placeholder="Enter account holder name"
            className="w-full md:w-1/2"
            {...register("accountName")}
            error={errors?.accountName?.message as string}
            isRequired
          />

          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-2 input-label">
              Account Type
            </label>
            <Controller
              name="accountType"
              control={control}
              render={({ field }) => (
                <>
                  <div className="flex space-x-5 p-1 rounded-lg">
                    {accountTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`flex border-2 py-3 px-8 text-base font-medium rounded-md transition-colors ${
                          field.value === option.value
                            ? "bg-primaryColor text-white border-none"
                            : "bg-white text-gray-700 hover:bg-gray-200"
                        }`}
                        onClick={() => field.onChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {errors.accountType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.accountType.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Status Radio Group */}
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-2 input-label">
              Status
            </label>
            <Controller
              name="status"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <>
                  <div className="flex items-center gap-8">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        className="h-4 w-4 text-blue-600 border-gray-300"
                        value="active"
                        checked={field.value === "active"}
                        onChange={() => field.onChange("active")}
                      />
                      <span>Active</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        className="h-4 w-4 text-blue-600 border-gray-300"
                        value="inactive"
                        checked={field.value === "inactive"}
                        onChange={() => field.onChange("inactive")}
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                  {errors.status && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.status.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {accountType === "bank" && (
            <>
              <Input
                label="Bank Account Number"
                placeholder="Enter bank account number"
                className="w-full md:w-1/2"
                {...register("bankAccountNumber")}
                error={errors?.bankAccountNumber?.message as string}
                isRequired
              />
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                  Static QR <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2 w-full md:w-[25rem]">
                  <MediaComponent
                    title={<ImageInputUI image={watch("staticQrUrl")} />}
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
                  {/* Register the field so resolver can validate and errors can show */}
                  <input type="hidden" {...register("staticQrUrl")} />
                  {watch("staticQrUrl") && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-red-500 text-white text-sm"
                        onClick={() =>
                          setValue("staticQrUrl", "", {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {(errors as any)?.staticQrUrl && (
                    <p className="text-red-500 text-xs mt-1">
                      {(errors as any)?.staticQrUrl?.message as string}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
          {accountType === "wallet" && (
            <>
              <Input
                label="Wallet Account Name"
                placeholder="Enter wallet account name"
                className="w-full md:w-1/2"
                {...register("walletAccountName")}
                error={errors?.walletAccountName?.message as string}
                isRequired
              />{" "}
              <Input
                label="Wallet ID"
                placeholder="Enter wallet ID"
                className="w-full md:w-1/2"
                {...register("walletId", { required: true })}
                error={errors?.walletId?.message as string}
                isRequired
              />
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                  Static QR <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2 w-full md:w-[25rem]">
                  <MediaComponent
                    title={<ImageInputUI image={watch("staticQrUrl")} />}
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
                  {/* Register the field so resolver can validate and errors can show */}
                  <input type="hidden" {...register("staticQrUrl")} />
                  {watch("staticQrUrl") && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-red-500 text-white text-sm"
                        onClick={() =>
                          setValue("staticQrUrl", "", {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {(errors as any)?.staticQrUrl && (
                    <p className="text-red-500 text-xs mt-1">
                      {(errors as any)?.staticQrUrl?.message as string}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <Input
            label="Opening Balance"
            type="number"
            step={0.01}
            placeholder="Enter opening balance"
            className="w-full md:w-1/2"
            {...register("openingBalance", { valueAsNumber: true })}
            error={errors?.openingBalance?.message as string}
          />

          {/* <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Status"
              options={statusOptions}
              className="w-full md:w-1/2"
              required
            />
          )}
        /> */}

          <TextArea
            label="Description"
            placeholder="Additional details (optional)"
            className="w-full md:w-1/2"
            rows={6}
            {...register("description")}
            error={errors?.description?.message as string}
          />

          <div className="flex justify-start gap-[0.75rem]">
            <Button
              type="submit"
              className="submit-button w-[6.5rem]"
              disabled={isSaving}
            >
              <div className="flex justify-center items-center gap-[0.5rem] text-white ">
                {isEditMode ? translate("Update") : translate("Submit")}
              </div>
            </Button>
            <Button
              type="button"
              className="w-[6.5rem] bg-gray-500"
              onClick={() => reset()}
            >
              <div className="flex justify-center items-center gap-[0.5rem] text-white ">
                {translate("Reset")}
              </div>
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default AddEditAccount;
