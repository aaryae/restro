export const VARIABLE_LABELS: Record<string, string> = {
  cafeName: 'Cafe name',
  ownerName: 'Owner name',
  ownerUsername: 'Login username',
  ownerPassword: 'Temporary password',
  posUrl: 'POS link',
  trialEndsAt: 'Trial end date',
  status: 'Account status',
  restoredStatus: 'Restored status',
  reason: 'Suspension reason',
  days: 'Days added',
}

export function variableToken(key: string) {
  return `{${key}}`
}
