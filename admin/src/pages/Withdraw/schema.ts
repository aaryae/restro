import { z } from "zod";

export const WithdrawSchema = z.object({
  accountId: z.number().int().positive("Account ID is required"),
  amount: z.number().positive("Amount must be positive"),
  remarks: z.string().optional(),
});

export type WithdrawFormType = z.infer<typeof WithdrawSchema>;
