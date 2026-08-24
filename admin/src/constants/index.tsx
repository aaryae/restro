import { LangType } from "../locale/language";
export const currentLanguage: LangType = "en";
export const CurrencySign = "Rs. ";

function lanAware(raw: string | undefined, trailingSlash = false) {
  if (!raw) return raw || "";
  if (typeof window === "undefined") return raw;
  try {
    const u = new URL(raw, window.location.origin);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      u.hostname = window.location.hostname;
    }
    const out = u.toString();
    if (trailingSlash) return out.endsWith("/") ? out : `${out}/`;
    return out;
  } catch {
    return raw;
  }
}

export const BACKEND_BASE_URL = lanAware(
  import.meta.env.VITE_BACKEND_BASE_URL,
  true,
);
const rawImageBaseUrl = lanAware(import.meta.env.VITE_IMAGE_BASE_URL || "", true);
export const IMAGE_BASE_URL = rawImageBaseUrl
  ? rawImageBaseUrl.endsWith("/")
    ? rawImageBaseUrl
    : `${rawImageBaseUrl}/`
  : "";
export const FRONTEND_BASE_URL = lanAware(import.meta.env.VITE_FRONTEND_BASE_URL);
export const WEBSOCKET_URL = lanAware(import.meta.env.VITE_WEBSOCKET_BASE_URL);
export const sk = import.meta.env.VITE_SITE_KEY;
