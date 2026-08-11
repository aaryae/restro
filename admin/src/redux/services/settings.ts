import { api } from "../store/api";

const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    updateSetting: builder.mutation({
      query: ({ body, id }) =>
        id
          ? {
              url: `company-setting/${id}`,
              method: "PUT",
              body,
            }
          : {
              url: `company-setting/`,
              method: "POST",
              body,
            },
      invalidatesTags: ["setting"],
    }),
    getSetting: builder.query({
      query: () => `company-setting/`,
      providesTags: ["setting"],
    }),
    getSingleSetting: builder.query({
      query: (id) => `company-setting/${id}`,
      providesTags: ["setting"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useUpdateSettingMutation,
  useGetSettingQuery,
  useGetSingleSettingQuery,
} = settingsApi;
