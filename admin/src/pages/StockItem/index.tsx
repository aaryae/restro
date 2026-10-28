import React, { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { EntityFormDialog } from "@/components/EntityForm";
import usePagination from "@/hooks/usePagination";
import { useFormModal } from "@/hooks/useFormModal";
import { PaginationType } from "@/types/commonTypes";
import {
  AlertTriangle,
  ArrowUpDown,
  Info,
  Merge,
  PackageMinus,
  PackagePlus,
  SquarePen,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import Select from "@/components/Select";
import { buildQueryString } from "@/utils/generalHelper";
import {
  useCreateApiMutation,
  useDeleteApiMutation,
  useGetApiQuery,
} from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { STOCK_ITEM_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import styles from "@/components/Table/index.module.css";

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "nameAsc", label: "Name A–Z" },
  { value: "nameDesc", label: "Name Z–A" },
  { value: "lowStockFirst", label: "Low stock first" },
  { value: "closingAsc", label: "Closing: low → high" },
  { value: "closingDesc", label: "Closing: high → low" },
  { value: "rateAsc", label: "Rate: low → high" },
  { value: "rateDesc", label: "Rate: high → low" },
  { value: "valueAsc", label: "Stock value: low → high" },
  { value: "valueDesc", label: "Stock value: high → low" },
  { value: "openingAsc", label: "Opening: low → high" },
  { value: "openingDesc", label: "Opening: high → low" },
];

const StockItemModal = lazy(() => import("./StockItemModal"));
const AdjustStockModal = lazy(() => import("./AdjustStockModal"));
const BulkUploadModal = lazy(() => import("./BulkUploadModal"));

const formatQty = (qty: number | string, symbol?: string) => {
  const n = Number(qty || 0).toFixed(2);
  return symbol ? `${n} ${symbol}` : n;
};

const formatMoney = (amount: number | string) =>
  `Rs ${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const isLowStockItem = (row: {
  quantity?: number | string | null;
  lowStockThreshold?: number | string | null;
}) => {
  if (row.lowStockThreshold == null || row.lowStockThreshold === "") {
    return false;
  }
  return Number(row.quantity || 0) <= Number(row.lowStockThreshold);
};

type SupplierBalance = {
  supplierId?: number | null;
  supplierName?: string | null;
  quantity?: number | string | null;
  quantityLabel?: string | null;
};

type SyncPrompt = {
  mode: "sync" | "undo";
  id: number;
  name: string;
  count: number;
};

const supplierLines = (balances: SupplierBalance[] | undefined, symbol?: string) => {
  const rows = balances || [];
  const unnamed = rows.find((row) => !row.supplierId);
  const named = rows.filter((row) => row.supplierId);
  const noneLabel = unnamed?.quantityLabel || formatQty(unnamed?.quantity || 0, symbol);
  return [
    `${noneLabel} is not from a supplier`,
    ...named.map((row) => {
      const label = row.quantityLabel || formatQty(row.quantity || 0, symbol);
      return `${label} is from ${row.supplierName || "this supplier"}`;
    }),
  ];
};

const supplierSummary = (balances: SupplierBalance[] | undefined, fallback?: string | null) => {
  const named = (balances || []).filter((row) => row.supplierId && Number(row.quantity || 0) > 0);
  if (named.length === 0) return fallback || "—";
  if (named.length === 1) return named[0].supplierName || fallback || "—";
  return `${named.length} suppliers`;
};

const SupplierNote = ({
  balances,
  symbol,
}: {
  balances?: SupplierBalance[];
  symbol?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const lines = supplierLines(balances, symbol);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-supplier-note]")) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("mousedown", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("mousedown", close);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        title={lines.join("\n")}
        aria-label="Supplier quantities"
        data-supplier-note
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          setPos({ top: rect.bottom + 6, left: Math.max(8, rect.right - 260) });
          setOpen((value) => !value);
        }}
      >
        <Info size={14} />
      </button>
      {open &&
        createPortal(
          <div
            className="fixed z-[80] w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg"
            style={{ top: pos.top, left: pos.left }}
            data-supplier-note
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Where this stock is from
            </p>
            <ul className="space-y-1.5">
              {lines.map((line) => (
                <li key={line} className="text-xs leading-snug text-slate-700">
                  {line}
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
};

const StockItem: React.FC = () => {
  const accessList = checkAccess("Stock Item");
  const canImport = accessList.includes("import");
  const canSync =
    accessList.includes("sync") ||
    accessList.includes("edit") ||
    accessList.includes("adjust");
  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [syncPrompt, setSyncPrompt] = useState<SyncPrompt | null>(null);
  const formModal = useFormModal();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await deleteApi(`${STOCK_ITEM_URL}${deleteId}`).unwrap();
      handleResponse({
        res: {
          success: true,
          msg: res?.message || "Stock item deleted successfully.",
        },
        onSuccess: () => {
          refetch();
          refetchSummary();
        },
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
      setDeleteId(null);
    }
  };

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const url = buildQueryString("stock-item/list", {
    page: query.page,
    limit: query.limit,
    search: {
      name: searchTerm,
      sortBy,
      ...(lowStockOnly ? { lowStock: true } : {}),
    },
  });
  const {
    data: apiData,
    isSuccess: success,
    refetch,
  } = useGetApiQuery({ url });
  const { data: summaryResp, refetch: refetchSummary } = useGetApiQuery({
    url: "stock-item/summary",
  });
  const [deleteApi] = useDeleteApiMutation();
  const [syncApi, { isLoading: syncing }] = useCreateApiMutation();

  const rows: any[] = success ? (apiData?.data?.data ?? []) : [];
  const summary = summaryResp?.data || {
    totalItems: 0,
    totalStockValue: 0,
    restockedThisWeek: 0,
    lowStockItems: 0,
  };

  const pagination: PaginationType = {
    page: apiData?.data?.total === 0 ? 0 : apiData?.data?.page,
    limit: apiData?.data?.limit,
    total: apiData?.data?.total,
    totalPages: apiData?.data?.totalPages,
  };

  const showActions =
    accessList.includes("edit") ||
    accessList.includes("delete") ||
    accessList.includes("adjust");

  const headers = [
    "Stock Item",
    "Rate",
    "Opening",
    "Closing",
    "Stock Value",
    "Supplier",
    showActions && "Actions",
  ].filter(Boolean) as string[];

  const openCreate = () => formModal.openAdd();
  const openEdit = (id: number) => formModal.openEdit(id);

  const openAdjust = (row: any) => {
    setAdjustItem(row);
    setAdjustOpen(true);
  };

  const closeAdjust = () => {
    setAdjustOpen(false);
    setAdjustItem(null);
  };

  const refreshAll = () => {
    refetch();
    refetchSummary();
  };

  const runSyncAction = async () => {
    if (!syncPrompt) return;
    const isUndo = syncPrompt.mode === "undo";
    try {
      const res = await syncApi({
        url: `${STOCK_ITEM_URL}${syncPrompt.id}/${isUndo ? "undo-sync" : "sync"}`,
        body: {},
      }).unwrap();
      handleResponse({
        res: {
          success: true,
          msg:
            res?.message ||
            res?.msg ||
            (isUndo
              ? `Undid sync for ${syncPrompt.name}.`
              : `Combined into ${syncPrompt.name}.`),
        },
        onSuccess: refreshAll,
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setSyncPrompt(null);
    }
  };

  const toggleLowStockFilter = () => {
    setLowStockOnly((prev) => !prev);
    handlePagination({ page: 1, limit: query.limit });
  };

  const mappedRows = rows.map((r: any) => {
    const symbol = r.measuringUnit?.symbol;
    const rate = Number(r.defaultPrice || 0);
    const closing = Number(r.quantity || 0);
    const lowStock = isLowStockItem(r);
    const sameNameCount = Number(r.sameNameCount || 1);
    const isNew = Boolean(r.isNewStock);
    const canUndo = Boolean(r.canUndoSync);
    const batchCount = Number(r.mergedBatchCount || 0);

    const showBatchPair = sameNameCount > 1;
    const cells = [
      <div className="inline-flex max-w-[18rem] items-center gap-2 whitespace-nowrap">
        {isNew ? (
          <span
            className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-sky-600"
            title="Newer stock — sold after the older row runs low"
          >
            New
          </span>
        ) : showBatchPair ? (
          <span
            className="shrink-0 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400"
            title="Older stock — sales use this row first"
          >
            Old
          </span>
        ) : null}
        <span
          className={`truncate text-sm font-semibold ${
            isNew ? "text-slate-500" : "text-slate-800"
          }`}
        >
          {isNew ? (
            <span className="mr-1.5 text-slate-300" aria-hidden>
              ↳
            </span>
          ) : null}
          {r.name}
        </span>
        {canSync && sameNameCount > 1 ? (
          <button
            type="button"
            disabled={syncing}
            onClick={() =>
              setSyncPrompt({
                mode: "sync",
                id: r.id,
                name: r.name || "this stock",
                count: sameNameCount,
              })
            }
            className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:opacity-50"
            title={`Combine ${sameNameCount} batches into the oldest row. Rate becomes the weighted average.`}
          >
            <Merge size={12} strokeWidth={2.25} />
            {sameNameCount}
          </button>
        ) : null}
        {canSync && canUndo ? (
          <button
            type="button"
            disabled={syncing}
            onClick={() =>
              setSyncPrompt({
                mode: "undo",
                id: r.id,
                name: r.name || "this stock",
                count: batchCount || 1,
              })
            }
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:opacity-50"
            title="Undo sync and restore separate batches"
          >
            <Undo2 size={12} strokeWidth={2.25} />
          </button>
        ) : null}
      </div>,
      <span className="text-slate-700">{formatMoney(rate)}</span>,
      <span className="text-slate-600" title={r.equivalence || undefined}>
        {r.openingLabel || formatQty(r.openingQuantity, symbol)}
      </span>,
      <span
        className="inline-flex items-center gap-2 whitespace-nowrap"
        title={
          lowStock
            ? `Low stock — at or below ${formatQty(r.lowStockThreshold, symbol)}${
                r.units?.length
                  ? ` · ${formatQty(closing, symbol)} total${r.equivalence ? ` · ${r.equivalence}` : ""}`
                  : ""
              }`
            : r.units?.length
              ? `${formatQty(closing, symbol)} total${r.equivalence ? ` · ${r.equivalence}` : ""}`
              : undefined
        }
      >
        <span
          className={
            lowStock
              ? "font-semibold text-[var(--serve-negative)]"
              : "font-medium text-slate-800"
          }
        >
          {r.quantityLabel || formatQty(closing, symbol)}
        </span>
        {lowStock ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_srgb,var(--serve-negative)_14%,transparent)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--serve-negative)]">
            <AlertTriangle size={12} strokeWidth={2.25} />
            Low stock
          </span>
        ) : null}
      </span>,
      <span className="text-slate-700">{formatMoney(closing * rate)}</span>,
      <span className="inline-flex items-center gap-1 text-slate-600">
        {supplierSummary(r.supplierBalances, r.supplier?.name)}
        <SupplierNote balances={r.supplierBalances} symbol={symbol} />
      </span>,
    ];

    if (showActions) {
      cells.push(
        <TableRowActions>
          {accessList.includes("adjust") && (
            <button
              type="button"
              onClick={() => openAdjust(r)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
              title="Adjust stock"
            >
              <PackagePlus size={14} />
            </button>
          )}
          {accessList.includes("edit") && (
            <button
              type="button"
              onClick={() => openEdit(r.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
              title="Edit stock item"
            >
              <SquarePen />
            </button>
          )}
          {accessList.includes("delete") && (
            <DeleteModal
              compact
              open={deleteModelOpen}
              setOpen={setDeleteModelOpen}
              itemId={r.id}
              activeId={deleteId}
              handleDeleteTrigger={() => handleDeleteTrigger(r.id)}
              handleConfirmDelete={handleDelete}
            />
          )}
        </TableRowActions>,
      );
    }

    return {
      cells,
      rowClassName: lowStock ? styles.lowStock : undefined,
    };
  });

  const data = mappedRows.map((row) => row.cells);
  const rowClassNames = mappedRows.map((row) => row.rowClassName);

  const kpiCards = [
    {
      id: "total",
      label: "Total Stock Items",
      value: String(summary.totalItems ?? 0),
      icon: <PackagePlus className="h-4 w-4 text-sky-600" />,
      clickable: false,
    },
    {
      id: "value",
      label: "Total Stock Value",
      value: formatMoney(summary.totalStockValue ?? 0),
      icon: <PackageMinus className="h-4 w-4 text-violet-600" />,
      clickable: false,
    },
    {
      id: "restocked",
      label: "Restocked this week",
      value: `${summary.restockedThisWeek ?? 0} item`,
      icon: <PackagePlus className="h-4 w-4 text-emerald-600" />,
      clickable: false,
    },
    {
      id: "low-stock",
      label: "Low Stock items",
      value: `${summary.lowStockItems ?? 0} item`,
      icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
      clickable: true,
      active: lowStockOnly,
      onClick: toggleLowStockFilter,
    },
  ];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        title="Stock Items"
        searchPlaceholder="Search stock items..."
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          handlePagination({ page: 1, limit: query.limit });
        }}
        filters={
          <div className="flex min-w-[12rem] items-center gap-2 sm:w-56">
            <ArrowUpDown
              size={14}
              className="shrink-0 text-[var(--serve-muted)]"
              aria-hidden
            />
            <Select
              value={sortBy}
              options={SORT_OPTIONS}
              placeholder="Sort by"
              onValueChange={(next) => {
                setSortBy(String(next));
                handlePagination({ page: 1, limit: query.limit });
              }}
              className="min-w-0 flex-1"
              triggerClassName="h-9"
            />
          </div>
        }
        extraActions={
          canImport ? (
            <button
              type="button"
              data-tour="stock-bulk-upload"
              onClick={() => setBulkUploadOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 text-[13px] font-medium text-[var(--serve-fg)] transition hover:border-[color-mix(in_srgb,var(--serve-accent)_24%,var(--serve-border))] hover:bg-[var(--serve-surface)]"
            >
              <Upload size={15} strokeWidth={2.25} />
              Bulk Upload
            </button>
          ) : null
        }
        hasAddButton={accessList.includes("add")}
        newButtonText="Add New"
        handleNewButton={openCreate}
        handleReloadButton={refreshAll}
        subText="Sort the list as you like. Low stock rows are highlighted in red. Same name shows as Old and New — merge beside the name to combine."
      />

      <div
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        data-tour="stock-kpis"
      >
        {kpiCards.map((card) => {
          const interactive = Boolean(card.clickable);
          const Comp = interactive ? "button" : "div";
          return (
            <Comp
              key={card.id}
              type={interactive ? "button" : undefined}
              onClick={interactive ? card.onClick : undefined}
              className={`rounded-xl border bg-white p-4 text-left shadow-sm transition ${
                card.active
                  ? "border-rose-300 ring-2 ring-rose-100"
                  : "border-slate-200"
              } ${
                interactive
                  ? "cursor-pointer hover:border-rose-300 hover:bg-rose-50/40"
                  : ""
              }`}
              title={
                interactive
                  ? lowStockOnly
                    ? "Click to show all stock items"
                    : "Click to show only low stock items"
                  : undefined
              }
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                    card.active ? "bg-rose-100" : "bg-slate-50"
                  }`}
                >
                  {card.icon}
                </span>
              </div>
              <p className="text-xl font-semibold text-slate-900">{card.value}</p>
              {interactive ? (
                <p className="mt-1 text-[11px] font-medium text-[var(--serve-negative)]">
                  {lowStockOnly ? "Showing low stock · click to clear" : "Click to view"}
                </p>
              ) : null}
            </Comp>
          );
        })}
      </div>

      {lowStockOnly ? (
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800">
          Filtered to low stock items
          <button
            type="button"
            onClick={toggleLowStockFilter}
            className="inline-flex h-5 w-5 items-center justify-center rounded-md text-rose-700 hover:bg-rose-100"
            title="Clear filter"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      ) : null}

      {accessList.includes("view") ? (
        <Table
          data={data}
          headers={headers}
          handlePagination={handlePagination}
          pagination={pagination}
          rowClassNames={rowClassNames}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view stock items.
        </div>
      )}

      <Dialog
        open={Boolean(syncPrompt)}
        onOpenChange={(next) => {
          if (!next) setSyncPrompt(null);
        }}
      >
        <DialogContent className="max-w-[360px] gap-3 p-4 sm:p-4">
          <DialogHeader className="items-start space-y-1.5 text-left sm:items-start sm:text-left">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                {syncPrompt?.mode === "undo" ? (
                  <Undo2 size={16} strokeWidth={2.25} />
                ) : (
                  <Merge size={16} strokeWidth={2.25} />
                )}
              </span>
              <DialogTitle className="text-[15px] leading-snug">
                {syncPrompt?.mode === "undo"
                  ? `Undo sync for ${syncPrompt?.name}?`
                  : `Combine ${syncPrompt?.count} “${syncPrompt?.name}” batches?`}
              </DialogTitle>
            </div>
            <DialogDescription className="text-left text-[13px] leading-snug">
              {syncPrompt?.mode === "undo"
                ? "Separate batches come back. Quantities sold after the sync stay on the older row."
                : "Quantities are added together and the rate becomes the weighted average. You can undo this later."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => setSyncPrompt(null)}
              disabled={syncing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
              onClick={runSyncAction}
              disabled={syncing}
            >
              {syncing
                ? "Working…"
                : syncPrompt?.mode === "undo"
                  ? "Undo sync"
                  : "Combine batches"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntityFormDialog
        open={formModal.open}
        onOpenChange={formModal.onOpenChange}
        title={formModal.isEdit ? "Edit Stock Item" : "Create Stock Item"}
        description="Unit, pricing, group, and optional opening stock."
        size="xl"
        closeOnOutsideClick={false}
      >
        <StockItemModal
          key={formModal.editId ?? "new"}
          id={formModal.editId}
          isComponent
          closeModal={formModal.close}
          onSuccess={refreshAll}
        />
      </EntityFormDialog>

      <EntityFormDialog
        open={adjustOpen}
        onOpenChange={(next) => {
          if (!next) closeAdjust();
        }}
        title={
          adjustItem?.name
            ? `Adjust Stock — ${adjustItem.name}`
            : "Adjust Stock"
        }
        description="Record a purchase, in/out adjustment, or waste."
        size="md"
      >
        <AdjustStockModal
          key={adjustItem?.id ?? "adjust"}
          isComponent
          closeModal={closeAdjust}
          onSuccess={refreshAll}
          itemId={adjustItem?.id ?? null}
          itemName={adjustItem?.name}
          unitSymbol={adjustItem?.measuringUnit?.symbol}
          defaultRate={Number(adjustItem?.defaultPrice || 0)}
          defaultSupplierId={
            adjustItem?.supplierId != null
              ? Number(adjustItem.supplierId)
              : null
          }
        />
      </EntityFormDialog>

      {bulkUploadOpen ? (
        <Suspense fallback={null}>
          <BulkUploadModal
            isOpen={bulkUploadOpen}
            onClose={() => setBulkUploadOpen(false)}
            onImported={refreshAll}
          />
        </Suspense>
      ) : null}
    </div>
  );
};

export default StockItem;
