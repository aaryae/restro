import { LangType } from "../locale/language";
export const currentLanguage: LangType = "en";
export const CurrencySign = "Rs. ";

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
  );
}

function lanAware(raw: string | undefined, trailingSlash = false) {
  if (!raw) return raw || "";
  if (typeof window === "undefined") return raw;
  try {
    const u = new URL(raw, window.location.origin);
    const browsingLocal = isLocalHost(window.location.hostname);

    if (isLocalHost(u.hostname)) {
      u.hostname = window.location.hostname;
    } else if (browsingLocal) {
      // Docker/production builds opened on localhost must not call
      // serveapi.technirvana.com.np (CORS → POS stuck on loading).
      const isWs = u.protocol === "ws:" || u.protocol === "wss:";
      const isApiLike =
        isWs || /api/i.test(u.hostname) || u.pathname.includes("/api");
      u.hostname = window.location.hostname;
      if (isApiLike) {
        u.protocol = isWs ? "ws:" : "http:";
        u.port = "8081";
      } else {
        u.protocol = window.location.protocol;
        u.port = window.location.port;
      }
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
