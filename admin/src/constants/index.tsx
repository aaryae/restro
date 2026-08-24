import { LangType } from "../locale/language";
export const currentLanguage: LangType = "en";
export const CurrencySign = "Rs. ";

export const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const rawImageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || "";
export const IMAGE_BASE_URL = rawImageBaseUrl
  ? rawImageBaseUrl.endsWith("/")
    ? rawImageBaseUrl
    : `${rawImageBaseUrl}/`
  : "";
export const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_BASE_URL;
export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_BASE_URL;
export const sk = import.meta.env.VITE_SITE_KEY;
