import { api } from "../store/api";

const supplierApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSupplier: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        return [{ type: tag[0] }];
      },
    }),

    getListAllSupplier: builder.query({
      query: ({ url, page = 1, limit = 10 }) => url,
      providesTags: (_, __, args) => {
        const tag =
          typeof args === "string" ? args.split("/") : args.url.split("/");
        return [{ type: tag[0] }];
      },
    }),

    getSupplierById: builder.query({
      query: (id) => `supplier/${id}`,
      providesTags: ["supplier"],
    }),

    updateSupplierById: builder.mutation({
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
    deleteSupplierById: builder.mutation({
      // Call sites pass paths like "supplier/5" (relative to /api/v1/).
      // A leading "/" would resolve against the host root and drop /api/v1.
      query: (id: string | number) => ({
        url: String(id).replace(/^\//, ""),
        method: "DELETE",
      }),
      invalidatesTags: ["supplier", "trash"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateSupplierMutation,
  useGetSupplierByIdQuery,
  useGetListAllSupplierQuery,
  useUpdateSupplierByIdMutation,
  useDeleteSupplierByIdMutation,
} = supplierApi;
