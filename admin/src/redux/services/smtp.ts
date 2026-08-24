import { api } from "../store/api";

const smtpApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createSmtp: builder.mutation({
      query: (body) => ({
        url: `smtp`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["smtp"],
    }),
    getSmtp: builder.query({
      query: () => `smtp/`,
      providesTags: ["smtp"],
    }),
    updateSmtp: builder.mutation({
      query: (body) => ({
        url: "smtp",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["smtp"],
    }),
  }),
  overrideExisting: true,
});

export const { useCreateSmtpMutation, useGetSmtpQuery, useUpdateSmtpMutation } =
  smtpApi;
