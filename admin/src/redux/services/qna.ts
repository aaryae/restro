import { api } from "../store/api";

const qnaApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createQna: builder.mutation({
      query: (body) => ({
        url: "faq",
        method: "POST",
        body,
      }),
      invalidatesTags: ["faq"],
    }),
    listAllQna: builder.query({
      query: ({ page, limit }) => `faq/list?page=${page}&limit=${limit}`,
      providesTags: ["faq"],
    }),
    getQnaById: builder.query({
      query: (id) => `faq/${id}`,
      providesTags: ["faq"],
    }),
    updateQnaById: builder.mutation({
      query: ({ body, id }) => ({
        url: `faq/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["faq"],
    }),
    deleteQnaById: builder.mutation({
      query: (id) => ({
        url: `faq/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["faq"],
    }),
    updateQnaOrder: builder.mutation({
      query: (body) => ({
        url: `faq`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["faq"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateQnaMutation,
  useUpdateQnaByIdMutation,
  useDeleteQnaByIdMutation,
  useListAllQnaQuery,
  useGetQnaByIdQuery,
  useUpdateQnaOrderMutation,
} = qnaApi;
