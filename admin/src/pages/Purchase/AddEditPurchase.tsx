import React, { useEffect, useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import { useForm, useFieldArray } from "react-hook-form";
import { CurrencySign } from "@/constants";
import { Trash } from "lucide-react";
import MediaComponent from "@/components/MediaComponent";
import { ImageInputUI } from "@/components/ImageComponent";
import { useAppSelector } from "@/redux/store/hooks";
import Select from "@/components/Select";
import { useNavigate, useParams } from "react-router-dom";
import { PURCHASE_CATEGORY_ADD_ROUTE } from "@/routes/routeNames";
import { useGetAllUserQuery } from "@/redux/services/authentication";

type ItemRow = {
  particulars: string;
  hsCode?: string;
  qty: number | string;
  rate: number | string;
  discountPercent: number | string; // default 0
  taxPercent: number | string; // default 13
};

// Simple dropdown components (replace with real data sources as needed)
type IdChangeHandler = (val: string) => void;

function AccountDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: IdChangeHandler;
}) {
  const options = [
    { label: "Select Account", value: "" },
    { label: "Main Cash", value: "acc_cash" },
    { label: "Bank - A", value: "acc_bank_a" },
    { label: "Bank - B", value: "acc_bank_b" },
  ];
  return (
    <select
      className="border rounded px-3 py-2 bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Account"
      aria-label="Account"
    >
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

type FormValues = {
  invoiceDate: string; // yyyy-MM-dd from input type=date
  supplierName: string;
  panVat: string;
  invoiceNumber: string;
  items: ItemRow[];
  purchaseCategoryId?: string;
  billImage?: string;
  paymentTerm: "cash" | "cheque" | "credit" | "others" | "";
  accountId?: string; // shown when paymentTerm = others
  paidByUserId?: string;
};

const AddEditPurchase: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      invoiceDate: new Date().toISOString().slice(0, 10),
      supplierName: "",
      panVat: "",
      invoiceNumber: "",
      items: [
        {
          particulars: "",
          hsCode: "",
          qty: 1,
          rate: 0,
          discountPercent: 0,
          taxPercent: 13,
        },
      ],
      purchaseCategoryId: "",
      paymentTerm: "",
      accountId: "",
      paidByUserId: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const navigate = useNavigate();

  const purchaseCategoryOptions = useMemo(
    () => [
      { label: "Fruits and Vegetables", value: "1" },
      { label: "Coffee Beans", value: "2" },
      { label: "Bakery Items", value: "3" },
      { label: "Cigarettes and Hukka", value: "4" },
      { label: "Soft Drinks", value: "5" },
      { label: "Hard Drinks", value: "6" },
      { label: "Coffee Related other Items", value: "7" },
    ],
    [],
  );

  const items = watch("items") as ItemRow[];
  const paymentTerm = watch("paymentTerm");
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
    const taxAmt = (taxable * taxPercent) / 100;
    const lineTotal = taxable + taxAmt;
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
    if (!isEdit) return;
    // Mock existing purchase data for edit mode
    const mock: FormValues = {
      invoiceDate: "2025-09-01",
      supplierName: "Sample Supplier",
      panVat: "123456789",
      invoiceNumber: "INV-1001",
      items: [
        {
          particulars: "Raw Vegetables",
          hsCode: "0709",
          qty: 5,
          rate: 100,
          discountPercent: 0,
          taxPercent: 13,
        },
        {
          particulars: "Fruits",
          hsCode: "0810",
          qty: 3,
          rate: 150,
          discountPercent: 0,
          taxPercent: 13,
        },
      ],
      purchaseCategoryId: "1",
      billImage: "",
      paymentTerm: "cash",
      accountId: "",
      paidByUserId: "",
    };
    reset(mock);
  }, [isEdit, reset]);

  const onSubmit = (data: FormValues) => {
    const detailedItems = data.items.map((r) => {
      const { base, discountAmt, taxAmt, lineTotal } = computeRow(r);
      return { ...r, base, discountAmt, taxAmt, total: lineTotal };
    });
    const payload = {
      ...data,
      items: detailedItems,
      totals,
      billImage: data.billImage,
      id: isEdit ? id : undefined,
    };

    console.log("Purchase form submit payload:", payload);
    navigate(-1);
  };

  return (
    <div className="p-6">
      <PageTitle title={isEdit ? "Edit Purchase" : "Add Purchase"} isBack />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center space-y-6"
      >
        <div className="flex gap-6 items-start">
          <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
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
                <label className="text-sm text-gray-700 mb-1">
                  Name of Supplier
                </label>
                <input
                  type="text"
                  placeholder="Supplier name"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("supplierName", {
                    required: "Supplier name is required",
                  })}
                />
                {errors.supplierName && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.supplierName.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  PAN/VAT Number
                </label>
                <input
                  type="text"
                  placeholder="PAN/VAT"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("panVat", { required: "PAN/VAT is required" })}
                />
                {errors.panVat && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.panVat.message}
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
              <div className="flex flex-col">
                {/* <label className="text-sm text-gray-700 mb-1">
                  Purchase Category
                </label> */}
                <div className="flex gap-[0.5rem] items-center">
                  <Select
                    options={purchaseCategoryOptions}
                    className="w-full"
                    label="Purchase Category"
                    value={watch("purchaseCategoryId")}
                    onChange={(e: any) =>
                      setValue("purchaseCategoryId", e?.target?.value ?? "", {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  {/* <div className="mt-6">
                    <button
                      type="button"
                      className="flex gap-[0.5rem] items-center py-[0.25rem] px-[0.75rem] bg-primaryColor text-white rounded-[0.25rem]"
                      onClick={() => navigate(PURCHASE_CATEGORY_ADD_ROUTE)}
                    >
                      Add
                    </button>
                  </div> */}
                </div>
              </div>
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
                  <option value="">Select</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit">Credit</option>
                  <option value="others">Others</option>
                </select>
              </div>
              {paymentTerm === "others" && (
                <div className="flex flex-col">
                  <label className="text-sm text-gray-700 mb-1">
                    Select Account
                  </label>
                  <AccountDropdown
                    onChange={(val) => setValue("accountId", val)}
                    value={watch("accountId") || ""}
                  />
                </div>
              )}
            </div>

            {/* Items table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Purchase Items
                </h2>
                <button
                  type="button"
                  className="rounded-full bg-primaryColor px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primaryColor/90"
                  onClick={() =>
                    append({
                      particulars: "",
                      hsCode: "",
                      qty: 1,
                      rate: 0,
                      discountPercent: 0,
                      taxPercent: 13,
                    })
                  }
                >
                  + Add Item
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 border">S.N</th>
                      <th className="p-2 border">Particulars</th>
                      <th className="p-2 border">H.S Code</th>
                      <th className="p-2 border">Qty</th>
                      <th className="p-2 border">Rate</th>
                      <th className="p-2 border">Discount %</th>
                      <th className="p-2 border">Subtotal</th>
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
                              type="text"
                              className="border rounded px-2 py-1 w-full bg-white"
                              {...register(`items.${idx}.hsCode` as const)}
                            />
                          </td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              min={0}
                              step="1"
                              className="border rounded px-2 py-1 w-24 bg-white"
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
                              className="border rounded px-2 py-1 w-28 bg-white"
                              {...register(`items.${idx}.rate` as const, {
                                valueAsNumber: true,
                              })}
                            />
                          </td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="border rounded px-2 py-1 w-24 bg-white"
                              {...register(
                                `items.${idx}.discountPercent` as const,
                                {
                                  valueAsNumber: true,
                                },
                              )}
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
          <div className="w-full max-w-xl shrink-0">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-xl">
              {/* Accent gradient blob */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primaryColor/10 blur-3xl" />

              <div className="p-4 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Purchase Summary
                  </h3>
                  <span className="rounded-full bg-primaryColor/10 px-3 py-1 text-xs font-medium text-primaryColor">
                    Auto Tax 13%
                  </span>
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
        <div className="flex gap-3 mr-[81rem]">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            {isEdit ? "Update" : "Submit"}
          </button>
          <button type="reset" className="px-4 py-2 border rounded">
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditPurchase;
