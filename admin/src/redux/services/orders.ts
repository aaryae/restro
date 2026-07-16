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
      invalidatesTags: ["table", "order", "kot"],
    }),
    updateOrder: builder.mutation({
      query: ({ body, id }) => ({
        url: `${ORDER_URL}items/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["table", "order", "kot"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ body, id }) => ({
        url: `${ORDER_URL}status/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["table", "order"],
    }),
    checkoutOrder: builder.mutation({
      query: ({ body, id }) => ({
        url: `${ORDER_URL}checkout/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["table", "order", "revenue", "kot"],
    }),
    moveOrderItems: builder.mutation({
      query: ({ body }) => ({
        url: `${ORDER_URL}move-order-items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["table", "order", "revenue", "kot"],
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
