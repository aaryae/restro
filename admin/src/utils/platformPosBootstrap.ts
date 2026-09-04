import { setToken } from "@/utils/tokenHandler";
import { captureTenantFromUrl, getTenantSlug } from "@/utils/tenantHandler";
import { BACKEND_BASE_URL } from "@/constants";

const HASH_TOKEN_KEYS = ["pos_token", "serve_pos_token", "access_token"];

function stripHash() {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

function applyToken(token: string) {
  setToken("token", token);
  setToken("lang", "en");
  stripHash();
}

/**
 * Accept POS session from platform impersonation / trial bootstrap.
 * Prefer one-time `#pos_code=` (exchanged server-side). Legacy `#pos_token=`
 * is still accepted briefly for older bookmarks.
 */
export async function applyPlatformPosBootstrap(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  captureTenantFromUrl();

  const rawHash = window.location.hash?.replace(/^#/, "") || "";
  if (!rawHash) return false;

  const params = new URLSearchParams(rawHash);
  const handoffCode = params.get("pos_code")?.trim();

  if (handoffCode) {
    try {
      const tenantSlug = getTenantSlug() || undefined;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (tenantSlug) headers["x-tenant-slug"] = tenantSlug;

      const res = await fetch(`${BACKEND_BASE_URL}auth/pos-exchange`, {
        method: "POST",
        headers,
        body: JSON.stringify({ code: handoffCode, tenantSlug }),
      });
      const json = await res.json().catch(() => ({}));
      const token = json?.data?.token;
      if (!res.ok || !token) {
        stripHash();
        return false;
      }
      applyToken(String(token));
      return true;
    } catch {
      stripHash();
      return false;
    }
  }

  let token: string | null = null;
  for (const key of HASH_TOKEN_KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      token = value;
      break;
    }
  }

  if (!token) return false;

  applyToken(token);
  return true;
}
