import React, { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { useForm, useFieldArray } from "react-hook-form";
import { CurrencySign } from "@/constants";
import { Trash2 } from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";
import { useNavigate, useParams } from "react-router-dom";
import { useGetAllUserQuery } from "@/redux/services/authentication";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery, useDeleteApiMutation } from "@/redux/services/crudApi";
import { useGetListAllSupplierQuery } from "@/redux/services/supplier";
import {
  useCreatePurchaseMutation,
  useGetPurchaseByIdQuery,
  useUpdatePurchaseByIdMutation,
  useCompletePurchaseByIdMutation,
} from "@/redux/services/purchase";
import { handleError, handleResponse } from "@/utils/responseHandler";
import {
  ACCOUNT_URL,
  PURCHASE_URL,
  PURCHASE_CATEGORY_URL,
} from "@/constants/apiUrlConstants";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PurchaseSchema,
  type PurchaseFormInput,
  type PurchaseItemInput,
} from "./schema";
import { Input } from "react-aria-components";
import CustomDialog from "@/components/Dialog";
import AddEditSupplier from "@/pages/SuppliersModule/AddEditSupplier";
import { Controller } from "react-hook-form";
import Select from "@/components/Select";
import Toast from "@/components/Toast";

const computeBackendPurchaseTotal = (items: PurchaseItemInput[]) =>
  items.reduce((total, item) => {
    const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
    const tax = item.isTaxable !== false ? amount * 0.13 : 0;
    return total + amount + tax;
  }, 0);

const getInsufficientBalanceMessage = (
  accounts: any[],
  accountId: number | string,
  requiredAmount: number,
  paymentTerm: string,
) => {
  if (paymentTerm === "credit") return null;
  const account = accounts.find((row) => Number(row.id) === Number(accountId));
  if (!account) return "Selected payment account was not found.";
  const available = Number(account.currentBalance || 0);
  if (available < requiredAmount) {
    return `Insufficient account balance. Available: ${available.toFixed(2)}, Required: ${requiredAmount.toFixed(2)}`;
  }
  return null;
};

type ItemRow = PurchaseItemInput;
type FormValues = PurchaseFormInput;

const labelClass =
  "mb-1 text-sm font-medium text-gray-700 flex items-center gap-1.5";
const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 transition placeholder:text-gray-400 focus:border-primaryColor focus:outline-none focus:ring-1 focus:ring-primaryColor/30";

const AddEditPurchase: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [submitMode, setSubmitMode] = useState<"draft" | "complete">("draft");
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(PurchaseSchema),
    defaultValues: {
      invoiceDate: new Date().toISOString().slice(0, 10),
      supplierId: "",
      invoiceNumber: "",
      items: [
        {
          particulars: "",
          categoryId: "",
          qty: undefined as any,
          rate: undefined as any,
          discountPercent: 0,
          taxPercent: 13,
          isTaxable: false,
        },
      ],
      paymentTerm: "cash",
      accountId: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const navigate = useNavigate();

  const [createPurchase, { isLoading: creating }] = useCreatePurchaseMutation();
  const [updatePurchase, { isLoading: updating }] =
    useUpdatePurchaseByIdMutation();
  const [completePurchase] = useCompletePurchaseByIdMutation();
  const [deletePurchase] = useDeleteApiMutation();
  const { data: purchaseData, isSuccess: purchaseFetched } =
    useGetPurchaseByIdQuery(id as string, { skip: !isEdit });
  const isCompleted = useMemo(() => {
    const p: any = purchaseData?.data;
    const raw = (
      p?.status ??
      p?.purchaseStatus ??
      p?.state ??
      ""
    ).toLowerCase();
    return raw === "completed" || raw === "complete";
  }, [purchaseData]);

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [viewSuppliersDialogOpen, setViewSuppliersDialogOpen] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [summaryDiscountPct, setSummaryDiscountPct] = useState<string>("");
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);

  const closeDialog = () => setSupplierDialogOpen(false);

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
  } = useGetListAllSupplierQuery(
    { url: supplierUrl },
    { skip: !showAllSuppliers && supplierSearchTerm.trim().length < 2 },
  );

  const suppliers = useMemo(() => {
    if (!suppliersOk && !showAllSuppliers) return [];
    const raw: any = (suppliersResp as any)?.data;
    let data = [];
    if (Array.isArray(raw)) data = raw;
    else if (Array.isArray(raw?.data)) data = raw.data;
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

  const supplierRows = useMemo(() => {
    let rows: any[] = [];
    if (suppliersOk) {
      const raw: any = (suppliersResp as any)?.data;
      if (Array.isArray(raw)) rows = raw;
      else if (Array.isArray(raw?.data)) rows = raw.data;
    }
    const q = supplierSearchTerm.trim().toLowerCase();
    if (q.length < 2) return [];
    return rows.filter((r) =>
      [r?.name, r?.phone, r?.email]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q)),
    );
  }, [suppliersOk, suppliersResp, supplierSearchTerm]);

  const [accounts, setAccounts] = useState<{ value: string; label: string }[]>(
    [],
  );
  const { data: AccountsData } = useGetApiQuery({
    url: `${ACCOUNT_URL}list?page=1&limit=100`,
  });
  const accountRows = useMemo(
    () => AccountsData?.data?.data || [],
    [AccountsData],
  );

  useEffect(() => {
    if (accountRows.length > 0) {
      setAccounts(
        accountRows.map((account: any) => ({
          value: account.id,
          label: account.name,
        })),
      );
    }
  }, [accountRows]);

  const [purchaseCategories, setPurchaseCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const { data: PurchaseCategoriesData } = useGetApiQuery({
    url: `${PURCHASE_CATEGORY_URL}list?page=1&limit=100`,
  });

  useEffect(() => {
    if (PurchaseCategoriesData?.data?.data) {
      setPurchaseCategories(
        PurchaseCategoriesData.data.data.map((category: any) => ({
          value: category.id,
          label: category.name,
        })),
      );
    }
  }, [PurchaseCategoriesData]);

  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const { data: usersData } = useGetAllUserQuery({ page: 1, limit: 100 });

  useEffect(() => {
    if (usersData?.data?.data) {
      setUsers(
        usersData.data.data.map((user: any) => ({
          value: user.id,
          label: user.username,
        })),
      );
    }
  }, [usersData]);

  const items = watch("items") as ItemRow[];
  const username = useAppSelector((s) => (s as any).auth?.username) as
    | string
    | undefined;
  const [mediaOpen, setMediaOpen] = useState(false);
  const selectedImage = useAppSelector((state) => state.media.selectedImage) as
    | string
    | "";

  const computeRow = (row: ItemRow) => {
    const qty = Number(row.qty) || 0;
    const rate = Number(row.rate) || 0;
    const taxPercent = Number(row.taxPercent) || 13;
    const discountPercent = Number(row.discountPercent) || 0;
    const base = qty * rate;
    const discountAmt = (base * discountPercent) / 100;
    const taxableAmount = row.isTaxable === false ? 0 : base - discountAmt;
    const nonTaxableAmount = row.isTaxable === false ? base - discountAmt : 0;
    const taxAmt =
      row.isTaxable === false ? 0 : (taxableAmount * taxPercent) / 100;
    const lineTotal = taxableAmount + nonTaxableAmount + taxAmt;
    return { base, discountAmt, taxAmt, lineTotal, taxableAmount, nonTaxableAmount };
  };

  const totals = items?.reduce(
    (acc, r) => {
      const { base, discountAmt, taxAmt, lineTotal, taxableAmount, nonTaxableAmount } =
        computeRow(r);
      acc.subtotal += base;
      acc.discount += discountAmt;
      acc.taxable += taxableAmount;
      acc.nonTaxable += nonTaxableAmount;
      acc.tax += taxAmt;
      acc.grand += lineTotal;
      return acc;
    },
    { subtotal: 0, discount: 0, taxable: 0, nonTaxable: 0, tax: 0, grand: 0 },
  );

  const summaryDiscountValue = Number(summaryDiscountPct || 0);
  const summaryDiscountAmount = Number.isNaN(summaryDiscountValue)
    ? 0
    : Math.max(0, Math.min(totals.grand, summaryDiscountValue));
  const grandAfterSummaryDiscount = Math.max(
    0,
    totals.grand - summaryDiscountAmount,
  );

  useEffect(() => {
    if (!isEdit || !purchaseFetched || !purchaseData?.data) return;
    const p = purchaseData.data as any;
    reset({
      invoiceDate:
        p.invoiceDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      supplierId: String(p.supplierId || ""),
      invoiceNumber: p.invoiceNumber || "",
      items: (p.purchaseItems || []).map((it: any) => ({
        particulars: it.particulars || "",
        categoryId: it.categoryId ? it.categoryId : "",
        qty: it.quantity || 0,
        rate: it.rate || 0,
        isTaxable: it.isTaxable !== undefined ? Boolean(it.isTaxable) : true,
      })),
      paymentTerm: (p.paymentTerms as any) || "cash",
      accountId: p.accountId ? p.accountId : "",
    });
  }, [isEdit, purchaseFetched, purchaseData, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      supplierId: Number(data.supplierId),
      invoiceDate: new Date(data.invoiceDate).toISOString(),
      invoiceNumber: data.invoiceNumber?.trim() || null,
      paymentTerms: data.paymentTerm === "" ? "cash" : data.paymentTerm,
      accountId:
        data.paymentTerm === "credit"
          ? Number(data.accountId || 0)
          : Number(data.accountId),
      items: data.items.map((r) => ({
        categoryId: r.categoryId ? Number(r.categoryId) : undefined,
        particulars: r.particulars,
        quantity: Number(r.qty) || 0,
        rate: Number(r.rate) || 0,
        isTaxable: r.isTaxable !== false,
      })),
      notes: undefined,
    } as any;

    const purchaseTotal = computeBackendPurchaseTotal(data.items);

    if (submitMode === "complete") {
      const balanceError = getInsufficientBalanceMessage(
        accountRows,
        data.accountId,
        purchaseTotal,
        data.paymentTerm,
      );
      if (balanceError) {
        Toast(balanceError, "error");
        return;
      }
    }

    let createdDraftId: number | null = null;

    try {
      if (isEdit) {
        const response = await updatePurchase({
          url: `${PURCHASE_URL}${id}`,
          body: payload,
        }).unwrap();
        if (submitMode === "complete") {
          await completePurchase(id as string).unwrap();
        }
        handleResponse({
          res: response,
          onSuccess: () => navigate(-1),
        });
      } else {
        const response = await createPurchase({
          url: `${PURCHASE_URL}`,
          body: payload,
        }).unwrap();

        createdDraftId =
          (response as any)?.data?.id ??
          (response as any)?.data?.data?.id ??
          (response as any)?.id ??
          null;

        if (submitMode === "complete") {
          if (!createdDraftId) {
            Toast(
              "Purchase was created but could not be completed automatically.",
              "error",
            );
            return;
          }
          await completePurchase(createdDraftId).unwrap();
        }

        handleResponse({
          res: response,
          onSuccess: () => navigate(-1),
        });
      }
    } catch (error: any) {
      if (createdDraftId && submitMode === "complete") {
        try {
          await deletePurchase(`${PURCHASE_URL}${createdDraftId}`).unwrap();
        } catch {
          // Best-effort cleanup
        }
      }
      handleError({ error });
    }
  };

  return (
    <div className="p-6">
      <PageTitle title={isEdit ? "Edit Purchase" : "Add Purchase"} isBack />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 flex flex-col gap-6"
      >
        <fieldset disabled={isCompleted} className="contents">
          {/* ── SECTION 1: Invoice Details ── */}
          <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Invoice Details
              </h3>
              <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {/* Invoice Date */}
              <div>
                <label className={labelClass}>
                  Invoice Date
                </label>
                <input
                  type="date"
                  className={inputClass}
                  {...register("invoiceDate", {
                    required: "Invoice date is required",
                  })}
                />
                {errors.invoiceDate && (
                  <span className="mt-1 text-xs text-red-500">
                    {errors.invoiceDate.message}
                  </span>
                )}
              </div>

              {/* Supplier */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Supplier
                  </label>
                  <div className="flex gap-1.5">
                    <CustomDialog
                      buttonTitle={
                    <button
                      type="button"
                      className="rounded-full bg-primaryColor px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition hover:bg-primaryColor/90"
                    >
                      + Add New
                    </button>
                      }
                      dialogOpen={supplierDialogOpen}
                      setDialogOpen={setSupplierDialogOpen}
                      title="Add Supplier"
                      contentClassName="w-[95vw] max-w-[95vw] sm:max-w-2xl p-4 sm:p-6 mx-auto my-4 sm:my-8 max-h-[90vh] overflow-y-auto"
                    >
                      <div className="max-h-[calc(90vh-100px)] overflow-y-auto pr-2 -mr-2">
                        <AddEditSupplier
                          isComponent={true}
                          closeModal={closeDialog}
                        />
                      </div>
                    </CustomDialog>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAllSuppliers(true);
                        setSupplierSearchTerm("");
                        setViewSuppliersDialogOpen(true);
                        refetchSuppliers();
                      }}
                      className="rounded-full bg-gray-600 px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition hover:bg-gray-700"
                    >
                      View All
                    </button>

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
                            className={inputClass}
                            value={supplierSearchTerm}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSupplierSearchTerm(value);
                              setShowAllSuppliers(value.trim().length === 0);
                            }}
                          />
                        </div>
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                          <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                                  Name
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                                  Contact
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                                  Email
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {suppliers?.map((supplier: any) => (
                                <tr
                                  key={supplier.id}
                                  className="transition hover:bg-slate-50"
                                >
                                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                    {supplier.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500">
                                    {supplier.contactNumber || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-500">
                                    {supplier.email || "-"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setValue(
                                          "supplierId",
                                          String(supplier.id),
                                        );
                                        setSelectedSupplier({
                                          value: String(supplier.id),
                                          label: supplier.name,
                                        });
                                        setViewSuppliersDialogOpen(false);
                                      }}
                                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
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
                                    className="px-4 py-6 text-center text-sm text-slate-400"
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
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search supplier..."
                    className={inputClass}
                    value={selectedSupplier?.label || supplierSearchTerm}
                    onChange={(e) => {
                      setSelectedSupplier(null);
                      setSupplierSearchTerm(e.target.value);
                      setIsSupplierDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const first = supplierRows?.[0];
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
                      <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        {!suppliersOk ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Type at least 2 characters...
                          </div>
                        ) : supplierRows.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No suppliers found
                          </div>
                        ) : (
                          supplierRows.map((supplier: any) => (
                            <button
                              key={supplier.id}
                              type="button"
                              className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
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
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-800">
                                  {supplier.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {[supplier.phone, supplier.email]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                </div>
                {errors.supplierId && (
                  <span className="mt-1 text-xs text-red-500">
                    {errors.supplierId.message}
                  </span>
                )}
              </div>

              {/* Invoice Number */}
              <div>
                <label className={labelClass}>
                  Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  className={inputClass}
                  {...register("invoiceNumber")}
                />
              </div>

              {/* Payment Terms */}
              <Controller
                name="paymentTerm"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className={labelClass}>
                      Payment Terms
                    </label>
                    <Select
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      name={field.name}
                      options={[
                        { value: "cash", label: "Cash" },
                        { value: "cheque", label: "Cheque" },
                        { value: "credit", label: "Credit" },
                      ]}
                      onValueChange={field.onChange}
                    />
                  </div>
                )}
              />

              {/* Account */}
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className={labelClass}>
                      Account <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={
                        field.value !== undefined && field.value !== null
                          ? String(field.value)
                          : ""
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      error={errors.accountId?.message}
                      placeholder="Select Account"
                      options={[
                        { value: "", label: "Select Account" },
                        ...accounts.map((option) => ({
                          value: String(option.value),
                          label: option.label,
                        })),
                      ]}
                      onValueChange={(next) =>
                        field.onChange(next ? Number(next) : undefined)
                      }
                      isRequired
                    />
                  </div>
                )}
              />
            </div>
          </section>

          {/* ── SECTION 2: Purchase Items ── */}
          <section className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Purchase Items
              </h3>
              <button
                type="button"
                onClick={() =>
                  append({
                    particulars: "",
                    hsCode: "",
                    categoryId: "",
                    qty: undefined as any,
                    rate: undefined as any,
                    discountPercent: 0,
                    taxPercent: 13,
                    isTaxable: true,
                  })
                }
                className="rounded-full bg-primaryColor px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primaryColor/90"
              >
                + Add Item
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-[900px] w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 border-b text-center text-xs font-medium text-gray-500 w-14">
                      S.N
                    </th>
                    <th className="p-3 border-b text-left text-xs font-medium text-gray-500">
                      Category
                    </th>
                    <th className="p-3 border-b text-left text-xs font-medium text-gray-500">
                      Particulars
                    </th>
                    <th className="p-3 border-b text-left text-xs font-medium text-gray-500 w-24">
                      Qty
                    </th>
                    <th className="p-3 border-b text-left text-xs font-medium text-gray-500 w-28">
                      Rate
                    </th>
                    <th className="p-3 border-b text-center text-xs font-medium text-gray-500 w-20">
                      Taxable
                    </th>
                    <th className="p-3 border-b text-right text-xs font-medium text-gray-500 w-28">
                      Amount
                    </th>
                    <th className="p-3 border-b w-16" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, idx) => {
                    const row = items[idx] || {
                      particulars: "",
                      hsCode: "",
                      qty: undefined as any,
                      rate: undefined as any,
                      discountPercent: 0,
                      taxPercent: 13,
                    };
                    const { base, discountAmt } = computeRow(row);
                    return (
                      <tr
                        key={field.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="p-3 text-center text-sm text-gray-600">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <Controller
                            name={`items.${idx}.categoryId`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={
                                  field.value !== undefined &&
                                  field.value !== null
                                    ? String(field.value)
                                    : ""
                                }
                                onBlur={field.onBlur}
                                name={field.name}
                                placeholder="Category"
                                options={[
                                  { value: "", label: "Select" },
                                  ...purchaseCategories.map((option) => ({
                                    value: String(option.value),
                                    label: option.label,
                                  })),
                                ]}
                                onValueChange={(next) =>
                                  field.onChange(
                                    next ? Number(next) : undefined,
                                  )
                                }
                                triggerClassName="h-9"
                              />
                            )}
                          />
                          {errors.items?.[idx]?.categoryId?.message && (
                            <span className="text-red-500 text-xs">
                              {String(errors.items[idx].categoryId.message)}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="Item description"
                            className="border rounded px-2 py-1.5 w-full min-w-[180px] bg-white text-sm"
                            {...register(
                              `items.${idx}.particulars` as const,
                              { required: true },
                            )}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            step="1"
                            className="border rounded px-2 py-1.5 w-full bg-white text-sm"
                            {...register(`items.${idx}.qty` as const, {
                              valueAsNumber: true,
                            })}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="border rounded px-2 py-1.5 w-full bg-white text-sm"
                            {...register(`items.${idx}.rate` as const, {
                              valueAsNumber: true,
                            })}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primaryColor focus:ring-primaryColor"
                            {...register(
                              `items.${idx}.isTaxable` as const,
                            )}
                            defaultChecked={row.isTaxable !== false}
                          />
                        </td>
                        <td className="p-3 text-right text-sm font-medium text-gray-800">
                          {(base - discountAmt).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            disabled={fields.length === 1}
                            title="Remove row"
                          >
                            <Trash2 className="text-red-600" size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── SECTION 3: Purchase Summary ── */}
          <section className="w-full rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primaryColor/10 blur-3xl" />

            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                Purchase Summary
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-medium text-gray-500">
                  Taxable Items Total
                </div>
                <div className="mt-1 text-lg font-semibold text-blue-600">
                  {CurrencySign} {totals.taxable.toFixed(2)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-medium text-gray-500">
                  Non-Taxable Items Total
                </div>
                <div className="mt-1 text-lg font-semibold text-purple-600">
                  {CurrencySign} {totals.nonTaxable.toFixed(2)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="font-medium">Discount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">
                      {CurrencySign}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={totals.grand}
                      step="0.01"
                      value={summaryDiscountPct}
                      onChange={(e) => setSummaryDiscountPct(e.target.value)}
                      className="w-20 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-right text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-1 text-lg font-semibold text-emerald-700">
                  -{CurrencySign} {summaryDiscountAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm flex-1">
                <div className="text-[11px] font-medium text-amber-700">
                  Tax (13%)
                </div>
                <div className="mt-1 text-lg font-semibold text-amber-700">
                  {CurrencySign} {totals.tax.toFixed(2)}
                </div>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm flex-1">
                <div className="text-[11px] font-medium text-amber-700">
                  Grand Total
                </div>
                <div className="mt-1 text-xl font-bold text-amber-800">
                  {CurrencySign} {grandAfterSummaryDiscount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
                Entry By: {username || "-"}
              </span>
            </div>
          </section>
        </fieldset>

        {/* ── ACTION BAR ── */}
        <div className="flex w-full justify-end gap-3">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setSelectedSupplier(null);
                  setSupplierSearchTerm("");
                }}
                className="rounded border px-4 py-2 transition-colors hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded bg-gray-600 px-4 py-2 text-white disabled:opacity-60"
                disabled={creating || updating}
                onClick={() => setSubmitMode("draft")}
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
                disabled={creating || updating}
                onClick={() => setSubmitMode("complete")}
              >
                Complete Payment
              </button>
            </>
          ) : (
            <span className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              This purchase is completed and cannot be edited.
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEditPurchase;
