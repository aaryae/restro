import { FolderOpen, Hash, Loader2 } from "lucide-react";
import { useGetProductCategoryByIdQuery } from "@/redux/services/productCategory";

export default function ListCategoryDetails({ id }: { id: number | null }) {
  const { data: productCategory, isLoading, isFetching } =
    useGetProductCategoryByIdQuery(id, {
      skip: id == null,
    });

  const category = productCategory?.data;
  const loading = isLoading || isFetching;

  if (id == null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FolderOpen size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">No category selected</p>
          <p className="mt-1 text-sm text-slate-500">
            Choose an item category first, then tap Show.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-200/80 pb-5 pr-12">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Category
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Item Category Detail
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Read-only details for the selected category.
        </p>
      </header>

      <div className="mt-6 flex-1">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading category…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primaryColor shadow-sm ring-1 ring-slate-200/80">
                  <FolderOpen size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Name
                  </p>
                  <p className="mt-1 break-words text-base font-semibold text-slate-900">
                    {category?.name || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200/80">
                  <Hash size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Slug
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-slate-700">
                    {category?.slug || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
