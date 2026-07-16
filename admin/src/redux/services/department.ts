import { api } from "../store/api";

const departmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createDepartment: builder.mutation({
      query: (body) => ({
        url: "department",
        method: "POST",
        body,
      }),
      invalidatesTags: ["department"],
    }),
    listAllDepartments: builder.query({
      query: ({ page, limit }) => `department/list?page=${page}&limit=${limit}`,
      providesTags: ["department"],
    }),
    getDepartmentById: builder.query({
      query: (id) => `department/${id}`,
      providesTags: ["department"],
    }),
    updateDepartmentById: builder.mutation({
      query: ({ body, id }) => ({
        url: `department/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["department"],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `department/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["department", "trash"],
    }),
    createCliparts: builder.mutation({
      query: (body) => ({
        url: `clip-art`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["cliparts", "department"],
    }),
    listAllCliparts: builder.query({
      query: () => `clip-art/list`,
      providesTags: ["cliparts", "department"],
    }),
    getClipartById: builder.query({
      query: (id) => `clip-art/${id}`,
      providesTags: ["cliparts"],
    }),
    updateClipartById: builder.mutation({
      query: ({ body, id }) => ({
        url: `clip-art/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["cliparts", "department"],
    }),
    deleteClipartById: builder.mutation({
      query: (id) => ({
        url: `clip-art/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["cliparts", "department"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateDepartmentMutation,
  useListAllDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useUpdateDepartmentByIdMutation,
  useDeleteDepartmentMutation,
  useCreateClipartsMutation,
  useListAllClipartsQuery,
  useGetClipartByIdQuery,
  useUpdateClipartByIdMutation,
  useDeleteClipartByIdMutation,
} = departmentApi;
