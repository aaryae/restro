import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { getToken } from "../../utils/tokenHandler";
import { getTenantSlug } from "../../utils/tenantHandler";
import { BACKEND_BASE_URL } from "../../constants";
import { redirectToServeLogin } from "../../utils/serveAuth";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BACKEND_BASE_URL,
  prepareHeaders: (headers) => {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    } else {
      headers.delete("content-type");
    }

    const token = getToken("token");
    if (token) {
      headers.set("authorization", `Admin ${token}`);
    }

    const tenantSlug = getTenantSlug();
    if (tenantSlug) {
      headers.set("x-tenant-slug", tenantSlug);
    }
    return headers;
  },
});

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (
    result.error &&
    (result.error.status === 401 || result.error.status === 403)
  ) {
    redirectToServeLogin();
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "users",
    "role",
    "media-category",
    "media",
    "department",
    "interview",
    "question",
    "cliparts",
    "seo",
    "social",
    "setting",
    "faq",
    "notification",
    "email-template",
    "smtp",
    "product-category",
    "product",
    "product-variant",
    "floor",
    "table",
    "order",
    "account",
    "transfer",
    "supplier",
    "revenue",
    "report",
    "purchase",
    "purchase-category",
    "kot",
    "transaction",
    "payment-integration",
    "trash",
    "profile",
  ],
  endpoints: () => ({}),
});
