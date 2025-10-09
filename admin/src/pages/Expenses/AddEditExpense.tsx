import React, { useEffect, useMemo, useState } from "react";
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
import { buildQueryString } from "@/utils/generalHelper";
import { EXPENSE_LIST_ROUTE } from "@/routes/routeNames";
import Select from "@/components/Select";
import Input from "@/components/Input";
import CustomDialog from "@/components/Dialog";
import AddEditSupplier from "@/pages/SuppliersModule/AddEditSupplier";
import AddEditExpenseCategory from "@/pages/ExpenseCategory/AddEditExpenseCategory";
import ExpenseSchema from "./schema";

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
  const [expenseCategoryDialogOpen, setExpenseCategoryDialogOpen] =
    useState(false);
  const [viewSuppliersDialogOpen, setViewSuppliersDialogOpen] = useState(false);
  const [addSupplierDialogOpen, setAddSupplierDialogOpen] = useState(false);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
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
  // Suppliers for Select
  const { data: supplierData, isSuccess: supplierFetched } = useGetApiQuery({
    url: `${SUPPLIER_URL}list`,
  });

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
      // When the dialog is open, always fetch; otherwise
      skip:
        !viewSuppliersDialogOpen &&
        !showAllSuppliers &&
        supplierSearchTerm.trim().length < 2,
    },
  );

  // Extract suppliers for dialog
  const suppliers = useMemo(() => {
    if (!suppliersOk && !showAllSuppliers) return [];
    // Support various shapes: resp.data, resp.data.data
    const raw: any = (suppliersResp as any)?.data ?? (suppliersResp as any);
    let data: any[] = [];
    if (Array.isArray(raw)) data = raw;
    else if (Array.isArray(raw?.data)) data = raw.data;
    else if (Array.isArray(raw?.data?.data)) data = raw.data.data;

    // Filter by search term if not showing all suppliers
    if (supplierSearchTerm.trim().length > 0 && !showAllSuppliers) {
      const term = supplierSearchTerm.toLowerCase();
      return data.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(term) ||
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
        <div className="flex gap-2 w-full mt-[1rem]">
          {/* max-w-[900px] */}
          <div className="flex-1 flex flex-col gap-[1.5rem] border-[#ebe9f1] border p-8 rounded-[6px] bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-700 font-semibold">
                        Category
                      </label>
                      <CustomDialog
                        buttonTitle={
                          <button
                            type="button"
                            className="rounded-full bg-green-600 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition-colors hover:bg-green-700 whitespace-nowrap"
                          >
                            <span>+</span>
                            Add Category
                          </button>
                        }
                        dialogOpen={expenseCategoryDialogOpen}
                        setDialogOpen={setExpenseCategoryDialogOpen}
                        title="Add Expense Category"
                        contentClassName="max-w-[95vw] w-[400px] max-h-[80vh] overflow-auto p-4"
                      >
                        <AddEditExpenseCategory
                          isComponent={true}
                          closeModal={() => {
                            setExpenseCategoryDialogOpen(false);
                          }}
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
              <div className="flex flex-col justify-center mt-[10.5px]">
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

              <div
                className={`flex flex-col justify-center mt-[10.5px] ${isEdit ? "hidden" : ""}`}
              >
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
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 mb-1 flex justify-start">
                      Supplier
                    </label>
                    <div className="flex gap-2">
                      <CustomDialog
                        buttonTitle={
                          <button
                            type="button"
                            className="rounded-full bg-green-600 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition-colors hover:bg-green-700 whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddSupplierDialogOpen(true);
                            }}
                          >
                            + Add New
                          </button>
                        }
                        dialogOpen={addSupplierDialogOpen}
                        setDialogOpen={setAddSupplierDialogOpen}
                        title="Add New Supplier"
                        contentClassName="w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-auto p-2 sm:p-4"
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
                        className="rounded-full bg-gray-600 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition-colors hover:bg-gray-700 whitespace-nowrap"
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  <Controller
                    name="supplierId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={[...supplierOptions]}
                        className="w-full mt-2"
                        error={errors.supplierId?.message}
                      />
                      // <div className="w-full mt-2">
                      //   <select
                      //     id="supplierId"
                      //     aria-label="Supplier"
                      //     className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-inputBg focus:border-inputBg"
                      //     value={field.value ?? ""}
                      //     onChange={(e) => field.onChange(e.target.value)}
                      //     onBlur={field.onBlur}
                      //     name={field.name}
                      //     ref={field.ref}
                      //   >
                      //     <option value="">Select Supplier</option>
                      //     {supplierOptions.map((opt) => (
                      //       <option key={opt.value} value={opt.value}>
                      //         {opt.label}
                      //       </option>
                      //     ))}
                      //   </select>
                      //   {errors.supplierId?.message && (
                      //     <p className="mt-1 text-sm text-red-600">
                      //       {errors.supplierId?.message}
                      //     </p>
                      //   )}
                      // </div>
                    )}
                  />
                </div>

                {/* View Suppliers Dialog */}
                <CustomDialog
                  buttonTitle={null}
                  dialogOpen={viewSuppliersDialogOpen}
                  setDialogOpen={setViewSuppliersDialogOpen}
                  title="All Suppliers"
                  contentClassName="w-full max-w-4xl max-h-[80vh] overflow-auto p-4"
                >
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search suppliers..."
                        className="w-full p-2 border rounded bg-white"
                        value={supplierSearchTerm}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSupplierSearchTerm(val);
                          // If there's a search term, switch off show-all mode so filtering applies
                          setShowAllSuppliers(val.trim().length === 0);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => refetchSuppliers()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        title="Search"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {suppliers?.map((supplier: any) => (
                            <tr key={supplier.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {supplier.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {supplier.contactNumber || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {supplier.email || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue("supplierId", String(supplier.id));
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
                                className="px-6 py-4 text-center text-sm text-gray-500"
                              >
                                No suppliers found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CustomDialog>
              </div>

              <div className="flex flex-col gap-1">
                <Input
                  label="Amount"
                  placeholder="Enter Amount"
                  className="w-full"
                  {...register("amount")}
                  error={errors.amount?.message}
                />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-left text-sm text-gray-700 mb-1 pl-[1px] font-semibold">
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
