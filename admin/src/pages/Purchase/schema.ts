import { z } from "zod";

/**
 * Purchase form schema and types
 * Mirrors the structure used in AddEditPurchase.tsx
 */

// Individual purchase item row
export const PurchaseItemSchema = z.object({
  particulars: z.string().min(1, "Particulars is required"),
  hsCode: z.string().optional().or(z.literal("")),
  qty: z.coerce
    .number({ message: "Qty must be a number" })
    .int()
    .min(1, "Qty must be at least 1"),
  rate: z.coerce
    .number({ message: "Rate must be a number" })
    .min(0, "Rate cannot be negative"),
  // Kept for parity with UI state even if not currently editable in table
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
});

export const PurchaseSchema = z
  .object({
    invoiceDate: z
      .string()
      .min(1, "Invoice date is required")
      .refine((v) => !Number.isNaN(Date.parse(v)), {
        message: "Invalid invoice date",
      }),
    supplierId: z.string().min(1, "Supplier is required"),
    invoiceNumber: z.string().min(1, "Invoice number is required"),

    items: z.array(PurchaseItemSchema).min(1, "At least one item is required"),

    purchaseCategoryId: z.string().min(1, "Purchase category is required"),
    billImage: z.string().optional().or(z.literal("")),

    paymentTerm: z
      .union([z.enum(["cash", "cheque", "credit"]), z.literal("")])
      .default("cash"),
    accountId: z.string().min(1, "Account is required"),
    paidByUserId: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // When payment term is set, ensure valid enum (empty treated by UI as cash)
    if (data.paymentTerm === "") {
    }

    // Require account selection always (UI shows required message too)
    if (!data.accountId || data.accountId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountId"],
        message: "Account is required",
      });
    }

    // Validate each item for business rules beyond base schema if needed
    data.items.forEach((item, idx) => {
      if (item.qty <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", idx, "qty"],
          message: "Qty must be greater than 0",
        });
      }
      if (item.rate < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", idx, "rate"],
          message: "Rate cannot be negative",
        });
      }
    });
  });

export type PurchaseItemInput = z.infer<typeof PurchaseItemSchema>;
export type PurchaseFormInput = z.infer<typeof PurchaseSchema>;
