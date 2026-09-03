/** Matches backend `generateTempPassword()` for cafe owners. */
export function generateOwnerPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  const encoded = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
  return `Serve${encoded}!`
}
