import { api } from "../store/api";

const transferApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createTransfer: builder.mutation<
      { message: string },
      {
        fromAccountId: number;
        toAccountId: number;
        userId: number;
        amount: number;
        remarks?: string;
      }
    >({
      query: (body) => ({
        url: `transfer/`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["account", "transfer"],
    }),
  }),
  overrideExisting: true,
});

export const { useCreateTransferMutation } = transferApi;
