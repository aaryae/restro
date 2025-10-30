import { api } from "../store/api";
import { FLOOR_URL } from "@/constants/apiUrlConstants";

const floorApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createFloor: builder.mutation({
      query: ({ body }) => ({
        url: `${FLOOR_URL}create`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["table", "order", "floor"],
    }),
    updateFloor: builder.mutation({
      query: ({
        id,
        status,
      }: {
        id: number;
        status: "active" | "inactive";
      }) => ({
        url: `${FLOOR_URL}${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["table", "floor", "order"],
    }),
    deleteFloor: builder.mutation({
      query: (id) => ({
        url: `${FLOOR_URL}${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["table", "order", "floor"],
    }),
    getFloor: builder.query({
      query: () => `${FLOOR_URL}`,
      providesTags: ["table", "order", "floor"],
    }),
  }),
});

export const {
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,
  useGetFloorQuery,
} = floorApi;
