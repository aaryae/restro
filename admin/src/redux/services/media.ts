import { api } from "../store/api";

const mediaApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createMediaCategory: builder.mutation({
      query: (body) => ({
        url: "media-category",
        method: "POST",
        body,
      }),
      invalidatesTags: ["media-category"],
    }),
    listAllMedia: builder.query({
      query: (pageNumber) =>
        `media-category/list?limit=10${pageNumber ? `&page=${pageNumber}` : ""}`,
      providesTags: ["media-category"],
    }),
    getMediaById: builder.query({
      query: (id) => `media-category/${id}`,
      providesTags: ["media-category", "media"],
    }),
    updateMediaCategoryById: builder.mutation({
      query: ({ body, id }) => ({
        url: `media-category/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["media-category"],
    }),
    deleteMediaCategory: builder.mutation({
      query: (id) => ({
        url: `media-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["media-category"],
    }),
    uploadMedia: builder.mutation({
      query: (body) => ({
        url: "media",
        method: "POST",
        body,
        headers: {
          "Content-Type": "multipart/form",
        },
      }),
      invalidatesTags: ["media"],
    }),
    uploadVideo: builder.mutation({
      query: (body) => ({
        url: "media/upload-video",
        method: "POST",
        body,
        headers: {
          "Content-Type": "multipart/form",
        },
      }),
      invalidatesTags: ["media"],
    }),
    getMediaByCategory: builder.query({
      query: ({ id, pageNumber }) =>
        `media/list?mediaCategoryId=${id}${
          pageNumber ? `&limit=10&page=${pageNumber}` : ""
        }`,
      providesTags: ["media"],
    }),
    renameMedia: builder.mutation({
      query: ({ body, id }) => ({
        url: `media/change-name/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["media"],
    }),
    deleteMedia: builder.mutation({
      query: (id) => ({
        url: `media/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["media"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateMediaCategoryMutation,
  useListAllMediaQuery,
  useGetMediaByIdQuery,
  useUpdateMediaCategoryByIdMutation,
  useDeleteMediaCategoryMutation,
  useUploadMediaMutation,
  useUploadVideoMutation,
  useGetMediaByCategoryQuery,
  useRenameMediaMutation,
  useDeleteMediaMutation,
} = mediaApi;
