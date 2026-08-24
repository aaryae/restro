import { api } from "../store/api";

const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationList: builder.query({
      query: ({ page, limit, isRead }) =>
        `notification/list?page=${page}&limit=${limit}${
          isRead !== null ? `&isRead=${isRead}` : ""
        }`,
      providesTags: ["notification"],
    }),
    changeStatusToRead: builder.mutation({
      query: (id) => ({
        url: `notification/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["notification"],
    }),
  }),
  overrideExisting: true,
});

export const { useGetNotificationListQuery, useChangeStatusToReadMutation } =
  notificationApi;
