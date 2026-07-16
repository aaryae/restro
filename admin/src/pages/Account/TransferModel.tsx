import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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
import TransferSchema from "./transferschema";

type TransferFormType = z.infer<typeof TransferSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TransferModel: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const userId = useSelector((state: RootState) => state.auth.id);

  const initialValues = {
    fromAccountId: "",
    toAccountId: "",
    amount: "" as any,
    remarks: "",
  } as const;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormType>({
    resolver: zodResolver(TransferSchema),
    defaultValues: initialValues,
  });
  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [isOpen, reset]);

  const url = buildQueryString("account/list", { page: 1, limit: 100 });
  const { data: accountsData } = useGetApiQuery({ url });
  const accounts = accountsData?.data?.data || [];

  const accountOptions = useMemo(
    () =>
      accounts.map((acc: any) => ({
        value: String(acc.id),
        label: `${acc.name} (${acc.accountType}) - Bal: ${acc.currentBalance}`,
      })),
    [accounts],
  );

  const [createTransfer, { isLoading }] = useCreateTransferMutation();

  const onSubmit = async (data: TransferFormType) => {
    try {
      if (!userId) throw new Error("User not identified");
      const payload = {
        fromAccountId: Number(data.fromAccountId),
        toAccountId: Number(data.toAccountId),
        userId: Number(userId),
        amount: Number(data.amount),
        remarks: data.remarks,
      };
      const res = await createTransfer(payload).unwrap();
      handleResponse({ res, onSuccess: () => onSuccess?.() });
      reset(initialValues);
      onClose();
    } catch (error) {
      handleError({ error });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-[90%] max-w-2xl md:max-w-3xl  rounded-xl shadow-2xl flex flex-col">
        <div className="px-6 md:px-8 py-4 md:py-5 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Transfer</h3>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 md:p-8 space-y-4 md:space-y-5"
        >
          <Select
            label="From Account"
            {...register("fromAccountId")}
            options={accountOptions}
            error={errors.fromAccountId?.message}
            isRequired
        />
          <Select
            label="To Account"
            {...register("toAccountId")}
            options={accountOptions}
            error={errors.toAccountId?.message}
            isRequired
        />
          <Input
            label="Amount"
            type="number"
            step="0.01"
            {...register("amount", {
              setValueAs: (v) =>
                v === "" || v === null ? undefined : Number(v),
            })}
            error={errors.amount?.message}
            isRequired
        />
          <Input
            label="Remarks"
            placeholder="Reason for transfer"
            {...register("remarks")}
            error={errors.remarks?.message}
            isRequired
        />

          <div className="flex justify-end gap-3 pt-2 border-t mt-4">
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
              {isSubmitting || isLoading ? "Processing..." : "Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModel;
