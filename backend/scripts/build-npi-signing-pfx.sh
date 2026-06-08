#!/usr/bin/env bash
# Pack the NCHL-registered PEM into a PFX for QR token signing (openssl pkcs12).
# mTLS still uses MACHBANK_PFX_PATH (roadside.pfx) separately.
set -euo pipefail
cd "$(dirname "$0")/.."

PEM="${1:-./secrets/qr-signing-private.pem}"
OUT="${2:-./secrets/npi-signing.pfx}"
PASS="${3:-20260526}"

if [[ ! -f "$PEM" ]]; then
  echo "PEM not found: $PEM" >&2
  exit 1
fi

CRT="$(mktemp)"
trap 'rm -f "$CRT"' EXIT

openssl req -new -x509 -key "$PEM" -out "$CRT" -days 3650 \
  -subj "/CN=NPI-QR-Signing/O=The Roadside/C=NP"
openssl pkcs12 -export -out "$OUT" -inkey "$PEM" -in "$CRT" -passout "pass:${PASS}"

echo "Wrote $OUT (passphrase: $PASS)"
echo "Set in .env:"
echo "  MACHBANK_QR_SIGNING_PFX_PATH=$OUT"
echo "  MACHBANK_QR_SIGNING_PFX_PASSPHRASE=$PASS"
