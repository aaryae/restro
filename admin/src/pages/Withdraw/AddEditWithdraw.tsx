import React from "react";
import PageTitle from "@/components/PageTitle";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import Select from "@/components/Select";
import { Controller, useForm } from "react-hook-form";
import useTranslation from "@/locale/useTranslation";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Toast from "@/components/Toast";
import { WITHDRAW_LIST_ROUTE } from "@/routes/routeNames";
import { WithdrawSchema } from "./schema";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { WITHDRAW_URL } from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetApiQuery as useGetAccounts } from "@/redux/services/crudApi";

type WithdrawFormType = z.infer<typeof WithdrawSchema>;

const AddEditWithdraw: React.FC = () => {
  const translate = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<WithdrawFormType>({
    resolver: zodResolver(WithdrawSchema),
    defaultValues: {
      amount: 0,
      remarks: "",
    },
  });

  const [createWithdraw] = useCreateApiMutation();
  const [updateWithdraw] = useUpdateApiMutation();

  // Get accounts for dropdown
  const { data: accountsResponse, isFetching: isFetchingAccounts } =
    useGetAccounts({
      url: "account/list",
    });

  const withdrawGetUrl = isEditMode ? `${WITHDRAW_URL}${id}` : undefined;
  const { data: withdrawResp, isFetching: isFetchingWithdraw } = useGetApiQuery(
    withdrawGetUrl ? { url: withdrawGetUrl } : ({} as any),
  );

  const onSubmit = async (form: WithdrawFormType) => {
    if (!form.accountId) {
      Toast("Please select an account.", "warning");
      return;
    }

    try {
      setIsSaving(true);
      let res;
      if (isEditMode) {
        res = await updateWithdraw({
          url: `${WITHDRAW_URL}${id}`,
          body: form,
        }).unwrap();
      } else {
        res = await createWithdraw({ url: WITHDRAW_URL, body: form }).unwrap();
      }
      handleResponse({ res, onSuccess: () => navigate(WITHDRAW_LIST_ROUTE) });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSaving(false);
    }
  };

  // Prefill form in edit mode from API
  useEffect(() => {
    if (!isEditMode) return;
    const row = withdrawResp?.data;
    if (!row) return;
    const formDefaults: any = {
      accountId: row?.accountId || 0,
      amount: Number(row?.amount) || 0,
      remarks: row?.remarks || "",
    };
    reset(formDefaults);
  }, [isEditMode, withdrawResp, reset]);

  const accounts = accountsResponse?.data?.data || [];

  // Transform accounts data for Select component
  const accountOptions = accounts.map((account: any) => ({
    label: `${account.name} (${account.accountType})`,
    value: account.id,
  }));

  return (
    <>
      <PageTitle
        title={isEditMode ? "Edit Withdrawal" : "Add Withdrawal"}
        isBack
      />
      {isEditMode && isFetchingWithdraw ? (
        <div className="flex items-center justify-center p-6">Loading...</div>
      ) : (
        <form
          className="form-container grid grid-cols-1 gap-[1rem] mt-[1rem]"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Account Selection */}
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <Select
                label="Account"
                options={accountOptions}
                className="w-full md:w-1/2"
                error={errors?.accountId?.message}
                {...field}
                value={field.value?.toString() || ""}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />

          {/* Amount */}
          <Input
            label="Withdrawal Amount"
            type="number"
            step={0.01}
            placeholder="Enter withdrawal amount"
            className="w-full md:w-1/2"
            {...register("amount", { valueAsNumber: true })}
            error={errors?.amount?.message as string}
            isRequired
          />

          {/* Remarks */}
          <TextArea
            label="Remarks"
            placeholder="Reason for withdrawal (optional)"
            className="w-full md:w-1/2"
            rows={4}
            {...register("remarks")}
            error={errors?.remarks?.message as string}
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
              handleClick={() => reset()}
            >
              <div className="flex justify-center items-center gap-[0.5rem] text-white ">
                Reset
              </div>
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default AddEditWithdraw;
