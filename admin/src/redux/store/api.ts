import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getToken } from "../../utils/tokenHandler";
import { BACKEND_BASE_URL } from "../../constants";

const baseQuery = fetchBaseQuery({
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
    return headers;
  },
});

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
    "purchase",
    "purchase-category",
    "kot",
    "transaction",
  ],
  endpoints: () => ({}),
});
