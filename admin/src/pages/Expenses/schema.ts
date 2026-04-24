import z from "zod";

export const ExpenseSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "online"], {
    required_error: "Payment method is required",
  }),
  accountId: z.string().min(1, "Payment source is required"),
  amount: z.coerce
    .number({ message: "Amount must be a number" })
    .positive("Amount must be positive"),
  // Required in UI
  categoryId: z.string().min(1, "Category is required"),
  supplierId: z.string().optional(),
  remarks: z.string().optional().or(z.literal("")),
});

export const ExpenseFilterSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "online"]).optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
});

export type ExpenseFilterType = z.infer<typeof ExpenseFilterSchema>;
