import { api } from "../store/api";

const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createProduct: builder.mutation({
      query: (body) => ({
        url: "product",
        method: "POST",
        body,
      }),
      invalidatesTags: ["product"],
    }),
    listAllProduct: builder.query({
      query: ({ page, limit }) => `product/list?page=${page}&limit=${limit}`,
      providesTags: ["product"],
    }),
    getProductById: builder.query({
      query: (id) => `product/${id}`,
      providesTags: ["product"],
    }),
    updateProductById: builder.mutation({
      query: ({ body, id }) => ({
        url: `product/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["product"],
    }),
    deleteProductById: builder.mutation({
      query: (id) => ({
        url: `product/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["product", "trash"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateProductMutation,
  useGetProductByIdQuery,
  useListAllProductQuery,
  useUpdateProductByIdMutation,
  useDeleteProductByIdMutation,
} = productApi;
