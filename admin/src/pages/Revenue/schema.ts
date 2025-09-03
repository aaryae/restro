import { z } from "zod";

export const RevenueSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "card", "online"], {
    required_error: "Payment method is required",
  }),
  cash_or_credit: z.enum(["cash", "credit"], {
    required_error: "Cash or Credit is required",
  }),
  remarks: z.string().optional().default(""),
});
