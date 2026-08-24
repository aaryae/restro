import { z } from "zod";

type AccountBalanceLookup = (accountId: string) => number | undefined;

function parseTransferAmount(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : trimmed;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : value;
  }

  return value;
}

export function createTransferSchema(getSourceBalance?: AccountBalanceLookup) {
  return z
    .object({
      fromAccountId: z.string().min(1, "Source account is required"),
      toAccountId: z.string().min(1, "Destination account is required"),
      amount: z.preprocess(
        parseTransferAmount,
        z
          .number({ invalid_type_error: "Amount is required" })
          .finite("Enter a valid amount")
          .positive("Amount must be greater than 0")
          .refine(
            (val) => Math.round(val * 100) === val * 100,
            "Amount can have at most 2 decimal places",
          )
          .refine(
            (val) => val <= 999_999_999_999.99,
            "Amount is too large",
          ),
      ),
      remarks: z.string().trim().min(1, "Remarks is required"),
    })
    .refine((data) => data.fromAccountId !== data.toAccountId, {
      path: ["toAccountId"],
      message: "Source and destination accounts cannot be the same",
    })
    .superRefine((data, ctx) => {
      const balance = getSourceBalance?.(data.fromAccountId);
      if (balance != null && data.amount > balance) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Amount cannot exceed available balance (${balance.toFixed(2)})`,
          path: ["amount"],
        });
      }
    });
}

const TransferSchema = createTransferSchema();

export default TransferSchema;
