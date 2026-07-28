export function formatCurrencyAmount(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function sumAccountBalances(
  accounts: Array<{ currentBalance?: number | string | null }>,
) {
  return accounts.reduce(
    (sum, account) => sum + Number(account.currentBalance || 0),
    0,
  );
}
