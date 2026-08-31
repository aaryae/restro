import { api } from "../store/api";

const BALANCE_AFFECTING_TYPES = new Set(["expense", "revenue", "transaction"]);

const getResourceType = (url: string) => url.split(/[/?]/)[0];

const getMutationInvalidationTags = (
  url: string,
  extraTags: Array<string | { type: string }> = [],
) => {
  const type = getResourceType(url);
  if (type === "trash") return ["trash"];
  const tags: Array<string | { type: string }> = [{ type }, ...extraTags];
  if (BALANCE_AFFECTING_TYPES.has(type)) {
    tags.push("account");
  }
  if (type === "revenue" || type === "report") {
    tags.push("revenue", "report");
  }
  return tags;
};

const getQueryProvidesTags = (url: string) => {
  const type = getResourceType(url);
  const tags: Array<string | { type: string }> = [{ type }];
  if (type === "report") {
    tags.push("revenue");
  }
  return tags;
};

const crudApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { url }) => getMutationInvalidationTags(url),
    }),

    getApi: builder.query({
      query: ({ url, page = 1, limit = 10 }) => url,
      providesTags: (_, __, args) => {
        const url = typeof args === "string" ? args : args.url;
        return getQueryProvidesTags(url);
      },
    }),
    updateApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_, __, { url }) => getMutationInvalidationTags(url),
    }),
    patchApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_, __, { url }) => getMutationInvalidationTags(url),
    }),
    deleteApi: builder.mutation({
      query: (url) => ({
        url,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, args) =>
        getMutationInvalidationTags(String(args), ["trash"]),
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateApiMutation,
  useGetApiQuery,
  useLazyGetApiQuery,
  useUpdateApiMutation,
  useDeleteApiMutation,
  usePatchApiMutation,
} = crudApi;
