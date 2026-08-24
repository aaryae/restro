import { api } from "../store/api";

const seoApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSeo: builder.mutation({
      query: (body) => ({
        url: "seo",
        method: "POST",
        body,
      }),
      invalidatesTags: ["seo"],
    }),
    listAllSeo: builder.query({
      query: ({ page, limit }) => `seo/list?page=${page}&limit=${limit}`,
      providesTags: ["seo"],
    }),
    getSeoById: builder.query({
      query: (id) => `seo/${id}`,
      providesTags: ["seo"],
    }),
    updateSeoById: builder.mutation({
      query: ({ body, id }) => ({
        url: `seo/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["seo"],
    }),
    deleteSeo: builder.mutation({
      query: (id) => ({
        url: `seo/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["seo"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateSeoMutation,
  useListAllSeoQuery,
  useGetSeoByIdQuery,
  useUpdateSeoByIdMutation,
  useDeleteSeoMutation,
} = seoApi;
