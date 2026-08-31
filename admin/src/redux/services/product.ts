import { api } from "../store/api";

export type ImportRowStatus = "created" | "ready" | "skipped" | "failed";

export interface ImportRowResult {
  rowNumber: number;
  name: string;
  status: ImportRowStatus;
  message: string;
}

export interface ImportProductsResponse {
  success: boolean;
  msg?: string;
  status?: number;
  data: {
    dryRun: boolean;
    totalRows: number;
    created: number;
    skipped: number;
    failed: number;
    createdCategories: string[];
    rows: ImportRowResult[];
  } | null;
}

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
    importProducts: builder.mutation<
      ImportProductsResponse,
      { file: File; dryRun?: boolean; createMissingCategories?: boolean }
    >({
      query: ({ file, dryRun = false, createMissingCategories = true }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("dryRun", String(dryRun));
        formData.append(
          "createMissingCategories",
          String(createMissingCategories),
        );
        return {
          url: "product/import",
          method: "POST",
          body: formData,
          // Signals the base query to drop content-type so the browser can
          // set the multipart boundary itself.
          headers: { "Content-Type": "multipart/form" },
        };
      },
      // A validation pass must not wipe the cached list.
      invalidatesTags: (_result, _error, arg) =>
        arg.dryRun ? [] : ["product", "product-category"],
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
  useImportProductsMutation,
} = productApi;
