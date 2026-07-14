import { useMemo, useState } from "react";
import { format } from "date-fns";
import { RotateCcw, Trash2 } from "lucide-react";
import Table from "@/components/Table";
import Loader from "@/components/Loader";
import usePagination from "@/hooks/usePagination";
import { TRASH_URL } from "@/constants/apiUrlConstants";
import {
  useGetApiQuery,
  useDeleteApiMutation,
  useCreateApiMutation,
} from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import Select from "@/components/Select";

type TrashItem = {
  id: number;
  resourceType: string;
  resourceLabel?: string;
  resourceId: number;
  displayName: string;
  deletedByName?: string | null;
  createdAt: string;
  expiresAt?: string | null;
};

const FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "product", label: "Product" },
  { value: "product_category", label: "Product Category" },
  { value: "customer", label: "Customer" },
  { value: "supplier", label: "Supplier" },
  { value: "addon", label: "Addon" },
  { value: "open_item", label: "Open Item" },
  { value: "department", label: "Department" },
  { value: "floor", label: "Floor" },
  { value: "table", label: "Table" },
  { value: "expense_category", label: "Expense Category" },
  { value: "purchase_category", label: "Purchase Category" },
  { value: "email_template", label: "Email Template" },
];

export default function RecentlyDeleted() {
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [resourceType, setResourceType] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(query.page));
    params.set("limit", String(query.limit));
    if (resourceType) params.set("resourceType", resourceType);
    return `${TRASH_URL}list?${params.toString()}`;
  }, [query.page, query.limit, resourceType]);

  const { data, isLoading, isFetching, refetch } = useGetApiQuery({ url });
  const [restoreItem] = useCreateApiMutation();
  const [deleteItem] = useDeleteApiMutation();

  const rows: TrashItem[] = data?.data?.data || [];
  const pagination = {
    page: data?.data?.page ?? query.page,
    limit: data?.data?.limit ?? query.limit,
    total: data?.data?.total ?? 0,
    totalPages: data?.data?.totalPages ?? 1,
  };

  const handleRestore = async (id: number) => {
    setBusyId(id);
    try {
      const res = await restoreItem({
        url: `${TRASH_URL}restore/${id}`,
        body: {},
      }).unwrap();
      handleResponse({
        res,
        successMessage: "Item restored",
        onSuccess: () => refetch(),
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async (id: number) => {
    if (
      !window.confirm(
        "Permanently delete this item? This cannot be undone.",
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      const res = await deleteItem(`${TRASH_URL}${id}`).unwrap();
      handleResponse({
        res,
        successMessage: "Permanently deleted",
        onSuccess: () => refetch(),
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setBusyId(null);
    }
  };

  const tableData = rows.map((item) => [
    item.resourceLabel || item.resourceType,
    item.displayName,
    item.createdAt
      ? format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")
      : "—",
    item.expiresAt
      ? format(new Date(item.expiresAt), "yyyy-MM-dd")
      : "—",
    item.deletedByName || "—",
    <div key={item.id} className="flex items-center justify-center gap-2">
      <button
        type="button"
        title="Restore"
        disabled={busyId === item.id}
        onClick={() => handleRestore(item.id)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
      >
        <RotateCcw size={15} />
      </button>
      <button
        type="button"
        title="Delete permanently"
        disabled={busyId === item.id}
        onClick={() => handlePermanentDelete(item.id)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
      >
        <Trash2 size={15} />
      </button>
    </div>,
  ]);

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            Recently Deleted
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Recover items deleted by mistake. Items are kept for 30 days, then
            permanently removed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[200px]">
            <Select
              value={resourceType}
              options={FILTER_OPTIONS}
              onValueChange={(next) => {
                setResourceType(String(next ?? ""));
                handlePagination({ ...query, page: 1 });
              }}
              placeholder="Filter by type"
            />
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Reload
          </button>
        </div>
      </div>

      <Table
        headers={[
          "Type",
          "Name",
          "Deleted at",
          "Expires",
          "Deleted by",
          "Actions",
        ]}
        data={tableData}
        pagination={pagination}
        isSN
        handlePagination={handlePagination}
      />
    </div>
  );
}
