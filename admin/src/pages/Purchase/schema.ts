import { z } from "zod";

export const PurchaseItemSchema = z.object({
  particulars: z.string().min(1, "Particulars is required"),
  categoryId: z.number().optional().or(z.literal("")),
  qty: z.coerce
    .number({ message: "Qty must be a number" })
    .int()
    .min(1, "Qty must be at least 1"),
  rate: z.coerce
    .number({ message: "Rate must be a number" })
    .gt(0, "Rate must be greater than 0"),
  discountPercent: z.coerce
    .number({ message: "Discount % must be a number" })
    .min(0, "Discount % cannot be negative")
    .max(100, "Discount % cannot exceed 100")
    .default(0)
    .optional(),
  taxPercent: z.coerce
    .number({ message: "Tax % must be a number" })
    .min(0, "Tax % cannot be negative")
    .max(100, "Tax % cannot exceed 100")
    .default(13)
    .optional(),
  isTaxable: z.boolean().default(false).optional(),
});

export function isBlankPurchaseItem(
  item: Partial<z.infer<typeof PurchaseItemSchema>>,
): boolean {
  const particulars = String(item.particulars ?? "").trim();
  const qty = Number(item.qty);
  const rate = Number(item.rate);
  const hasQty = Number.isFinite(qty) && qty > 0;
  const hasRate = Number.isFinite(rate) && rate > 0;
  const hasCategory =
    item.categoryId !== "" &&
    item.categoryId !== undefined &&
    item.categoryId !== null &&
    Number(item.categoryId) > 0;

  return !particulars && !hasQty && !hasRate && !hasCategory;
}

export function filterFilledPurchaseItems(items: unknown) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isBlankPurchaseItem(item));
}

export const PurchaseSchema = z.object({
  invoiceDate: z
    .string()
    .min(1, "Invoice date is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Invalid invoice date",
    }),
  supplierId: z.string().min(1, "Select a supplier from the list"),
  invoiceNumber: z.string().optional().nullable(),
  items: z.preprocess(
    (items) => filterFilledPurchaseItems(items),
    z
      .array(PurchaseItemSchema)
      .min(1, "Add at least one purchase item with particulars, qty, and rate"),
  ),
  paymentTerm: z.enum(["cash", "cheque", "credit"]).default("cash"),
  accountId: z.coerce.number().min(1, "Account is required"),
  notes: z.string().optional().nullable().or(z.literal("")),
});

export const PurchaseFilterSchema = z.object({
  date: z
    .union([z.date(), z.string().min(1)])
    .optional()
    .nullable()
    .or(z.literal("")),
  supplierName: z.string().optional().or(z.literal("")),
  status: z.string().optional().or(z.literal("")),
});
export type PurchaseItemInput = z.infer<typeof PurchaseItemSchema>;
export type PurchaseFormInput = z.infer<typeof PurchaseSchema>;
export type PurchaseFilterInput = z.infer<typeof PurchaseFilterSchema>;
