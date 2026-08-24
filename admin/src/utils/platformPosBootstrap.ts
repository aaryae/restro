import { setToken } from "@/utils/tokenHandler";
import { captureTenantFromUrl } from "@/utils/tenantHandler";

const HASH_TOKEN_KEYS = ["pos_token", "serve_pos_token", "access_token"];

/**
 * Accept one-time POS session from platform impersonation / trial bootstrap.
 * Token is passed in the URL hash so it is not sent to the server in Referer.
 * Example: http://localhost:7001/?tenant=brew#pos_token=<jwt>
 */
export function applyPlatformPosBootstrap(): boolean {
  if (typeof window === "undefined") return false;

  captureTenantFromUrl();

  const rawHash = window.location.hash?.replace(/^#/, "") || "";
  if (!rawHash) return false;

  const params = new URLSearchParams(rawHash);
  let token: string | null = null;
  for (const key of HASH_TOKEN_KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      token = value;
      break;
    }
  }

  if (!token) return false;

  setToken("token", token);
  setToken("lang", "en");

  // Strip secrets from the address bar without reloading.
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );

  return true;
}
