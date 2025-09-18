import { z } from "zod";

// Base common fields
const BaseAccount = z.object({
  accountName: z.string().min(1, "Account Name is required"),
  accountType: z.enum(["cash", "bank", "wallet"], {
    required_error: "Account Type is required",
  }),

  openingBalance: z.coerce
    .number()
    .min(0, "Opening Balance must be 0 or more")
    .default(0),
  description: z.string().optional(),
  status: z
    .enum(["active", "inactive"], {
      required_error: "Status is required",
    })
    .default("active"),
});

const CashAccount = BaseAccount.extend({
  accountType: z.literal("cash"),
  bankAccountNumber: z.string().optional(),
  walletAccountName: z.string().optional(),
  walletId: z.string().optional(),
});

const BankAccount = BaseAccount.extend({
  accountType: z.literal("bank"),
  bankAccountNumber: z.string().min(1, "Bank Account Number is required"),
  staticQrUrl: z.string().min(1, "Static QR URL is required"),
  walletAccountName: z.string().optional(),
  walletId: z.string().optional(),
});

const WalletAccount = BaseAccount.extend({
  accountType: z.literal("wallet"),
  walletAccountName: z.string().min(1, "Wallet Account Name is required"),
  walletId: z.string().min(1, "Wallet ID is required"),
  staticQrUrl: z.string().min(1, "Static QR URL is required"),
  bankAccountNumber: z.string().optional(),
});

export const AccountSchema = z.discriminatedUnion("accountType", [
  CashAccount,
  BankAccount,
  WalletAccount,
]);
