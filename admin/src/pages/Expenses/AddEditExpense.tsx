import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import { useForm } from "react-hook-form";
import { CurrencySign } from "@/constants";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import {
  ACCOUNT_URL,
  EXPENSE_CATEGORY_URL,
  EXPENSE_URL,
  SUPPLIER_URL,
} from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { EXPENSE_LIST_ROUTE } from "@/routes/routeNames";

type FormValues = {
  categoryId: string;
  paymentMethod: "cash" | "card" | "online";
  accountId: string;
  amount: number;
  description: string;
  remarks: string;
  supplierId: string;
};

const AddEditExpense: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [expenseCategoryOptions, setExpenseCategoryOptions] = useState<any[]>(
    [],
  );
  const [paymentSourceOptions, setPaymentSourceOptions] = useState<any[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      categoryId: "",
      accountId: "",
      amount: 0,
      remarks: "",
      supplierId: "",
    },
  });
  const { data: expenseCategoryData, isSuccess: expenseCategoryFetched } =
    useGetApiQuery({ url: `${EXPENSE_CATEGORY_URL}/list` });
  const {
    data: expensePaymentSourceData,
    isSuccess: expensePaymentSourceFetched,
  } = useGetApiQuery({ url: `${ACCOUNT_URL}/list` });
  const { data: supplierData, isSuccess: supplierFetched } = useGetApiQuery({
    url: `${SUPPLIER_URL}list`,
  });
  const { data: expenseData, isSuccess: expenseFetched } = useGetApiQuery(
    {
      url: `${EXPENSE_URL}${id}`,
    },
    { skip: !isEdit },
  );
  const [createExpense] = useCreateApiMutation();
  const [updateExpense] = useUpdateApiMutation();

  useEffect(() => {
    console.log(expenseData, "expense data");
    if (!isEdit || !id || !expenseData?.data) return;
    const row = expenseData?.data;
    console.log(row, "expense data");
    reset({
      categoryId: row.categoryId,
      paymentMethod: row.paymentMethod,
      accountId: row.accountId,
      amount: row.amount,
      remarks: row.remarks,
      supplierId: row.supplierId,
    });
  }, [isEdit, id, expenseData, reset]);

  useEffect(() => {
    if (!expenseCategoryFetched) return;

    setExpenseCategoryOptions(
      expenseCategoryData?.data?.data?.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    );
  }, [expenseCategoryData, expenseCategoryFetched]);

  useEffect(() => {
    if (!expensePaymentSourceFetched) return;

    setPaymentSourceOptions(
      expensePaymentSourceData?.data?.data?.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    );
  }, [expensePaymentSourceData, expensePaymentSourceFetched]);

  useEffect(() => {
    if (!supplierFetched) return;

    setSupplierOptions(
      supplierData?.data?.data?.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    );
  }, [supplierData, supplierFetched]);

  const onSubmit = async (data: any) => {
    if (isEdit) delete data.supplierId;
    const body = {
      ...data,
      id: isEdit ? id : undefined,
      cash_or_credit: "cash",
    };

    try {
      const response = isEdit
        ? await updateExpense({
            url: `${EXPENSE_URL}${id}`,
            body,
          }).unwrap()
        : await createExpense({ url: EXPENSE_URL, body }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => navigate(EXPENSE_LIST_ROUTE),
      });
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <div className="p-6">
      <PageTitle title={isEdit ? "Edit Expense" : "Add Expense"} isBack />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center space-y-6"
      >
        <div className="flex gap-2 w-full max-w-[900px]">
          <div className="flex-1 flex flex-col gap-[1.5rem] border-[#ebe9f1] border p-8 rounded-[6px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Category</label>
                <select
                  className="border rounded px-3 py-2 bg-white"
                  {...register("categoryId", {
                    required: "Category is required",
                  })}
                >
                  <option value="">Select</option>
                  {expenseCategoryOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.categoryId.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  className="border rounded px-3 py-2 bg-white"
                  {...register("paymentMethod", {
                    required: "Payment method is required",
                  })}
                >
                  <option value="">Select</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
                {errors.paymentMethod && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.paymentMethod.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Payment Source
                </label>
                <select
                  disabled={isEdit}
                  className="border rounded px-3 py-2 bg-white"
                  {...register("accountId", {
                    required: "Payment source is required",
                  })}
                >
                  <option value="">Select</option>
                  {paymentSourceOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.accountId.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Supplier</label>
                <select
                  disabled={isEdit}
                  className="border rounded px-3 py-2 bg-white"
                  {...register("supplierId", {
                    required: "Supplier is required",
                  })}
                >
                  <option value="">Select</option>
                  {supplierOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.supplierId && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.supplierId.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Amount ({CurrencySign})
                </label>
                <input
                  type="number"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("amount", {
                    required: "Amount is required",
                    min: { value: 0, message: "Amount must be positive" },
                    valueAsNumber: true,
                  })}
                />
                {errors.amount && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.amount.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("remarks", { required: "Remarks are required" })}
                />
                {errors.remarks && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.remarks.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full max-w-[1100px] justify-end">
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button type="reset" className="px-4 py-2 border rounded">
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
          >
            {isEdit ? "Update Expense" : "Create Expense"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditExpense;
