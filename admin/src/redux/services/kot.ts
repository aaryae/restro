import { KOT_URL } from "@/constants/apiUrlConstants";
import { api } from "../store/api";

const kotApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateKot: builder.mutation({
      query: ({ body, id }) => ({
        url: `${KOT_URL}${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["table", "order", "kot"],
    }),
  }),
  overrideExisting: true,
});

export const { useUpdateKotMutation } = kotApi;
