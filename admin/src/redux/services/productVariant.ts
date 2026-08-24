import { api } from "../store/api";

const productVariantApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createProductVariant: builder.mutation({
      query: (body) => ({
        url: "product-variant",
        method: "POST",
        body,
      }),
      invalidatesTags: ["product-variant"],
    }),
    listAllProductVariant: builder.query({
      query: ({ page, limit }) =>
        `product-variant/list?page=${page}&limit=${limit}`,
      providesTags: ["product-variant"],
    }),
    getProductVariantById: builder.query({
      query: (id) => `product-variant/${id}`,
      providesTags: ["product-variant"],
    }),
    updateProductVariantById: builder.mutation({
      query: ({ body, id }) => ({
        url: `product-variant/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["product-variant"],
    }),
    deleteProductVariantById: builder.mutation({
      query: (id) => ({
        url: `product-variant/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["product-variant"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListAllProductVariantQuery,
  useCreateProductVariantMutation,
  useGetProductVariantByIdQuery,
  useUpdateProductVariantByIdMutation,
  useDeleteProductVariantByIdMutation,
} = productVariantApi;
