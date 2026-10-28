import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { useGetApiQuery } from "@/redux/services/crudApi";
import { useCreateTransferMutation } from "@/redux/services/transfer";
import { buildQueryString } from "@/utils/generalHelper";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { createTransferSchema } from "./transferschema";
import { CurrencySign } from "@/constants";

type TransferFormInput = z.input<ReturnType<typeof createTransferSchema>>;
type TransferFormValues = z.infer<ReturnType<typeof createTransferSchema>>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payload?: {
    fromAccountId: number;
    emptiedSource: boolean;
  }) => void;
  /** Prefill / lock source account (e.g. close-account flow). */
  prefillFromAccountId?: number | null;
  /** Force amount to the full source balance and lock the field. */
  transferFullBalance?: boolean;
  title?: string;
  submitLabel?: string;
}

const initialValues: TransferFormInput = {
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  remarks: "",
};

const TransferModel: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  prefillFromAccountId = null,
  transferFullBalance = false,
  title = "Transfer",
  submitLabel = "Transfer",
}) => {
  const userId = useSelector((state: RootState) => state.auth.id);

  const url = buildQueryString("account/list", { page: 1, limit: 100 });
  const { data: accountsData } = useGetApiQuery({ url }, { skip: !isOpen });
  const accounts = accountsData?.data?.data || [];

  const accountBalanceById = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((acc: any) => {
      map.set(String(acc.id), Number(acc.currentBalance) || 0);
    });
    return map;
  }, [accounts]);

  const transferSchema = useMemo(
    () =>
      createTransferSchema((accountId) => accountBalanceById.get(accountId)),
    [accountBalanceById],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: initialValues,
  });

  const watchedFromAccountId = watch("fromAccountId");

  useEffect(() => {
    if (!isOpen) return;

    const fromId =
      prefillFromAccountId != null ? String(prefillFromAccountId) : "";
    const balance = fromId ? accountBalanceById.get(fromId) : undefined;
    const amount =
      transferFullBalance && balance != null && balance > 0
        ? String(balance)
        : "";

    reset({
      ...initialValues,
      fromAccountId: fromId,
      amount,
      remarks: transferFullBalance
        ? "Transfer remaining balance before deleting account"
        : "",
    });
  }, [
    isOpen,
    reset,
    prefillFromAccountId,
    transferFullBalance,
    accountBalanceById,
  ]);

  useEffect(() => {
    if (!isOpen || !transferFullBalance || !watchedFromAccountId) return;
    const balance = accountBalanceById.get(watchedFromAccountId);
    if (balance != null && balance > 0) {
      setValue("amount", String(balance), { shouldValidate: true });
    }
  }, [
    isOpen,
    transferFullBalance,
    watchedFromAccountId,
    accountBalanceById,
    setValue,
  ]);

  const accountOptions = useMemo(
    () =>
      accounts
        .filter((acc: any) => acc.status === "active")
        .map((acc: any) => ({
          value: String(acc.id),
          label: `${acc.name} (${acc.accountType}) - Bal: ${Number(acc.currentBalance || 0).toFixed(2)}`,
        })),
    [accounts],
  );

  const destinationOptions = useMemo(
    () =>
      accountOptions.filter((option) => option.value !== watchedFromAccountId),
    [accountOptions, watchedFromAccountId],
  );

  const sourceBalance = watchedFromAccountId
    ? accountBalanceById.get(watchedFromAccountId)
    : undefined;

  const sourceLocked = prefillFromAccountId != null;
  const amountLocked = transferFullBalance;

  const [createTransfer, { isLoading }] = useCreateTransferMutation();

  const onSubmit = async (data: TransferFormValues) => {
    try {
      if (!userId) throw new Error("User not identified");
      const amount = Number(data.amount);
      const fromAccountId = Number(data.fromAccountId);
      const sourceBal = accountBalanceById.get(String(fromAccountId)) ?? 0;
      const payload = {
        fromAccountId,
        toAccountId: Number(data.toAccountId),
        userId: Number(userId),
        amount,
        remarks: data.remarks.trim(),
      };
      const res = await createTransfer(payload).unwrap();
      const emptiedSource = amount >= sourceBal;
      handleResponse({
        res,
        onSuccess: () => onSuccess?.({ fromAccountId, emptiedSource }),
      });
      reset(initialValues);
      onClose();
    } catch (error) {
      handleError({ error });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="serve-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div
        role="dialog"
        aria-modal="true"
        className="serve-modal flex w-[90%] max-w-2xl flex-col rounded-xl md:max-w-3xl"
      >
        <div className="px-6 md:px-8 py-4 md:py-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {transferFullBalance ? (
            <p className="mt-1 text-sm text-slate-500">
              Move the full balance to another account. Delete becomes available
              once the balance is {CurrencySign}0.
            </p>
          ) : null}
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 md:p-8 space-y-4 md:space-y-5"
        >
          <Controller
            name="fromAccountId"
            control={control}
            render={({ field }) => (
              <Select
                label="From Account"
                value={field.value ?? ""}
                onBlur={field.onBlur}
                name={field.name}
                options={accountOptions}
                error={errors.fromAccountId?.message}
                placeholder="Select source account"
                onValueChange={field.onChange}
                disabled={sourceLocked}
                isRequired
              />
            )}
          />
          <Controller
            name="toAccountId"
            control={control}
            render={({ field }) => (
              <Select
                label="To Account"
                value={field.value ?? ""}
                onBlur={field.onBlur}
                name={field.name}
                options={destinationOptions}
                error={errors.toAccountId?.message}
                placeholder="Select destination account"
                onValueChange={field.onChange}
                isRequired
              />
            )}
          />
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            max={sourceBalance != null ? String(sourceBalance) : undefined}
            placeholder="0.00"
            {...register("amount")}
            error={errors.amount?.message}
            disabled={amountLocked}
            isRequired
          />
          {sourceBalance != null ? (
            <p className="text-xs text-slate-500 -mt-2">
              Available balance: {CurrencySign}
              {sourceBalance.toFixed(2)}
            </p>
          ) : null}
          <Input
            label="Remarks"
            placeholder="Reason for transfer"
            {...register("remarks")}
            error={errors.remarks?.message}
            isRequired
          />

          <div className="form-actions flex justify-start gap-3 pt-2 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="bg-[#36a77d] hover:bg-[#36a77d]/80 disabled:opacity-60 text-white px-6 py-2 rounded-md"
            >
              {isSubmitting || isLoading ? "Processing..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModel;
