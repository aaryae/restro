import React from "react";
import PageTitle from "@/components/PageTitle";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import { Controller, useForm } from "react-hook-form";
import useTranslation from "@/locale/useTranslation";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import MediaComponent from "@/components/MediaComponent";
import {
  ImageInputUI,
  MultipleImageInputUI,
} from "@/components/ImageComponent";
import { useState } from "react";
import { useAppSelector } from "@/redux/store/hooks";

function AddEditAccount() {
  const [mediaOpen, setMediaOpen] = useState<boolean>(false);

  const selectedImage = useAppSelector((state) => state.media.selectedImage) as
    | string
    | "";

  const translate = useTranslation();
  const { id } = useParams();
  const isEditMode = !!id;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<{ [key: string]: any }>({
    defaultValues: {
      name: "",
      accountName: "",
      accountNumber: "",
      accountType: "cash",
      openingBalance: undefined,
      status: "active",
      notes: "",
    },
  });

  const accountTypeOptions = [
    { label: "Cash", value: "cash" },
    { label: "Bank", value: "bank" },
    { label: "Wallet", value: "wallet" },
  ];

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const onSubmit = (data: any) => {
    // // API not ready yet; just log the payload for now
    // // Replace with mutation once backend is available
    // console.log("Bank form submit payload:", data);
    // // reset(); // uncomment if you want to clear after submit
  };

  // Prefill form in edit mode (mock data until API integration)
  useEffect(() => {
    if (!isEditMode) return;
    const mock = {
      name: "Nabil Bank",
      accountName: "Tech Nirvana Pvt. Ltd.",
      accountNumber: "00123456789",
      accountType: "bank",
      openingBalance: 50000,
      status: "active",
      notes: "Primary operating account",
    };
    reset(mock);
  }, [isEditMode, reset]);

  const accountType = watch("accountType");

  useEffect(() => {
    if (accountType === "cash") {
      setValue("bankAccountName", undefined);
      setValue("bankAccountNumber", undefined);
      setValue("walletAccountName", undefined);
      setValue("walletId", undefined);
    }
    if (accountType === "bank") {
      setValue("walletAccountName", undefined);
      setValue("walletId", undefined);
    }
    if (accountType === "wallet") {
      setValue("bankAccountName", undefined);
      setValue("bankAccountNumber", undefined);
    }
  }, [accountType, setValue]);

  return (
    <>
      <PageTitle title={isEditMode ? "Edit Account" : "Add Account"} isBack />
      <form
        className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* <Input
          label="Bank Name"
          placeholder="Enter bank name"
          className="w-full md:w-1/2"
          {...register("name")}
          error={errors?.name?.message as string}
          isRequired
        /> */}

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
              <div className="flex space-x-5 p-1 rounded-lg">
                {accountTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`flex border-2 py-3 px-8 text-base font-medium rounded-md transition-colors ${
                      field.value === option.value
                        ? "bg-blue-500 text-white border-none"
                        : "bg-white text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => field.onChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <Input
          label="Account Number"
          placeholder="Enter account number"
          className="w-full md:w-1/2"
          {...register("accountNumber")}
          error={errors?.accountNumber?.message as string}
          isRequired
        />

        {accountType === "bank" && (
          <>
            <Input
              label="Bank Account Name"
              placeholder="Enter bank account name"
              className="w-full md:w-1/2"
              {...register("bankAccountName")}
              error={errors?.bankAccountName?.message as string}
              isRequired
            />
            <Input
              label="Bank Account Number"
              placeholder="Enter bank account number"
              className="w-full md:w-1/2"
              {...register("bankAccountNumber")}
              error={errors?.bankAccountNumber?.message as string}
              isRequired
            />
            <Input
              label="Opening Balance"
              type="number"
              step={0.01}
              placeholder="Enter opening balance"
              className="w-full md:w-1/2"
              {...register("openingBalance", { valueAsNumber: true })}
              error={errors?.openingBalance?.message as string}
            />
            <Input
              label="Current Balance"
              type="number"
              step={0.01}
              placeholder="Enter current balance"
              className="w-full md:w-1/2"
              {...register("currentBalance", { valueAsNumber: true })}
              error={errors?.openingBalance?.message as string}
            />
            <div className="flex flex-col">
              <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                Bill Image
                <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col gap-2 w-full md:w-[25rem]">
                <MediaComponent
                  title={<ImageInputUI image={watch("billImage")} />}
                  handleConfirmImage={() => {
                    if (typeof selectedImage === "string") {
                      setValue("billImage", selectedImage, {
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
                {watch("billImage") && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-red-500 text-white text-sm"
                      onClick={() =>
                        setValue("billImage", "", {
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
            />
            <Input
              label="Wallet ID"
              placeholder="Enter wallet ID"
              className="w-full md:w-1/2"
              {...register("walletId")}
              error={errors?.walletId?.message as string}
              isRequired
            />
          </>
        )}

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
        <div className="flex flex-col">
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
            Bill Image
            <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-2 w-full md:w-[25rem]">
            <MediaComponent
              title={<ImageInputUI image={watch("billImage")} />}
              handleConfirmImage={() => {
                if (typeof selectedImage === "string") {
                  setValue("billImage", selectedImage, {
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
            {watch("billImage") && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-red-500 text-white text-sm"
                  onClick={() =>
                    setValue("billImage", "", {
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
          </div>
        </div>
        <TextArea
          label="Notes"
          placeholder="Additional details (optional)"
          className="w-full md:w-1/2"
          rows={6}
          {...register("notes")}
          error={errors?.notes?.message as string}
        />

        <div className="flex justify-start gap-[0.75rem]">
          <Button type="submit" className="submit-button w-[6.5rem]">
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
    </>
  );
}

export default AddEditAccount;
