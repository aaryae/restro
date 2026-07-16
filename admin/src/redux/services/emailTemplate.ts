import { api } from "../store/api";

const emailTemplateApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createEmailTemplate: builder.mutation({
      query: (body) => ({
        url: "email-template",
        method: "POST",
        body,
      }),
      invalidatesTags: ["email-template"],
    }),
    listAllEmailTemplate: builder.query({
      query: ({ page, limit }) =>
        `email-template/list?page=${page}&limit=${limit}`,
      providesTags: ["email-template"],
    }),
    getEmailTemplateById: builder.query({
      query: (id) => `email-template/${id}`,
      providesTags: ["email-template"],
    }),
    updateEmailTemplateById: builder.mutation({
      query: ({ body, id }) => ({
        url: `email-template/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["email-template"],
    }),
    deleteEmailTemplate: builder.mutation({
      query: (id) => ({
        url: `email-template/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["email-template", "trash"],
    }),
    activeEmailTemplate: builder.mutation({
      query: (body) => ({
        url: "active-email-template",
        method: "POST",
        body,
      }),
      invalidatesTags: ["email-template"],
    }),
    // this is get request still is mutation because this api needs to be triggered instead of hitting directly
    listActiveEmailTemplate: builder.mutation({
      query: (templateKey) => `email-template/list?templateKey=${templateKey}`,
      invalidatesTags: ["email-template"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateEmailTemplateMutation,
  useListAllEmailTemplateQuery,
  useGetEmailTemplateByIdQuery,
  useDeleteEmailTemplateMutation,
  useUpdateEmailTemplateByIdMutation,
  useActiveEmailTemplateMutation,
  useListActiveEmailTemplateMutation,
} = emailTemplateApi;
