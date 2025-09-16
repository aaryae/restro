import { api } from "../store/api";
import { ACCOUNT_URL } from "@/constants/apiUrlConstants";

const accountApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createAccount: builder.mutation({
      query: ({ body }) => ({
        url: `${ACCOUNT_URL}create`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["account"],
    }),
    updateAccount: builder.mutation({
      query: ({ body, id }) => ({
        url: `${ACCOUNT_URL}${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["account"],
    }),
    deleteAccount: builder.mutation({
      query: (id) => ({
        url: `${ACCOUNT_URL}${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["account"],
    }),
    getAccount: builder.query({
      query: () => `${ACCOUNT_URL}`,
      providesTags: ["account"],
    }),
  }),
});

export const {
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useGetAccountQuery,
} = accountApi;
