import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import { Controller, useForm } from "react-hook-form";
import { CurrencySign } from "@/constants";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import Select from "@/components/Select";

// Zod schema aligned with backend Joi (expense_validation.js)
export const ExpenseSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "online"], {
    required_error: "Payment method is required",
  }),
  accountId: z.string().min(1, "Payment source is required"),
  amount: z.coerce
    .number({ message: "Amount must be a number" })
    .positive("Amount must be positive"),
  // Required in UI
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().optional(),
  remarks: z.string().optional().or(z.literal("")),
});

export type ExpenseFormInput = z.infer<typeof ExpenseSchema>;

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
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      paymentMethod: "cash",
      categoryId: undefined,
      accountId: undefined,
      amount: 0,
      remarks: "",
      supplierId: undefined,
    },
  });
  const { data: expenseData, isSuccess: expenseFetched } = useGetApiQuery(
    {
      url: `${EXPENSE_URL}${id}`,
    },
    { skip: !isEdit },
  );
  const { data: expenseCategoryData, isSuccess: expenseCategoryFetched } =
    useGetApiQuery({ url: `${EXPENSE_CATEGORY_URL}/list` });
  const {
    data: expensePaymentSourceData,
    isSuccess: expensePaymentSourceFetched,
  } = useGetApiQuery({ url: `${ACCOUNT_URL}/list` });
  const { data: supplierData, isSuccess: supplierFetched } = useGetApiQuery({
    url: `${SUPPLIER_URL}list`,
  });
  const [createExpense] = useCreateApiMutation();
  const [updateExpense] = useUpdateApiMutation();

  useEffect(() => {
    if (!isEdit || !id || !expenseData?.data) return;
    const row = expenseData?.data as any;
    reset({
      categoryId: row?.categoryId ? String(row.categoryId) : "",
      paymentMethod: row?.paymentMethod,
      accountId: String(row.accountId),
      amount: Number(row?.amount) || 0,
      remarks: row?.remarks || "",
      supplierId: row?.supplierId ? String(row.supplierId) : undefined,
    });
  }, [isEdit, id, expenseData, reset]);

  useEffect(() => {
    if (!expenseCategoryFetched) return;

    setExpenseCategoryOptions(
      expenseCategoryData?.data?.data?.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    );
  }, [expenseCategoryData, expenseCategoryFetched]);

  useEffect(() => {
    if (!expensePaymentSourceFetched) return;

    setPaymentSourceOptions(
      expensePaymentSourceData?.data?.data?.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    );
  }, [expensePaymentSourceData, expensePaymentSourceFetched]);

  useEffect(() => {
    if (!supplierFetched) return;

    setSupplierOptions(
      supplierData?.data?.data?.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    );
  }, [supplierData, supplierFetched]);

  const onSubmit = async (data: ExpenseFormInput) => {
    if (isEdit) delete data.supplierId;

    const body = {
      id: isEdit ? Number(id) : undefined,
      cash_or_credit: "cash",
      paymentMethod: data.paymentMethod,
      amount: Number(data.amount),
      accountId: Number(data.accountId),
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      supplierId: isEdit
        ? undefined
        : data.supplierId
          ? Number(data.supplierId)
          : null,
      remarks: data.remarks ?? null,
    } as any;

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
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    required
                    {...field}
                    options={expenseCategoryOptions}
                    label="Category"
                    error={errors.categoryId?.message}
                  />
                )}
              />
              <div className="flex flex-col">
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select
                      required
                      {...field}
                      options={[
                        { value: "cash", label: "Cash" },
                        { value: "card", label: "Card" },
                        { value: "online", label: "Online" },
                      ]}
                      label="Payment Method"
                      error={errors.paymentMethod?.message}
                    />
                  )}
                />
              </div>

              <div className={`flex flex-col ${isEdit ? "hidden" : ""}`}>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      required
                      {...field}
                      options={paymentSourceOptions}
                      label="Payment Source"
                      error={errors.accountId?.message}
                    />
                  )}
                />
              </div>

              <div className={`flex flex-col ${isEdit ? "hidden" : ""}`}>
                <Controller
                  disabled={isEdit}
                  name="supplierId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={supplierOptions}
                      label="Supplier"
                      error={errors.supplierId?.message}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700 mb-1 flex md:justify-center pl-[1px]">
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

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm text-gray-700 mb-1 flex md:justify-center pl-[1px]">
                  Remarks
                </label>
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
