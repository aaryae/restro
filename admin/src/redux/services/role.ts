import { PaginationQueryParams } from "@/types/commonTypes";
import { RolesResponse } from "../../types/roleType";
import { api } from "../store/api";

const roleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createRole: builder.mutation({
      query: (body) => ({
        url: "roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["role"],
    }),
    getRole: builder.query<RolesResponse, PaginationQueryParams>({
      query: (query) => {
        const params = new URLSearchParams({
          page: String(query?.page),
          limit: String(query.limit),
        });
        if (query.title) {
          params.append("title", query.title);
        }
        return `roles/list?${params.toString()}`;
      },
      providesTags: ["role"],
    }),
    getRoleById: builder.query({
      query: (id) => `roles/${id}`,
      providesTags: ["role"],
    }),
    updateRole: builder.mutation({
      query: ({ body, id }) => ({
        url: `roles/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["role"],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({
        url: `roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["role"],
    }),
    listAllRoles: builder.query({
      query: () => `access-module/role-menu-action/list?limit=25`,
    }),
    listAccessModule: builder.query({
      query: () => `access-module`,
    }),
    listAccessModuleById: builder.query({
      query: (id) => `access-module/${id}`,
    }),
    findRoleMenuActions: builder.query({
      query: (id) => `access-module/role-menu-action/${id}`,
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateRoleMutation,
  useGetRoleQuery,
  useGetRoleByIdQuery,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useListAllRolesQuery,
  useListAccessModuleQuery,
  useListAccessModuleByIdQuery,
  useFindRoleMenuActionsQuery,
} = roleApi;
