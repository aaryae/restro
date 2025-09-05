import React from "react";
import PageTitle from "@/components/PageTitle";
import Input from "@/components/Input";
import Select from "@/components/Select";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import { Controller, useForm } from "react-hook-form";
import useTranslation from "@/locale/useTranslation";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

type Props = {};

const AddEditBanks = (props: Props) => {
  const translate = useTranslation();
  const { id } = useParams();
  const isEditMode = !!id;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ [key: string]: any }>({
    defaultValues: {
      name: "",
      accountName: "",
      accountNumber: "",
      accountType: "",
      openingBalance: undefined,
      status: "active",
      notes: "",
    },
  });

  const accountTypeOptions = [
    { label: "Savings", value: "savings" },
    { label: "Current", value: "current" },
    { label: "Checking", value: "checking" },
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
      accountType: "current",
      openingBalance: 50000,
      status: "active",
      notes: "Primary operating account",
    };
    reset(mock);
  }, [isEditMode, reset]);

  return (
    <>
      <PageTitle title={isEditMode ? "Edit Bank" : "Add Bank"} isBack />
      <form
        className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Input
          label="Bank Name"
          placeholder="Enter bank name"
          className="w-full md:w-1/2"
          {...register("name")}
          error={errors?.name?.message as string}
          isRequired
        />

        <Input
          label="Account Name"
          placeholder="Enter account holder name"
          className="w-full md:w-1/2"
          {...register("accountName")}
          error={errors?.accountName?.message as string}
          isRequired
        />

        <Input
          label="Account Number"
          placeholder="Enter account number"
          className="w-full md:w-1/2"
          {...register("accountNumber")}
          error={errors?.accountNumber?.message as string}
          isRequired
        />

        <Controller
          name="accountType"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Account Type"
              options={accountTypeOptions}
              className="w-full md:w-1/2"
              required
            />
          )}
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

        <Controller
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
        />

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
};

export default AddEditBanks;
