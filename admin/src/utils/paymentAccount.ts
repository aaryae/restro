/**
 * DEPRECATED fallback: detect NEPALPAY by account name (case-insensitive).
 * Prefer linking an account to an active Payment Integration; checkout uses the
 * integration's linked accountId and only falls back to this name match.
 */
export function isNepalPayAccount(account: {
  name?: string;
  accountName?: string;
} | null | undefined): boolean {
  if (!account) return false;
  const label = `${account.name ?? ""} ${account.accountName ?? ""}`.toUpperCase();
  return label.includes("NEPALPAY") || label.includes("NEPAL PAY");
}
