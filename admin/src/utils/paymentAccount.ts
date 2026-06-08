/** Bank/wallet account is Machbank NEPALPAY when name contains NEPALPAY (case-insensitive). */
export function isNepalPayAccount(account: {
  name?: string;
  accountName?: string;
} | null | undefined): boolean {
  if (!account) return false;
  const label = `${account.name ?? ""} ${account.accountName ?? ""}`.toUpperCase();
  return label.includes("NEPALPAY") || label.includes("NEPAL PAY");
}
