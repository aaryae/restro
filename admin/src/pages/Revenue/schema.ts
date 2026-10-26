import { z } from "zod";
import { isFutureLocalDate } from "@/utils/localDate";

export const RevenueSchema = z.object({
  date: z
    .string()
    .min(1, "Date is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" })
    .refine((v) => !isFutureLocalDate(v.slice(0, 10)), {
      message: "Date cannot be in the future",
    }),
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "card", "online"], {
    required_error: "Payment method is required",
  }),
  cash_or_credit: z.enum(["cash", "credit"], {
    required_error: "Cash or Credit is required",
  }),
  accountId: z
    .number({ required_error: "Account is required" })
    .int("Account is required")
    .positive("Account is required"),
  remarks: z.string().optional().default(""),
});
