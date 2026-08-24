import { api } from "../store/api";

const productCategoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createProductCategory: builder.mutation({
      query: (body) => ({
        url: "product-category",
        method: "POST",
        body,
      }),
      invalidatesTags: ["product-category"],
    }),
    listAllProductCategory: builder.query({
      query: ({ page, limit }) =>
        `product-category/list?page=${page}&limit=${limit}`,
      providesTags: ["product-category"],
    }),
    getProductCategoryById: builder.query({
      query: (id) => `product-category/${id}`,
      providesTags: ["product-category"],
    }),
    updateProductCategoryById: builder.mutation({
      query: ({ body, id }) => ({
        url: `product-category/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["product-category"],
    }),
    deleteProductCategoryById: builder.mutation({
      query: (id) => ({
        url: `product-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["product-category", "trash"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateProductCategoryMutation,
  useGetProductCategoryByIdQuery,
  useListAllProductCategoryQuery,
  useUpdateProductCategoryByIdMutation,
  useDeleteProductCategoryByIdMutation,
} = productCategoryApi;
