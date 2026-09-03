import { api } from "../store/api";

export type ImportRowStatus = "created" | "ready" | "skipped" | "failed";

export interface ImportRowResult {
  rowNumber: number;
  name: string;
  status: ImportRowStatus;
  message: string;
}

export interface ImportStockItemsResponse {
  success: boolean;
  msg?: string;
  status?: number;
  data: {
    dryRun: boolean;
    totalRows: number;
    created: number;
    skipped: number;
    failed: number;
    createdGroups: string[];
    rows: ImportRowResult[];
  } | null;
}

const stockItemApi = api.injectEndpoints({
  endpoints: (builder) => ({
    importStockItems: builder.mutation<
      ImportStockItemsResponse,
      { file: File; dryRun?: boolean; createMissingGroups?: boolean }
    >({
      query: ({ file, dryRun = false, createMissingGroups = true }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("dryRun", String(dryRun));
        formData.append("createMissingGroups", String(createMissingGroups));
        return {
          url: "stock-item/import",
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form" },
        };
      },
      invalidatesTags: (_result, _error, arg) =>
        arg.dryRun ? [] : ["stock-item", "stock-group", "stock-history"],
    }),
  }),
  overrideExisting: true,
});

export const { useImportStockItemsMutation } = stockItemApi;
