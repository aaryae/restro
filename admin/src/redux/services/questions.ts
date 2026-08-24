import { api } from "../store/api";

const questionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createQuestion: builder.mutation({
      query: (body) => ({
        url: "qna",
        method: "POST",
        body,
      }),
      invalidatesTags: ["question", "interview"],
    }),
    updateQuestionById: builder.mutation({
      query: ({ body, id }) => ({
        url: `qna/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["question", "interview"],
    }),
    deleteQuestionById: builder.mutation({
      query: (id) => ({
        url: `qna/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["question"],
    }),
    createTimeTableHeading: builder.mutation({
      query: (body) => ({
        url: "time-table-header",
        method: "POST",
        body,
      }),
      invalidatesTags: ["question", "interview"],
    }),
    getTimeTableHeadingById: builder.query({
      query: (id) => `time-table-header/${id}`,
      providesTags: ["question"],
    }),
    updateTimeTableHeader: builder.mutation({
      query: ({ body, id }) => ({
        url: `time-table-header/updates/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["question", "interview"],
    }),
    deleteTimeTableHeader: builder.mutation({
      query: (id) => ({
        url: `time-table-header/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["question", "interview"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateQuestionMutation,
  useUpdateQuestionByIdMutation,
  useDeleteQuestionByIdMutation,
  useCreateTimeTableHeadingMutation,
  useGetTimeTableHeadingByIdQuery,
  useUpdateTimeTableHeaderMutation,
  useDeleteTimeTableHeaderMutation,
} = questionApi;
