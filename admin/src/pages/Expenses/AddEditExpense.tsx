import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import { Controller, useForm } from "react-hook-form";
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
} from "@/constants/apiUrlConstants";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { buildQueryString } from "@/utils/generalHelper";
import { EXPENSE_LIST_ROUTE } from "@/routes/routeNames";
import Select from "@/components/Select";
import Input from "@/components/Input";
import Button from "@/components/Button";
import CustomDialog from "@/components/Dialog";
import AddEditSupplier from "@/pages/SuppliersModule/AddEditSupplier";
import AddEditExpenseCategory from "@/pages/ExpenseCategory/AddEditExpenseCategory";
import { ExpenseSchema } from "./schema";
import { Plus, Search, Wallet } from "lucide-react";

export type ExpenseFormInput = z.infer<typeof ExpenseSchema>;

const AddEditExpense: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [expenseCategoryOptions, setExpenseCategoryOptions] = useState<any[]>(
    [],
  );
  const [paymentSourceOptions, setPaymentSourceOptions] = useState<any[]>([]);
  const [expenseCategoryDialogOpen, setExpenseCategoryDialogOpen] =
    useState(false);
  const [viewSuppliersDialogOpen, setViewSuppliersDialogOpen] = useState(false);
  const [addSupplierDialogOpen, setAddSupplierDialogOpen] = useState(false);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormInput>({
    resolver: zodResolver(ExpenseSchema),
    defaultValues: {
      paymentMethod: undefined,
      categoryId: "",
      accountId: "",
      amount: undefined as unknown as number,
      remarks: "",
      supplierId: "",
    },
  });

  const { data: expenseData } = useGetApiQuery(
    { url: `${EXPENSE_URL}${id}` },
    { skip: !isEdit },
  );
  const { data: expenseCategoryData, isSuccess: expenseCategoryFetched } =
    useGetApiQuery({ url: `${EXPENSE_CATEGORY_URL}/list` });
  const {
    data: expensePaymentSourceData,
    isSuccess: expensePaymentSourceFetched,
  } = useGetApiQuery({ url: `${ACCOUNT_URL}/list` });

  const supplierUrl = buildQueryString("supplier/list", {
    page: 1,
    limit: 100,
    ...(supplierSearchTerm.trim().length > 0 && !showAllSuppliers
      ? { search: { name: supplierSearchTerm } }
      : {}),
  });
  const {
    data: suppliersResp,
    isSuccess: suppliersOk,
    refetch: refetchSuppliers,
  } = useGetApiQuery(
    { url: supplierUrl },
    {
      skip:
        !viewSuppliersDialogOpen &&
        !showAllSuppliers &&
        supplierSearchTerm.trim().length < 2,
    },
  );

  const suppliers = useMemo(() => {
    if (!suppliersOk && !showAllSuppliers) return [];
    const raw: any = (suppliersResp as any)?.data ?? (suppliersResp as any);
    let data: any[] = [];
    if (Array.isArray(raw)) data = raw;
    else if (Array.isArray(raw?.data)) data = raw.data;
    else if (Array.isArray(raw?.data?.data)) data = raw.data.data;

    if (supplierSearchTerm.trim().length > 0 && !showAllSuppliers) {
      const term = supplierSearchTerm.toLowerCase();
      return data.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(term) ||
          s.contact_number?.includes(term) ||
          s.contactNumber?.includes(term) ||
          s.email?.toLowerCase().includes(term),
      );
    }
    return data;
  }, [suppliersOk, suppliersResp, supplierSearchTerm, showAllSuppliers]);

  const [createExpense] = useCreateApiMutation();
  const [updateExpense] = useUpdateApiMutation();

  useEffect(() => {
    if (!isEdit || !id || !expenseData?.data) return;
    const row = expenseData?.data as any;
    reset({
      categoryId: row?.categoryId ? String(row.categoryId) : "",
      paymentMethod: row?.paymentMethod,
      accountId: String(row.accountId),
      amount: Number(row?.amount) || (undefined as unknown as number),
      remarks: row?.remarks || "",
      supplierId: row?.supplierId ? String(row.supplierId) : "",
    });
    if (row?.supplierId) {
      setSelectedSupplier({
        value: String(row.supplierId),
        label: row.supplier?.name || "",
      });
      setSupplierSearchTerm(row.supplier?.name || "");
    }
  }, [isEdit, id, expenseData, reset]);

  useEffect(() => {
    if (!expenseCategoryFetched) return;
    setExpenseCategoryOptions(
      expenseCategoryData?.data?.data?.map((item: any) => ({
        value: String(item.id),
        label: item.name,
      })),
    );
  }, [expenseCategoryData, expenseCategoryFetched]);

  useEffect(() => {
    if (!expensePaymentSourceFetched) return;
    setPaymentSourceOptions(
      expensePaymentSourceData?.data?.data?.map((item: any) => ({
        value: String(item.id),
        label: item.name,
      })),
    );
  }, [expensePaymentSourceData, expensePaymentSourceFetched]);

  const onSubmit = async (data: ExpenseFormInput) => {
    const body = {
      id: isEdit ? Number(id) : undefined,
      cash_or_credit: "cash",
      paymentMethod: data.paymentMethod,
      amount: Number(data.amount),
      accountId: Number(data.accountId),
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      supplierId: data.supplierId ? Number(data.supplierId) : null,
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

  const handleReset = () => {
    reset({
      paymentMethod: undefined,
      categoryId: "",
      accountId: "",
      amount: undefined as unknown as number,
      remarks: "",
      supplierId: "",
    });
    setSelectedSupplier(null);
    setSupplierSearchTerm("");
  };

  return (
    <div className="flex min-w-0 w-full flex-col gap-5 pb-6">
      <PageTitle title={isEdit ? "Edit Expense" : "Add Expense"} isBack />

      <form
        className="min-w-0 w-full"
        onSubmit={(e) => {
          if (expenseCategoryDialogOpen || addSupplierDialogOpen) {
            e.preventDefault();
            return;
          }
          handleSubmit(onSubmit)(e);
        }}
      >
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primaryColor/10 text-primaryColor">
              <Wallet size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-800">
                Expense details
              </h2>
              <p className="text-xs text-slate-500">
                Category, payment, amount, and optional supplier
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5">
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <div className="flex min-w-0 flex-col">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-left text-xs font-medium text-slate-600">
                      Category <span className="text-red-500">*</span>
                      </label>
                    <CustomDialog
                      buttonTitle={
                        <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg bg-primaryColor px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-primaryColor/90"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                          Add Category
                        </button>
                      }
                      dialogOpen={expenseCategoryDialogOpen}
                      setDialogOpen={setExpenseCategoryDialogOpen}
                      title="Add Expense Category"
                      contentClassName="max-h-[90vh] w-[min(95vw,37.5rem)] overflow-auto p-4"
                    >
                      <AddEditExpenseCategory
                        isComponent={true}
                        closeModal={() => setExpenseCategoryDialogOpen(false)}
                      />
                    </CustomDialog>
                  </div>
                  <Select
                    required
                    {...field}
                    options={expenseCategoryOptions}
                    error={errors.categoryId?.message}
                  />
                </div>
              )}
            />

            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <Select
                  required
                  {...field}
                  value={field.value ?? ""}
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "online", label: "Online" },
                  ]}
                  label="Payment Method"
                  error={errors.paymentMethod?.message}
                  isRequired
                />
              )}
            />

            <div className={isEdit ? "hidden" : undefined}>
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
                    isRequired
                  />
                )}
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-left text-xs font-medium text-slate-600">
                  Supplier
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <CustomDialog
                    buttonTitle={
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg bg-primaryColor px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-primaryColor/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddSupplierDialogOpen(true);
                        }}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        Add New
                      </button>
                    }
                    dialogOpen={addSupplierDialogOpen}
                    setDialogOpen={setAddSupplierDialogOpen}
                    title="Add New Supplier"
                    contentClassName="max-h-[90vh] w-full max-w-[95vw] overflow-auto p-2 sm:max-w-2xl sm:p-4 md:max-w-3xl lg:max-w-4xl"
                  >
                    <AddEditSupplier
                      isComponent={true}
                      closeModal={() => {
                        setAddSupplierDialogOpen(false);
                        refetchSuppliers();
                      }}
                    />
                  </CustomDialog>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAllSuppliers(true);
                      setSupplierSearchTerm("");
                      setViewSuppliersDialogOpen(true);
                      refetchSuppliers();
                    }}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    View All
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  placeholder="Search supplier"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primaryColor/40 focus:ring-2 focus:ring-primaryColor/15"
                  value={selectedSupplier?.label || supplierSearchTerm}
                  onChange={(e) => {
                    setSelectedSupplier(null);
                    setSupplierSearchTerm(e.target.value);
                    setValue("supplierId", "", { shouldValidate: true });
                    setIsSupplierDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const first = suppliers?.[0];
                      if (first) {
                        setSelectedSupplier({
                          value: String(first.id),
                          label: first.name,
                        });
                        setValue("supplierId", String(first.id), {
                          shouldValidate: true,
                        });
                        setSupplierSearchTerm(first.name);
                        setIsSupplierDropdownOpen(false);
                      }
                    }
                  }}
                  onFocus={() => setIsSupplierDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setIsSupplierDropdownOpen(false), 150)
                  }
                />
                {isSupplierDropdownOpen &&
                  supplierSearchTerm.trim().length >= 2 && (
                    <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                      {!suppliersOk ? (
                        <div className="px-3 py-2.5 text-sm text-slate-500">
                          Type at least 2 characters to search…
                        </div>
                      ) : suppliers.length === 0 ? (
                        <div className="px-3 py-2.5 text-sm text-slate-500">
                          No suppliers found
                        </div>
                      ) : (
                        suppliers.map((supplier: any) => (
                          <button
                            key={supplier.id}
                            type="button"
                            className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedSupplier({
                                value: String(supplier.id),
                                label: supplier.name,
                              });
                              setValue("supplierId", String(supplier.id), {
                                shouldValidate: true,
                              });
                              setSupplierSearchTerm(supplier.name);
                              setIsSupplierDropdownOpen(false);
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-slate-800">
                                {supplier.name}
                              </div>
                              <div className="truncate text-xs text-slate-500">
                                {[
                                  supplier.contact_number ||
                                    supplier.contactNumber ||
                                    supplier.phone,
                                  supplier.email,
                                ]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
              </div>

              <CustomDialog
                buttonTitle={null}
                dialogOpen={viewSuppliersDialogOpen}
                setDialogOpen={setViewSuppliersDialogOpen}
                title="All Suppliers"
                contentClassName="max-h-[80vh] w-full max-w-4xl overflow-auto p-4"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search suppliers..."
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primaryColor/40 focus:ring-2 focus:ring-primaryColor/15"
                      value={supplierSearchTerm}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSupplierSearchTerm(val);
                        setShowAllSuppliers(val.trim().length === 0);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => refetchSuppliers()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title="Search"
                    >
                      <Search size={16} />
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Contact
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {suppliers?.map((supplier: any) => (
                            <tr key={supplier.id} className="hover:bg-slate-50">
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                                {supplier.name}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                                {supplier.contact_number ||
                                  supplier.contactNumber ||
                                  "-"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                                {supplier.email || "-"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSupplier({
                                      value: String(supplier.id),
                                      label: supplier.name,
                                    });
                                    setValue(
                                      "supplierId",
                                      String(supplier.id),
                                    );
                                    setSupplierSearchTerm(supplier.name);
                                    setViewSuppliersDialogOpen(false);
                                  }}
                                  className="text-primaryColor hover:text-primaryColor/80"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!suppliers || suppliers.length === 0) && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-6 text-center text-sm text-slate-500"
                              >
                                No suppliers found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CustomDialog>
            </div>

            <Input
              label="Amount"
              placeholder="0"
              type="number"
              className="w-full"
              {...register("amount")}
              error={errors.amount?.message}
              isRequired
            />

            <div className="flex min-w-0 flex-col sm:col-span-2">
              <label className="mb-2 text-left text-xs font-medium text-slate-600">
                Remarks <span className="text-red-500">*</span>
              <textarea
                rows={3}
                placeholder="Additional remarks"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primaryColor/40 focus:ring-2 focus:ring-primaryColor/15"
                {...register("remarks")}
                />
                </label>
              {errors.remarks && (
                <span className="mt-1 text-sm text-red-600">
                  {errors.remarks.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-5">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={handleReset}
            >
              Reset
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="submit-button inline-flex h-10 w-full items-center justify-center rounded-lg px-5 text-sm font-medium sm:w-auto"
            >
              {isEdit ? "Update Expense" : "Create Expense"}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default AddEditExpense;
