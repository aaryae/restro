import { z } from "zod";

const TransferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountId: z.string().min(1, "Destination account is required"),
    amount: z
      .number({ invalid_type_error: "Amount is required" })
      .positive("Amount must be greater than 0"),
    remarks: z.string().min(1, "Remarks is required"),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    path: ["fromAccountId"],
    message: "Source and destination accounts cannot be the same",
  });

export default TransferSchema;
