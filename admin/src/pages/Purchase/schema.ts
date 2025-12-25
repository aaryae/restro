import { z } from "zod";

export const PurchaseItemSchema = z.object({
  particulars: z.string().min(1, "Particulars is required"),
  hsCode: z.string().optional().or(z.literal("")),
  // Backend (Joi) treats categoryId as optional
  categoryId: z.number().optional().or(z.literal("")),
  qty: z.coerce
    .number({ message: "Qty must be a number" })
    .int()
    .min(1, "Qty must be at least 1"),
  // Backend requires positive rate
  rate: z.coerce
    .number({ message: "Rate must be a number" })
    .gt(0, "Rate must be greater than 0"),

  // UI-only helpers (not sent to backend)
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
  isTaxable: z.boolean().default(true).optional(),
});

export const PurchaseSchema = z.object({
  invoiceDate: z
    .string()
    .min(1, "Invoice date is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "Invalid invoice date",
    }),
  supplierId: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().optional().nullable(),

  items: z.array(PurchaseItemSchema).min(1, "At least one item is required"),
  billImage: z.string().optional().or(z.literal("")),

  // Match backend Joi: required enum of payment terms
  paymentTerm: z.enum(["cash", "cheque", "credit"]).default("cash"),
  accountId: z.number().min(1, "Account is required"),
  paidByUserId: z.number().optional().or(z.literal("")),
});

export const PurchaseFilterSchema = z.object({
  // Accept Date object from DateInput or empty string
  date: z.union([z.date(), z.string()]).optional().or(z.literal("")),
  supplierName: z.string().optional().or(z.literal("")),
  status: z.string().optional().or(z.literal("")),
});
export type PurchaseItemInput = z.infer<typeof PurchaseItemSchema>;
export type PurchaseFormInput = z.infer<typeof PurchaseSchema>;
export type PurchaseFilterInput = z.infer<typeof PurchaseFilterSchema>;
