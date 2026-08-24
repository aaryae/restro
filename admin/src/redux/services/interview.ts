import { api } from "../store/api";

const interviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createInterview: builder.mutation({
      query: (body) => ({
        url: "employee",
        method: "POST",
        body,
      }),
      invalidatesTags: ["interview"],
    }),
    listAllInterview: builder.query({
      query: ({ page, limit }) => `employee/list?page=${page}&limit=${limit}`,
      providesTags: ["interview"],
    }),
    getInterviewById: builder.query({
      query: (id) => `employee/${id}`,
      providesTags: ["interview"],
    }),
    updateInterviewById: builder.mutation({
      query: ({ body, id }) => ({
        url: `employee/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["interview"],
    }),
    deleteInterview: builder.mutation({
      query: (id) => ({
        url: `employee/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["interview"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateInterviewMutation,
  useListAllInterviewQuery,
  useGetInterviewByIdQuery,
  useUpdateInterviewByIdMutation,
  useDeleteInterviewMutation,
} = interviewApi;
