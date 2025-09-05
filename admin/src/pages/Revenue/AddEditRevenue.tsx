import Input from "@/components/Input";
import TextArea from "@/components/TextArea";
import Button from "@/components/Button";
import PageTitle from "@/components/PageTitle";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import useTranslation from "@/locale/useTranslation";
import {
  useCreateApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { CUSTOMER_URL, REVENUE_URL } from "@/constants/apiUrlConstants";
import { REVENUE_LIST_ROUTE } from "@/routes/routeNames";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildQueryString } from "@/utils/generalHelper";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import { RevenueSchema } from "./schema";

type RevenueFormType = z.infer<typeof RevenueSchema>;

export default function AddEditRevenue() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const authUserId = useSelector((state: RootState) => state.auth.id);

  // Customer search state
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    label: string;
  } | null>(null);

  const customerUrl = useMemo(
    () =>
      buildQueryString(`${CUSTOMER_URL}list`, {
        page: 1,
        limit: 5,
        search: {
          isCombo: true,
          phone: customerQuery,
        },
      }),
    [customerQuery],
  );

  const {
    data: customerSearch,
    isSuccess: customerSuccess,
    isLoading: customerDataLoading,
    refetch: customerRefetch,
  } = useGetApiQuery({ url: customerUrl });

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RevenueFormType>({
    resolver: zodResolver(RevenueSchema),
  });

  const [createRevenue, { isLoading: creating }] = useCreateApiMutation();
  const [updateRevenue, { isLoading: updating }] = useUpdateApiMutation();

  const { data: revenueData, isLoading: revenueLoading } = useGetApiQuery(
    { url: `${REVENUE_URL}${id}` },
    { skip: !isEditMode },
  );

  useEffect(() => {
    if (isEditMode && revenueData?.data) {
      const d = revenueData.data as any;
      reset({
        amount: Number(d.amount) || 0,
        paymentMethod: d.paymentMethod || "cash",
        cash_or_credit: d.cash_or_credit || "cash",
        remarks: d.remarks || "",
      });
      if (d.customer && d.customer.id) {
        const c = d.customer;
        setSelectedCustomer({
          id: c.id,
          label:
            `${c.firstName || ""} ${c.lastName || ""} (${c.mobileNo || c.email || "-"})`.trim(),
        });
      } else if (d.customerId && d.customerName) {
        // Fallback if API returns only IDs and a display name
        setSelectedCustomer({ id: d.customerId, label: d.customerName });
      }
    }
  }, [isEditMode, revenueData, reset]);

  const handleSuccess = () => navigate(REVENUE_LIST_ROUTE);

  const onSubmit = async (form: RevenueFormType) => {
    const body: any = { ...form, userId: authUserId };
    if (selectedCustomer?.id) body.customerId = selectedCustomer.id;
    try {
      const response = isEditMode
        ? await updateRevenue({ url: `${REVENUE_URL}${id}`, body }).unwrap()
        : await createRevenue({ url: `${REVENUE_URL}`, body }).unwrap();

      handleResponse({ res: response, onSuccess: handleSuccess });
    } catch (error) {
      handleError({ error, setError });
    }
  };

  return (
    <>
      <PageTitle title={isEditMode ? "Edit Revenue" : "Add Revenue"} isBack />
      <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Fill in the details below to {isEditMode ? "update" : "record"} a
            revenue entry.
          </p>
        </div>
        {isEditMode && revenueLoading ? (
          <div className="px-6 py-6 text-sm text-slate-500">
            Loading revenue...
          </div>
        ) : (
          <form className="px-6 py-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="input-label flex">Customer</label>
                <div className="relative max-w-sm">
                  <Input
                    value={customerQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCustomerQuery(e.target.value)
                    }
                    placeholder="Search by name, phone or email"
                  />
                  {selectedCustomer ? (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {selectedCustomer.label}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => setSelectedCustomer(null)}
                      >
                        Clear
                      </button>
                    </div>
                  ) : null}

                  {customerDataLoading ? (
                    <p className="text-gray-500 mt-1">Loading customers...</p>
                  ) : customerSuccess &&
                    customerSearch?.data?.data?.length > 0 &&
                    customerQuery.trim().length > 0 ? (
                    <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow">
                      {customerSearch?.data?.data?.map((c: any) => (
                        <button
                          type="button"
                          key={c.id}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => {
                            setSelectedCustomer({
                              id: c.id,
                              label:
                                `${c.firstName || ""} ${c.lastName || ""} (${c.mobileNo || c.email || "-"})`.trim(),
                            });
                            setCustomerQuery("");
                          }}
                        >
                          <div className="text-sm font-medium">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {c.mobileNo || c.email || "-"}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      {customerQuery.trim().length > 0 && (
                        <div className="mt-1">
                          <p className="text-red-500 text-sm">
                            Failed to load customers
                          </p>
                          <button
                            type="button"
                            onClick={() => customerRefetch()}
                            className="mt-2 px-4 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div>
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  {...register("amount", { valueAsNumber: true })}
                  error={errors.amount?.message}
                />
              </div>

              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Payment Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Choose how the payment was made and whether it was cash or
                    credit.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label text-[18px]">
                      Payment Method
                    </label>
                    <select
                      className="input-field"
                      {...register("paymentMethod")}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="online">Online</option>
                    </select>
                    {errors.paymentMethod?.message && (
                      <span className="input-error">
                        {errors.paymentMethod.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="input-label">Cash or Credit</label>
                    <select
                      className="input-field"
                      {...register("cash_or_credit")}
                    >
                      <option value="cash">Cash</option>
                      <option value="credit">Credit</option>
                    </select>
                    {errors.cash_or_credit?.message && (
                      <span className="input-error">
                        {errors.cash_or_credit.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Remarks"
                  placeholder="Add any notes (optional)"
                  {...register("remarks")}
                  error={errors.remarks as any}
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="submit"
                className="submit-button min-w-[6.5rem]"
                disabled={isSubmitting || creating || updating}
              >
                <div className="flex justify-center items-center gap-[0.5rem] text-white">
                  {isEditMode ? translate("Update") : translate("Submit")}
                </div>
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
