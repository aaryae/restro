import { api } from "../store/api";

const purchaseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPurchase: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        return [{ type: tag[0] }];
      },
    }),

    getPurchaseList: builder.query({
      query: ({ url }) => url,
      providesTags: (_, __, args) => {
        const tag = typeof args === "string" ? args.split("/") : args.url.split("/");
        return [{ type: tag[0] }];
      },
    }),

    getPurchaseById: builder.query({
      query: (id: number | string) => `purchase/${id}`,
      providesTags: ["purchase"],
    }),

    updatePurchaseById: builder.mutation({
      query: ({ url, body }) => ({
        url,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_, __, { url }) => {
        const tag = url.split("/");
        return [{ type: tag[0] }];
      },
    }),

    completePurchaseById: builder.mutation({
      query: (id: number | string) => ({
        url: `purchase/${id}/complete`,
        method: "PUT",
        body: {},
      }),
      invalidatesTags: ["purchase"],
    }),

    payPurchaseById: builder.mutation({
      query: (id: number | string) => ({
        url: `purchase/${id}/pay`,
        method: "PUT",
        body: {},
      }),
      invalidatesTags: ["purchase"],
    }),

    cancelPurchaseById: builder.mutation({
      query: (id: number | string) => ({
        url: `purchase/${id}/cancel`,
        method: "PUT",
        body: {},
      }),
      invalidatesTags: ["purchase"],
    }),

    getUnpaidCredits: builder.query({
      query: ({ url }) => url,
      providesTags: ["purchase"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreatePurchaseMutation,
  useGetPurchaseListQuery,
  useGetPurchaseByIdQuery,
  useUpdatePurchaseByIdMutation,
  useCompletePurchaseByIdMutation,
  usePayPurchaseByIdMutation,
  useCancelPurchaseByIdMutation,
  useGetUnpaidCreditsQuery,
} = purchaseApi;
