import { ORDER_URL } from "@/constants/apiUrlConstants";
import { api } from "../store/api";

const ordersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: ({ body }) => ({
        url: `${ORDER_URL}create`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["table", "order", "kot", "report", "revenue"],
    }),
    updateOrder: builder.mutation({
      query: ({ body, id }) => ({
        url: `${ORDER_URL}items/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["table", "order", "kot", "report", "revenue"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ body, id }) => ({
        url: `${ORDER_URL}status/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["table", "order", "report", "revenue"],
    }),
    checkoutOrder: builder.mutation({
      query: ({ body, id }) => ({
        url: `${ORDER_URL}checkout/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["table", "order", "revenue", "report", "kot", "account"],
    }),
    moveOrderItems: builder.mutation({
      query: ({ body }) => ({
        url: `${ORDER_URL}move-order-items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["table", "order", "revenue", "report", "kot", "account"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCheckoutOrderMutation,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUpdateOrderStatusMutation,
  useMoveOrderItemsMutation,
} = ordersApi;
