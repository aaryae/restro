import React, { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { EntityFormDialog } from "@/components/EntityForm";
import usePagination from "@/hooks/usePagination";
import { useFormModal } from "@/hooks/useFormModal";
import { PaginationType } from "@/types/commonTypes";
import { Info, PackageMinus, PackagePlus, SquarePen, Upload, X } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { buildQueryString } from "@/utils/generalHelper";
import {
  useCreateApiMutation,
  useDeleteApiMutation,
  useGetApiQuery,
} from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { STOCK_ITEM_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";

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
  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
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
    "Group",
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

  const syncStock = async (row: {
    id: number;
    name?: string;
    sameNameCount?: number;
  }) => {
    const count = Number(row.sameNameCount || 2);
    const label = row.name || "this stock";
    const ok = window.confirm(
      `Sync ${count} ${label} rows into the oldest one? Quantities are added together and the rate becomes the weighted average. Sales already use the older stock first.`,
    );
    if (!ok) return;
    try {
      const res = await syncApi({
        url: `${STOCK_ITEM_URL}${row.id}/sync`,
        body: {},
      }).unwrap();
      handleResponse({
        res: {
          success: true,
          msg: res?.message || res?.msg || `Synced into ${label}.`,
        },
        onSuccess: refreshAll,
      });
    } catch (error) {
      handleError({ error });
    }
  };

  const toggleLowStockFilter = () => {
    setLowStockOnly((prev) => !prev);
    handlePagination({ page: 1, limit: query.limit });
  };

  const data = rows.map((r: any) => {
    const symbol = r.measuringUnit?.symbol;
    const rate = Number(r.defaultPrice || 0);
    const closing = Number(r.quantity || 0);
    const lowStock = isLowStockItem(r);
    const cells = [
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-800">{r.name}</span>
        {r.isNewStock ? (
          <span
            className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800"
            title="Newer stock with the same name. Orders use the older stock first until you sync."
          >
            New stock
          </span>
        ) : null}
        {lowStock ? (
          <span
            className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
            title={`At or below threshold (${formatQty(r.lowStockThreshold, symbol)})`}
          >
            Low stock
          </span>
        ) : null}
      </span>,
      r.stockGroup?.name ? (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {r.stockGroup.name}
        </span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
      <span className="text-slate-700">{formatMoney(rate)}</span>,
      <span className="text-slate-600" title={r.equivalence || undefined}>
        {r.openingLabel || formatQty(r.openingQuantity, symbol)}
      </span>,
      <span
        className={
          lowStock
            ? "whitespace-nowrap font-semibold text-amber-700"
            : "whitespace-nowrap font-medium text-slate-800"
        }
        title={
          r.units?.length
            ? `${formatQty(closing, symbol)} total${r.equivalence ? ` · ${r.equivalence}` : ""}`
            : undefined
        }
      >
        {r.quantityLabel || formatQty(closing, symbol)}
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
          {Number(r.sameNameCount) > 1 &&
            (accessList.includes("edit") ||
              accessList.includes("adjust") ||
              accessList.includes("sync")) && (
              <button
                type="button"
                disabled={syncing}
                onClick={() => syncStock(r)}
                className="inline-flex h-8 items-center rounded-lg border border-violet-200 bg-violet-50 px-2 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                title="Combine every row with this name and unit into the oldest one. The rate becomes the weighted average."
              >
                Sync
              </button>
            )}
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

    return cells;
  });

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
      icon: <PackageMinus className="h-4 w-4 text-amber-600" />,
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
        onSearchChange={setSearchTerm}
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
        subText="A repeated name stays a separate row and is marked New stock. Orders use the older row first. Sync combines them and averages the rate."
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
                  ? "border-amber-300 ring-2 ring-amber-100"
                  : "border-slate-200"
              } ${
                interactive
                  ? "cursor-pointer hover:border-amber-300 hover:bg-amber-50/40"
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
                    card.active ? "bg-amber-100" : "bg-slate-50"
                  }`}
                >
                  {card.icon}
                </span>
              </div>
              <p className="text-xl font-semibold text-slate-900">{card.value}</p>
              {interactive ? (
                <p className="mt-1 text-[11px] font-medium text-amber-700">
                  {lowStockOnly ? "Showing low stock · click to clear" : "Click to view"}
                </p>
              ) : null}
            </Comp>
          );
        })}
      </div>

      {lowStockOnly ? (
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
          Filtered to low stock items
          <button
            type="button"
            onClick={toggleLowStockFilter}
            className="inline-flex h-5 w-5 items-center justify-center rounded-md text-amber-700 hover:bg-amber-100"
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
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view stock items.
        </div>
      )}

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
