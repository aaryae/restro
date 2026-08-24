import React from "react";
import { Controller, useForm } from "react-hook-form";
import Modal from "@/components/Modal";
import { useGetApiQuery as useGetAccounts } from "@/redux/services/crudApi";
import Select from "@/components/Select";
import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import { useCreateTransactionMutation } from "@/redux/services/transaction";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Spinner from "@/components/Spinner";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "deposit" | "withdraw";
  onSuccess: () => void;
}

interface TransactionFormData {
  accountId: string;
  amount: number;
  remarks: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  onSuccess,
}) => {
  const [createTransaction, { isLoading }] = useCreateTransactionMutation();

  const { data: accountsResponse, isFetching: isFetchingAccounts } =
    useGetAccounts({
      url: "account/list",
    });

  const accounts = accountsResponse?.data?.data || [];

  // Transform accounts data for Select component
  const accountOptions = accounts.map((account: any) => ({
    label: `${account.name} (${account.accountType})`,
    value: account.id,
  }));

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues: {
      amount: 0,
      remarks: "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      const payload = {
        accountId: Number(data.accountId),
        type: type,
        amount: data.amount,
        remarks: data.remarks,
      };

      const response = await createTransaction(payload).unwrap();

      handleResponse({ res: response, onSuccess: handleClose });
    } catch (error) {
      handleError({ error: error });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} Transaction`}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-4">
        <div>
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <Select
                label="Account"
                options={accountOptions}
                className="w-full"
                error={errors?.accountId?.message}
                {...field}
                value={field.value?.toString() || ""}
                onChange={(e) => field.onChange(Number(e.target.value))}
          isRequired
        />
            )}
          />
        </div>

        <div>
          <Input
            label="Withdrawal Amount"
            type="number"
            step={0.01}
            placeholder="Enter withdrawal amount"
            className="w-full"
            {...register("amount", { valueAsNumber: true })}
            error={errors?.amount?.message as string}
          isRequired
        />
        </div>

        <div>
          <TextArea
            label="Remarks"
            placeholder="Reason for withdrawal (optional)"
            className="w-full"
            rows={4}
            {...register("remarks")}
            error={errors?.remarks?.message as string}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-white rounded-md ${
              type === "deposit"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner />
                Creating...
              </div>
            ) : (
              `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionModal;
