import {
  ApiResponse,
  GetAllUserRequestType,
} from "../../types/authenticationType";
import { api } from "../store/api";
const authenticationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
        isDeleted: false,
      }),
    }),
    logout: builder.mutation({
      query: (body) => ({
        url: "auth/logout",
        method: "POST",
        body,
      }),
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: "auth/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["users"],
    }),
    getAllUser: builder.query<ApiResponse, GetAllUserRequestType>({
      query: (query) => {
        const params = new URLSearchParams({
          isDeleted: "false",
          page: String(query.page),
          limit: String(query.limit),
        });
        if (query.username) {
          params.append("username", query.username);
        }
        return `auth/list?${params.toString()}`;
      },
      providesTags: ["users"],
    }),
    getUserById: builder.query({
      query: (id) => `auth/${id}`,
      providesTags: ["users"],
    }),
    updateUser: builder.mutation({
      query: ({ body, id }) => ({
        url: `auth/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["users"],
    }),
    getProfile: builder.query({
      query: () => `auth/profile`,
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: `auth/change-password`,
        method: "PUT",
        body,
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ body, id }) => ({
        url: `auth/reset-password/${id}`,
        method: "PUT",
        body,
      }),
    }),
    deleteUser: builder.mutation({
      query: ({ body, id }) => ({
        url: `auth/${id}`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["users"],
    }),
    getAllCount: builder.query({
      query: () => `auth/getTotalOfManyModel`,
    }),

    getAllAccessToApprove: builder.query({
      query: ({ status, pageNumber }) =>
        `action-request/list?page=${pageNumber}&limit=5${
          status === null ? "" : `&status=${status}`
        }`,
      providesTags: ["notification"],
    }),
    getAllRelatedRequest: builder.query({
      query: ({ status, pageNumber }) =>
        `action-request/getRelatedRequest?page=${pageNumber}&limit=5${
          status === null ? "" : `&status=${status}`
        }`,
      providesTags: ["notification"],
    }),
    approvalDecision: builder.mutation({
      query: ({ body, id }) => ({
        url: `action-request/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["notification"],
    }),
  }),

  overrideExisting: true,
});

export const {
  useLoginMutation,
  useCreateUserMutation,
  useGetAllUserQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useGetProfileQuery,
  useChangePasswordMutation,
  useResetPasswordMutation,
  useDeleteUserMutation,
  useLogoutMutation,
  useGetAllCountQuery,
  useGetAllRelatedRequestQuery,
  useGetAllAccessToApproveQuery,
  useApprovalDecisionMutation,
} = authenticationApi;
