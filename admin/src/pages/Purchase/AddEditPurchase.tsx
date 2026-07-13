import React, { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { useForm, useFieldArray } from "react-hook-form";
import { CurrencySign } from "@/constants";
import { Trash } from "lucide-react";
import MediaComponent from "@/components/MediaComponent";
import { ImageInputUI } from "@/components/ImageComponent";
import { useAppSelector } from "@/redux/store/hooks";
import { useNavigate, useParams } from "react-router-dom";
import { useGetAllUserQuery } from "@/redux/services/authentication";
import { buildQueryString } from "@/utils/generalHelper";
import { useGetApiQuery } from "@/redux/services/crudApi";
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

type ItemRow = PurchaseItemInput;

type FormValues = PurchaseFormInput;

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
          qty: 1,
          rate: 0,
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

  // API
  const [createPurchase, { isLoading: creating }] = useCreatePurchaseMutation();
  const [updatePurchase, { isLoading: updating }] =
    useUpdatePurchaseByIdMutation();
  const [completePurchase] = useCompletePurchaseByIdMutation();
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

  // Suppliers dropdown
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [viewSuppliersDialogOpen, setViewSuppliersDialogOpen] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  // Extra summary discount amount applied on top of line totals
  const [summaryDiscountPct, setSummaryDiscountPct] = useState<number>(0);
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);

  const closeDialog = () => {
    setSupplierDialogOpen(false);
  };

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
    {
      // Skip only if not showing all suppliers and search term is too short
      skip: !showAllSuppliers && supplierSearchTerm.trim().length < 2,
    },
  );
  const supplierOptions = useMemo(() => {
    let rows: any[] = [];
    if (suppliersOk) {
      const raw: any = (suppliersResp as any)?.data;
      if (Array.isArray(raw)) {
        rows = raw;
      } else if (Array.isArray(raw?.data)) {
        rows = raw.data;
      }
    }
    return [{ label: "Select Supplier", value: "" }].concat(
      rows.map((s: any) => ({ label: s.name, value: String(s.id) })),
    );
  }, [suppliersOk, suppliersResp]);

  // Extract suppliers from API response
  const suppliers = useMemo(() => {
    if (!suppliersOk && !showAllSuppliers) return [];
    const raw: any = (suppliersResp as any)?.data;
    let data = [];
    if (Array.isArray(raw)) data = raw;
    else if (Array.isArray(raw?.data)) data = raw.data;

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

  // Normalized supplier rows for dropdown
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

  useEffect(() => {
    if (AccountsData?.data?.data) {
      const accountOptions = AccountsData.data.data.map((account: any) => ({
        value: account.id,
        label: account.name,
      }));
      setAccounts(accountOptions);
    }
  }, [AccountsData]);

  // Purchase Categories dropdown

  const [purchaseCategories, setPurchaseCategories] = useState<
    { value: string; label: string }[]
  >([]);
  const { data: PurchaseCategoriesData } = useGetApiQuery({
    url: `${PURCHASE_CATEGORY_URL}list?page=1&limit=100`,
  });

  useEffect(() => {
    if (PurchaseCategoriesData?.data?.data) {
      const categoryOptions = PurchaseCategoriesData.data.data.map(
        (category: any) => ({
          value: category.id,
          label: category.name,
        }),
      );
      setPurchaseCategories(categoryOptions);
    }
  }, [PurchaseCategoriesData]);

  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);

  const { data: usersData } = useGetAllUserQuery({
    page: 1,
    limit: 100,
  });

  useEffect(() => {
    if (usersData?.data?.data) {
      const userOptions = usersData.data.data.map((user: any) => ({
        value: user.id,
        label: user.username,
      }));
      setUsers(userOptions);
    }
  }, [usersData]);

  const items = watch("items") as ItemRow[];
  const username = useAppSelector((s) => (s as any).auth?.username) as
    | string
    | undefined;
  // const dateValue = watch("date");
  const [mediaOpen, setMediaOpen] = useState(false);
  const selectedImage = useAppSelector((state) => state.media.selectedImage) as
    | string
    | "";

  // let bsDateDisplay = "";
  // if (dateValue) {
  //   const nd = NepaliDate.fromAD(new Date(dateValue));
  //   const bs = nd.getBS();
  //   const yy = bs.year;
  //   const mm = String(bs.month).padStart(2, "0");
  //   const dd = String(bs.date).padStart(2, "0");
  //   bsDateDisplay = `${yy}-${mm}-${dd}`;
  // }

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
    return {
      base,
      discountAmt,
      taxAmt,
      lineTotal,
      taxableAmount,
      nonTaxableAmount,
    };
  };

  const totals = items?.reduce(
    (acc, r) => {
      const {
        base,
        discountAmt,
        taxAmt,
        lineTotal,
        taxableAmount,
        nonTaxableAmount,
      } = computeRow(r);
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

  // Summary discount amount (fixed amount, capped to grand total)
  const summaryDiscountAmount = isNaN(summaryDiscountPct)
    ? 0
    : Math.max(0, Math.min(totals.grand, Number(summaryDiscountPct)));
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

        const createdId =
          (response as any)?.data?.id ??
          (response as any)?.data?.data?.id ??
          (response as any)?.id;

        if (submitMode === "complete") {
          if (!createdId) {
            console.warn(
              "Could not determine created purchase ID to complete.",
              response,
            );
          } else {
            await completePurchase(createdId).unwrap();
          }
        }

        handleResponse({
          res: response,
          onSuccess: () => navigate(-1),
        });
      }
    } catch (error: any) {
      handleError({ error });
    }
  };

  return (
    <div className="p-6">
      <PageTitle title={isEdit ? "Edit Purchase" : "Add Purchase"} isBack />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-6"
      >
        <fieldset disabled={isCompleted} className="contents">
          <div className="flex flex-col gap-6 items-stretch">
            <div className="w-full lg:flex-1 flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg mt-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Invoice Details
                </h3>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1 flex justify-start">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    className="border rounded px-3 py-2 bg-white "
                    {...register("invoiceDate", {
                      required: "Invoice date is required",
                    })}
                  />
                  {/* <span className="text-xs text-gray-600 mt-1">
                  Date (BS): {bsDateDisplay}
                </span> */}
                  {errors.invoiceDate && (
                    <span className="text-red-600 text-sm mt-1">
                      {errors.invoiceDate.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col relative">
                  <div className="flex items-center gap-2 justify-between">
                    <label className="text-sm text-gray-700 mb-1 flex justify-start">
                      Supplier
                    </label>
                    <div className="relative">
                      <div className="flex gap-2 absolute right-0 bottom-[-8px]">
                        <CustomDialog
                          buttonTitle={
                            <button
                              type="button"
                              className="rounded-full bg-primaryColor px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-white shadow-sm transition-colors hover:bg-primaryColor/90 whitespace-nowrap"
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
                          className="rounded-full bg-gray-600 px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-white shadow-sm transition-colors hover:bg-gray-700 whitespace-nowrap"
                        >
                          View All
                        </button>
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
                                const value = e.target.value;
                                setSupplierSearchTerm(value);
                                setShowAllSuppliers(value.trim().length === 0);
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
                                  <tr
                                    key={supplier.id}
                                    className="hover:bg-gray-50"
                                  >
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
                  </div>
                  {/* <select
                    className="border rounded px-3 py-2 bg-white"
                    {...register("supplierId", {
                      required: "Supplier is required",
                    })}
                  >
                    {supplierOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select> */}

                  <div className="relative">
                    <Input
                      placeholder="Search supplier"
                      className="border rounded px-3 py-2 bg-white w-full"
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
                        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                          {!suppliersOk ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Type at least 2 characters to search…
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
                                  <div className="font-medium">
                                    {supplier.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {[supplier.phone, supplier.email]
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
                  {errors.supplierId && (
                    <span className="text-red-600 text-sm mt-1">
                      {errors.supplierId.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1 flex justify-start ">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    placeholder="Invoice no. (Optional)"
                    className="border rounded px-3 py-2 bg-white"
                    {...register("invoiceNumber")}
                  />
                </div>
                {/* Removed global Purchase Category field in favor of per-item category */}
                <Controller
                  name="paymentTerm"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Payment Terms"
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
                  )}
                />
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Account"
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
                    />
                  )}
                />
              </div>

              {/* Items table */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 flex justify-start ">
                    Purchase Items
                  </h2>
                  <div>
                    <button
                      type="button"
                      className="w-full sm:w-auto rounded-full bg-primaryColor px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primaryColor/90"
                      onClick={() =>
                        append({
                          particulars: "",
                          hsCode: "",
                          categoryId: "",
                          qty: 1,
                          rate: 0,
                          discountPercent: 0,
                          taxPercent: 13,
                          isTaxable: true,
                        })
                      }
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-[1000px] lg:min-w-full w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="p-2 border">S.N</th>
                        <th className="p-2 border">Category</th>
                        <th className="p-2 border">Particulars</th>
                        <th className="p-2 border">Qty</th>
                        <th className="p-2 border">Rate</th>
                        <th className="p-2 border">Taxable</th>
                        <th className="p-2 border">Amount</th>
                        <th className="p-2 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, idx) => {
                        const row = items[idx] || {
                          particulars: "",
                          hsCode: "",
                          qty: 0,
                          rate: 0,
                          discountPercent: 0,
                          taxPercent: 13,
                        };
                        const { base, discountAmt } = computeRow(row);
                        return (
                          <tr key={field.id}>
                            <td className="p-2 border text-center w-16">
                              {idx + 1}
                            </td>

                            <td className="p-2 border">
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
                                    placeholder="Select Category"
                                    options={[
                                      { value: "", label: "Select Category" },
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
                                <span className="input-error">
                                  {String(errors.items[idx].categoryId.message)}
                                </span>
                              )}
                            </td>
                            <td className="p-2 border">
                              <input
                                type="text"
                                className="border rounded px-2 py-1 w-[30rem] bg-white"
                                {...register(
                                  `items.${idx}.particulars` as const,
                                  {
                                    required: true,
                                  },
                                )}
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="number"
                                min={0}
                                step="1"
                                className="border rounded px-2 py-1 w-20 sm:w-24 bg-white"
                                {...register(`items.${idx}.qty` as const, {
                                  valueAsNumber: true,
                                })}
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                className="border rounded px-2 py-1 w-24 sm:w-28 bg-white"
                                {...register(`items.${idx}.rate` as const, {
                                  valueAsNumber: true,
                                })}
                              />
                            </td>

                            <td className="p-2 border text-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 bg-white"
                                {...register(`items.${idx}.isTaxable` as const)}
                                defaultChecked={row.isTaxable !== false}
                              />
                            </td>
                            <td className="p-2 border text-right w-28">
                              {(base - discountAmt).toFixed(2)}
                            </td>
                            <td className="p-2 border text-center">
                              <button
                                type="button"
                                onClick={() => remove(idx)}
                                disabled={fields.length === 1}
                                title="Remove row"
                                aria-label="Remove row"
                              >
                                <Trash className="text-red-600" size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="w-full shrink-0">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-xl">
                {/* Accent gradient blob */}
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primaryColor/10 blur-3xl" />

                <div className="p-4 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Purchase Summary
                    </h3>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="text-[11px] font-medium text-gray-500">
                        Taxable Amount
                      </div>
                      <div className="mt-1 text-lg font-semibold text-blue-600">
                        {CurrencySign}
                        {totals.taxable.toFixed(2)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="text-[11px] font-medium text-gray-500">
                        Non-Taxable
                      </div>
                      <div className="mt-1 text-lg font-semibold text-purple-600">
                        {CurrencySign}
                        {totals.nonTaxable.toFixed(2)}
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
                            onChange={(e) =>
                              setSummaryDiscountPct(Number(e.target.value) || 0)
                            }
                            className="w-20 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-right text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            title="Discount amount"
                            aria-label="Discount amount"
                          />
                        </div>
                      </div>
                      <div className="mt-1 text-lg text-emerald-700">
                        -{CurrencySign}
                        {summaryDiscountAmount.toFixed(2)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="text-[11px] font-medium text-gray-500">
                        Subtotal
                      </div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">
                        {CurrencySign}
                        {totals.subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-[48%] lg:w-[30%] xl:w-[20%] rounded-xl border border-amber-100 bg-amber-50 p-3 sm:p-4 shadow-sm mt-4">
                    <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
                      <div className="w-full sm:w-auto">
                        <div className="text-[12px] sm:text-[10px] font-medium text-amber-700">
                          Tax (
                          {watch("items").some((i) => i.isTaxable !== false)
                            ? watch("items").find((i) => i.isTaxable !== false)
                                ?.taxPercent || 13
                            : 0}
                          %)
                        </div>
                        <div className="mt-1 font-semibold text-amber-700 text-lg">
                          {CurrencySign}
                          {totals.tax.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right w-full sm:w-auto mt-2 sm:mt-0">
                        <div className="text-[12px] font-medium text-amber-700">
                          Grand Total
                        </div>
                        <div className="mt-1 text-lg sm:text-xl font-bold text-amber-800">
                          {CurrencySign}
                          {grandAfterSummaryDiscount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  {/* Grand total row */}
                  <div className="flex items-start justify-between gap-3 ">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600">
                        Entry By: {username || "-"}
                      </span>
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-gray-600">
                        Grand Total
                      </div>
                      <div className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                        {CurrencySign}
                        {grandAfterSummaryDiscount.toFixed(2)}
                      </div>
                      {summaryDiscountAmount > 0 && (
                        <div className="text-xs text-gray-500 line-through">
                          {CurrencySign}
                          {totals.grand.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
        <div className="w-full flex justify-start gap-3">
          {!isCompleted && (
            <>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-60"
                disabled={creating || updating}
                onClick={() => setSubmitMode("draft")}
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
                disabled={creating || updating}
                onClick={() => setSubmitMode("complete")}
              >
                Complete Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setSelectedSupplier(null);
                  setSupplierSearchTerm("");
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </>
          )}
          {isCompleted && (
            <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              This purchase is completed and cannot be edited.
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEditPurchase;
