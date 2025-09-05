import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import { useForm } from "react-hook-form";
import { CurrencySign } from "@/constants";

type FormValues = {
  categoryId: string;
  paymentMethod: "cash" | "card" | "bank_transfer" | "cheque" | "";
  paymentSource: string; // selected from dropdown
  amount: number;
  description: string;
  remarks: string;
  enteredBy: string;
};

const AddEditExpense: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      categoryId: "",
      paymentMethod: "",
      paymentSource: "",
      amount: 0,
      description: "",
      remarks: "",
      enteredBy: "",
    },
  });

  const expenseCategoryOptions = useMemo(
    () => [
      { label: "Utilities", value: "utilities" },
      { label: "Maintenance and Repairs", value: "maintenance" },
      { label: "Rent", value: "rent" },
      { label: "Office Supplies", value: "office_supplies" },
      { label: "Marketing", value: "marketing" },
      { label: "Transport/Logistics", value: "transport" },
      { label: "Miscellaneous", value: "misc" },
    ],
    [],
  );

  const paymentSourceOptions = useMemo(
    () => [
      { label: "Cash on Hand", value: "cash_on_hand" },
      { label: "Nabil Bank - 00123456789", value: "nabil_00123456789" },
      { label: "NIC Asia - 00987654321", value: "nicasia_00987654321" },
      { label: "eSewa Wallet", value: "esewa_wallet" },
    ],
    [],
  );

  useEffect(() => {
    if (!isEdit) return;

    const mock = {
      categoryId: "utilities",
      paymentMethod: "bank_transfer" as const,
      paymentSource: "nabil_00123456789",
      amount: 10170,
      description: "Monthly electricity bill payment",
      remarks: "Includes service charge.",
      enteredBy: "Administrator",
    } satisfies FormValues;

    reset(mock);
  }, [isEdit, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      id: isEdit ? id : undefined,
    };

    // In real implementation  create/update API here

    console.log("Expense form submit payload:", payload);
    navigate(-1);
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
                  {expenseCategoryOptions.map((opt) => (
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
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
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
                  className="border rounded px-3 py-2 bg-white"
                  {...register("paymentSource", {
                    required: "Payment source is required",
                  })}
                >
                  <option value="">Select</option>
                  {paymentSourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.paymentSource && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.paymentSource.message}
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

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Entered By</label>
                <input
                  type="text"
                  placeholder="Staff name"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("enteredBy", {
                    required: "Entered by is required",
                    minLength: { value: 2, message: "Too short" },
                  })}
                />
                {errors.enteredBy && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.enteredBy.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe this expense"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("description", {
                    required: "Description is required",
                    minLength: { value: 3, message: "Too short" },
                  })}
                />
                {errors.description && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.description.message}
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
