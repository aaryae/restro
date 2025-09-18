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
import { PURCHASE_URL } from "@/constants/apiUrlConstants";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PurchaseSchema,
  type PurchaseFormInput,
  type PurchaseItemInput,
} from "./schema";

type ItemRow = PurchaseItemInput;

// Simple dropdown components (replace with real data sources as needed)
type IdChangeHandler = (val: string) => void;

function AccountDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: IdChangeHandler;
}) {
  // Fetch active accounts
  const url = buildQueryString("account/list", { page: 1, limit: 100 });
  const { data, isFetching, isSuccess } = useGetApiQuery({ url });
  const rows: any[] = isSuccess ? (data?.data?.data ?? []) : [];
  const options = [{ label: "Select Account", value: "" }].concat(
    rows.map((a: any) => ({
      label: `${a.name} (${a.accountType})`,
      value: String(a.id),
    })),
  );
  return (
    <select
      className="border rounded px-3 py-2 bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Account"
      aria-label="Account"
    >
      {isFetching && <option value="">Loading accounts...</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function UserDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: IdChangeHandler;
}) {
  const { data, isLoading, isSuccess } = useGetAllUserQuery({
    page: 1,
    limit: 100,
  });
  const users = isSuccess ? ((data as any)?.data?.data ?? []) : [];
  return (
    <select
      className="border rounded px-3 py-2 bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Paid by user"
      aria-label="Paid by user"
    >
      <option value="">{isLoading ? "Loading users..." : "Select User"}</option>
      {users.map((u: any) => (
        <option key={u.id} value={String(u.id)}>
          {u.username ||
            `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
            `User ${u.id}`}
        </option>
      ))}
    </select>
  );
}

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
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(PurchaseSchema),
    defaultValues: {
      invoiceDate: new Date().toISOString().slice(0, 10),
      supplierId: "",
      invoiceNumber: "",
      items: [
        {
          particulars: "",
          hsCode: "",
          categoryId: "",
          qty: 1,
          rate: 0,
          discountPercent: 0,
          taxPercent: 13,
          isTaxable: true,
        },
      ],
      paymentTerm: "cash",
      accountId: "",
      paidByUserId: "",
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
    const raw = (p?.status ?? p?.purchaseStatus ?? p?.state ?? "").toString().toLowerCase();
    return raw === "completed" || raw === "complete";
  }, [purchaseData]);

  // Suppliers dropdown
  const supplierUrl = buildQueryString("supplier/list", {
    page: 1,
    limit: 100,
  });
  const { data: suppliersResp, isSuccess: suppliersOk } =
    useGetListAllSupplierQuery({ url: supplierUrl });
  const supplierOptions = useMemo(() => {
    const rows: any[] = suppliersOk ? (suppliersResp?.data ?? []) : [];
    return [{ label: "Select Supplier", value: "" }].concat(
      rows.map((s: any) => ({ label: s.name, value: String(s.id) })),
    );
  }, [suppliersOk, suppliersResp]);

  // Purchase Categories dropdown
  const pcUrl = buildQueryString("purchase-category/list", {
    page: 1,
    limit: 100,
  });
  const { data: pcResp, isSuccess: pcOk } = useGetApiQuery({ url: pcUrl });
  const purchaseCategoryOptions = useMemo(() => {
    const rows: any[] = pcOk ? (pcResp?.data?.data ?? []) : [];
    return [{ label: "Select Category", value: "" }].concat(
      rows.map((c: any) => ({ label: c.name, value: String(c.id) })),
    );
  }, [pcOk, pcResp]);

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
    const taxable = base - discountAmt;
    const taxAmt = row.isTaxable === false ? 0 : (taxable * taxPercent) / 100;
    const lineTotal = taxable + taxAmt; // tax included in line
    return { base, discountAmt, taxAmt, lineTotal };
  };

  const totals = items?.reduce(
    (acc, r) => {
      const { base, discountAmt, taxAmt, lineTotal } = computeRow(r);
      acc.subtotal += base;
      acc.discount += discountAmt;
      acc.tax += taxAmt;
      acc.grand += lineTotal;
      return acc;
    },
    { subtotal: 0, discount: 0, tax: 0, grand: 0 },
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
        hsCode: it.hsCode || "",
        categoryId: it.categoryId ? String(it.categoryId) : "",
        qty: it.quantity || 0,
        rate: it.rate || 0,
        isTaxable: it.isTaxable !== undefined ? Boolean(it.isTaxable) : true,
      })),
      billImage: "",
      paymentTerm: (p.paymentTerms as any) || "cash",
      accountId: p.accountId ? String(p.accountId) : "",
      paidByUserId: p.paidByUserId ? String(p.paidByUserId) : "",
    });
  }, [isEdit, purchaseFetched, purchaseData, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      supplierId: Number(data.supplierId),
      invoiceDate: new Date(data.invoiceDate).toISOString(),
      invoiceNumber: data.invoiceNumber,
      paymentTerms: data.paymentTerm === "" ? "cash" : data.paymentTerm,
      accountId:
        data.paymentTerm === "credit"
          ? Number(data.accountId || 0)
          : Number(data.accountId),
      items: data.items.map((r) => ({
        categoryId: r.categoryId ? Number(r.categoryId) : undefined,
        hsCode: r.hsCode || null,
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
          res: { success: true, msg: response?.message },
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
            console.warn("Could not determine created purchase ID to complete.", response);
          } else {
            await completePurchase(createdId).unwrap();
          }
        }

        handleResponse({
          res: { success: true, msg: response?.message },
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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-6">
        <fieldset disabled={isCompleted} className="contents">
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          <div className="w-full lg:flex-1 flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Invoice Details
              </h3>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  className="border rounded px-3 py-2 bg-white"
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
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Supplier</label>
                <select
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
                </select>
                {errors.supplierId && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.supplierId.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="Invoice no."
                  className="border rounded px-3 py-2 bg-white"
                  {...register("invoiceNumber", {
                    required: "Invoice number is required",
                  })}
                />
                {errors.invoiceNumber && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.invoiceNumber.message}
                  </span>
                )}
              </div>
              {/* Removed global Purchase Category field in favor of per-item category */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Payment Terms
                </label>
                <select
                  className="border rounded px-3 py-2 bg-white"
                  {...register("paymentTerm")}
                  title="Payment terms"
                  aria-label="Payment terms"
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Account</label>
                <AccountDropdown
                  onChange={(val) =>
                    setValue("accountId", val, { shouldDirty: true })
                  }
                  value={watch("accountId") || ""}
                />
                {(!watch("accountId") || watch("accountId") === "") && (
                  <span className="text-xs text-red-600 mt-1">
                    Account is required
                  </span>
                )}
              </div>
            </div>

            {/* Items table */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Purchase Items
                </h2>
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
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-[1000px] lg:min-w-full w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 border">S.N</th>
                      <th className="p-2 border">HS Code</th>
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
                      const { lineTotal } = computeRow(row);
                      return (
                        <tr key={field.id}>
                          <td className="p-2 border text-center w-16">
                            {idx + 1}
                          </td>
                          <td className="p-2 border">
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-full bg-white"
                              {...register(`items.${idx}.hsCode` as const)}
                            />
                          </td>
                          <td className="p-2 border">
                            <select
                              className="border rounded px-2 py-1 w-full bg-white"
                              {...register(`items.${idx}.categoryId` as const)}
                            >
                              {purchaseCategoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 border">
                            <input
                              type="text"
                              className="border rounded px-2 py-1 w-full bg-white"
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
                              className="h-4 w-4"
                              {...register(`items.${idx}.isTaxable` as const)}
                              defaultChecked={row.isTaxable !== false}
                            />
                          </td>
                          <td className="p-2 border text-right w-28">
                            {lineTotal.toFixed(2)}
                          </td>
                          <td className="p-2 border text-center">
                            <button
                              type="button"
                              onClick={() => remove(idx)}
                              disabled={fields.length === 1}
                              title="Remove row"
                              aria-label="Remove row"
                            >
                              <Trash className="text-red-600" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment and file */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-start">
                <label className="text-sm text-gray-700 mb-1">
                  Paid By (User)
                </label>
                <UserDropdown
                  onChange={(val) => setValue("paidByUserId", val)}
                  value={watch("paidByUserId") || ""}
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                  Bill Image
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2 w-full md:w-[25rem]">
                  <MediaComponent
                    title={<ImageInputUI image={watch("billImage")} />}
                    handleConfirmImage={() => {
                      if (typeof selectedImage === "string") {
                        setValue("billImage", selectedImage, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }
                      setMediaOpen(false);
                    }}
                    isMultiSelect={false}
                    open={mediaOpen}
                    setOpen={setMediaOpen}
                    acceptFiles="image/*"
                  />
                  {watch("billImage") && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-red-500 text-white text-sm"
                        onClick={() =>
                          setValue("billImage", "", {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:max-w-xl shrink-0">
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-500">Subtotal</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {CurrencySign}
                      {totals.subtotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Discount</span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        -{CurrencySign}
                        {totals.discount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 text-lg font-semibold text-emerald-600">
                      {CurrencySign}
                      {(totals.subtotal - totals.discount).toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-500">Tax (13%)</div>
                    <div className="mt-1 text-lg font-semibold text-amber-600">
                      {CurrencySign}
                      {totals.tax.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                {/* Grand total row */}
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-600">
                      Grand Total
                    </div>
                    <div className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                      {CurrencySign}
                      {totals.grand.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      Entry By: {username || "-"}
                    </span>
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
              <button type="reset" className="px-4 py-2 border rounded">
                Reset
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
