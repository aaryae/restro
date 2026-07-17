import { api } from "../store/api";

const crudApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        const type = tag[0];
        // Restore should refresh trash list; other creates may archive nothing
        if (type === "trash") return ["trash"];
        return [{ type }];
      },
    }),

    getApi: builder.query({
      query: ({ url, page = 1, limit = 10 }) => url,
      providesTags: (_, __, args) => {
        const tag =
          typeof args === "string" ? args.split("/") : args.url.split("/");
        return [{ type: tag[0] }];
      },
    }),
    updateApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        return [{ type: tag[0] }];
      },
    }),
    patchApi: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        return [{ type: tag[0] }];
      },
    }),
    deleteApi: builder.mutation({
      query: (url) => ({
        url,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, args) => {
        const tag = String(args).split("/");
        const type = tag[0];
        // Most deletes archive to Recently Deleted — keep that list fresh
        if (type === "trash") return ["trash"];
        return [{ type }, "trash"];
      },
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
