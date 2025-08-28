export default function isValidHex(hexString: string) {
  // Regex for 3-digit, 6-digit, 4-digit (with alpha), or 8-digit (with alpha) hex colors,
  // optionally prefixed with '#'
  const hexRegex =
    /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  return hexRegex.test(hexString);
}
