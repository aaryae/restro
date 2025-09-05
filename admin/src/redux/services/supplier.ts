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
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["supplier"],
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
