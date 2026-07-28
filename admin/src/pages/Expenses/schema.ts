import z from "zod";

export const ExpenseSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "online"], {
    required_error: "Payment method is required",
  }),
  accountId: z.string().min(1, "Payment source is required"),
  amount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .positive("Amount must be positive"),
  ),
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().optional(),
  remarks: z.string().optional().or(z.literal("")),
});

export const ExpenseFilterSchema = z.object({
  date: z.union([z.date(), z.string()]).optional().or(z.literal("")),
  cash_or_credit: z.string().optional().or(z.literal("")),
});

export type ExpenseFilterInput = z.infer<typeof ExpenseFilterSchema>;
