import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { useGetApiQuery, useCreateApiMutation } from "@/redux/services/crudApi";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormType>({
    resolver: zodResolver(TransferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: undefined as any,
      remarks: "",
    },
  });

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

  const [createApi, { isLoading }] = useCreateApiMutation();

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
      const res = await createApi({ url: "transfer/", body: payload }).unwrap();
      handleResponse({ res, onSuccess: () => onSuccess?.() });
      onClose();
    } catch (error) {
      handleError({ error });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Transfer</h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Select
            label="From Account"
            {...register("fromAccountId")}
            options={accountOptions}
            error={errors.fromAccountId?.message}
            required
          />
          <Select
            label="To Account"
            {...register("toAccountId")}
            options={accountOptions}
            error={errors.toAccountId?.message}
            required
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
            required
          />
          <Input
            label="Remarks"
            placeholder="Reason for transfer"
            {...register("remarks")}
            error={errors.remarks?.message}
            required
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
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-2 rounded-md"
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
