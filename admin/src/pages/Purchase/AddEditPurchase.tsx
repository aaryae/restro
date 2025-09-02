import React, { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { CurrencySign } from "@/constants";
import { Trash } from "lucide-react";
import MediaComponent from "@/components/MediaComponent";
import { ImageInputUI } from "@/components/ImageComponent";
import { useAppSelector } from "@/redux/store/hooks";
import Select from "@/components/Select";
import { useNavigate } from "react-router-dom";
import { PURCHASE_CATEGORY_ADD_ROUTE } from "@/routes/routeNames";

type ItemRow = {
  particulars: string;
  qty: number | string;
  rate: number | string;
  taxPercent: number | string; // default 13
};

type FormValues = {
  date: string; // yyyy-MM-dd from input type=date
  vendorId: string;
  billNumber: string;
  items: ItemRow[];
  paidBy: string;
  paidFrom: string;
  cashOrCredit: "cash" | "credit" | "";
  purchaseCategoryId?: string;
  billImage?: string;
};

const AddEditPurchase: React.FC = () => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      vendorId: "",
      billNumber: "",
      items: [{ particulars: "", qty: 1, rate: 0, taxPercent: 13 }],
      paidBy: "",
      paidFrom: "",
      cashOrCredit: "",
      purchaseCategoryId: "",
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
    const taxPercent = Number(row.taxPercent) || 0;
    const gross = qty * rate;
    const taxAmt = (gross * taxPercent) / 100;
    const total = gross + taxAmt;
    return { gross, taxAmt, total };
  };

  const totals = items?.reduce(
    (acc, r) => {
      const { gross, taxAmt, total } = computeRow(r);
      acc.subtotal += gross;
      acc.tax += taxAmt;
      acc.grand += total;
      return acc;
    },
    { subtotal: 0, tax: 0, grand: 0 },
  );

  const onSubmit = (data: FormValues) => {
    // compute derived amounts and shape payload
    const detailedItems = data.items.map((r) => {
      const { gross, taxAmt, total } = computeRow(r);
      return { ...r, gross, taxAmt, total };
    });
    const payload = {
      ...data,
      items: detailedItems,
      totals,
      billImage: data.billImage,
    };

    // console.log("Purchase form submit payload:", payload);
    // alert("Purchase form submitted. Check console for payload.");
  };

  return (
    <div className="p-6">
      <h1 className="flex text-xl font-semibold mb-4">Add Purchase</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center space-y-6"
      >
        <div className="flex gap-2">
          <div className="flex flex-col gap-[1.5rem] border-[#ebe9f1] border-[1px]  p-8 rounded-[6px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Date (AD)</label>
                <input
                  type="date"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("date", { required: "Date is required" })}
                />
                {/* <span className="text-xs text-gray-600 mt-1">
                  Date (BS): {bsDateDisplay}
                </span> */}
                {errors.date && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.date.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Vendor ID</label>
                <input
                  type="text"
                  placeholder="e.g. 501"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("vendorId", {
                    required: "Vendor ID is required",
                  })}
                />
                {errors.vendorId && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.vendorId.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Bill Number
                </label>
                <input
                  type="text"
                  placeholder="Bill no."
                  className="border rounded px-3 py-2 bg-white"
                  {...register("billNumber", {
                    required: "Bill number is required",
                  })}
                />
                {errors.billNumber && (
                  <span className="text-red-600 text-sm mt-1">
                    {errors.billNumber.message}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Cash or Credit
                </label>
                <select
                  className="border rounded px-3 py-2 bg-white"
                  {...register("cashOrCredit")}
                >
                  <option value="">Select</option>
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">
                  Purchase Category
                </label>
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
                  <div className="mt-6">
                    <button
                      type="button"
                      className="flex gap-[0.5rem] items-center py-[0.25rem] px-[0.75rem] bg-primaryColor text-white rounded-[0.25rem]"
                      onClick={() => navigate(PURCHASE_CATEGORY_ADD_ROUTE)}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[14px]">Items</h2>
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() =>
                    append({ particulars: "", qty: 1, rate: 0, taxPercent: 13 })
                  }
                >
                  + Add Item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 border">Particulars</th>
                      <th className="p-2 border">Qty</th>
                      <th className="p-2 border">Rate</th>
                      <th className="p-2 border">Gross</th>
                      <th className="p-2 border">Tax %</th>
                      <th className="p-2 border">Tax Amt</th>
                      <th className="p-2 border">Total</th>
                      <th className="p-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, idx) => {
                      const row = items[idx] || {
                        particulars: "",
                        qty: 0,
                        rate: 0,
                        taxPercent: 0,
                      };
                      const { gross, taxAmt, total } = computeRow(row);
                      return (
                        <tr key={field.id}>
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
                          <td className="p-2 border text-right w-28">
                            {gross.toFixed(2)}
                          </td>
                          <td className="p-2 border">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="border rounded px-2 py-1 w-24 bg-white"
                              {...register(`items.${idx}.taxPercent` as const, {
                                valueAsNumber: true,
                              })}
                            />
                          </td>
                          <td className="p-2 border text-right w-28">
                            {taxAmt.toFixed(2)}
                          </td>
                          <td className="p-2 border text-right w-28">
                            {total.toFixed(2)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Paid By</label>
                <input
                  type="text"
                  placeholder="e.g. cash/card/online/cheque"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("paidBy")}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Paid From</label>
                <input
                  type="text"
                  placeholder="e.g. account/source"
                  className="border rounded px-3 py-2 bg-white"
                  {...register("paidFrom")}
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
          <div className="flex justify-center border-[##ebe9f1] border-[1px] px-16 pt-12 rounded-[6px]">
            <div className="flex flex-col items-start gap-2">
              <div className="text-[14px] font-medium">
                Subtotal: {CurrencySign}{" "}
                <span className="font-medium">
                  {totals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="text-[14px] font-medium">
                Total Tax: {CurrencySign}{" "}
                <span className="font-medium">{totals.tax.toFixed(2)}</span>
              </div>
              <div className="text-[17px] font-bold">
                Grand Total: {CurrencySign}{" "}
                <span className="font-semibold">{totals.grand.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mr-[75rem]">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Submit
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
