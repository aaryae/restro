import { api } from "../store/api";

const transactionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createTransaction: builder.mutation<
      { message: string },
      {
        accountId: number;
        amount: number;
        remarks?: string;
      }
    >({
      query: (body) => ({
        url: `transaction/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["account", "transaction"],
    }),
  }),
  overrideExisting: true,
});

export const { useCreateTransactionMutation } = transactionApi;
