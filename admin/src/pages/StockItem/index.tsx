import React, { lazy, Suspense, useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { PackageMinus, PackagePlus, SquarePen, Upload } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { buildQueryString } from "@/utils/generalHelper";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { STOCK_ITEM_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import StockItemModal from "./StockItemModal";
import AdjustStockModal from "./AdjustStockModal";

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

const StockItem: React.FC = () => {
  const accessList = checkAccess("Stock Item");
  const canImport = accessList.includes("add") || accessList.includes("import");
  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
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
    search: { name: searchTerm },
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

  const openCreate = () => {
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    setEditId(id);
    setModalOpen(true);
  };

  const openAdjust = (row: any) => {
    setAdjustItem(row);
    setAdjustOpen(true);
  };

  const refreshAll = () => {
    refetch();
    refetchSummary();
  };

  const data = rows.map((r: any) => {
    const symbol = r.measuringUnit?.symbol;
    const rate = Number(r.defaultPrice || 0);
    const closing = Number(r.quantity || 0);
    const cells = [
      <span className="text-sm font-semibold text-slate-800">{r.name}</span>,
      r.stockGroup?.name ? (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {r.stockGroup.name}
        </span>
      ) : (
        <span className="text-slate-400">—</span>
      ),
      <span className="text-slate-700">{formatMoney(rate)}</span>,
      <span className="text-slate-600">
        {formatQty(r.openingQuantity, symbol)}
      </span>,
      <span className="text-slate-800 font-medium">
        {formatQty(closing, symbol)}
      </span>,
      <span className="text-slate-700">{formatMoney(closing * rate)}</span>,
      <span className="text-slate-600">{r.supplier?.name || "—"}</span>,
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

    return cells;
  });

  const kpiCards = [
    {
      label: "Total Stock Items",
      value: String(summary.totalItems ?? 0),
      icon: <PackagePlus className="h-4 w-4 text-sky-600" />,
    },
    {
      label: "Total Stock Value",
      value: formatMoney(summary.totalStockValue ?? 0),
      icon: <PackageMinus className="h-4 w-4 text-violet-600" />,
    },
    {
      label: "Restocked this week",
      value: `${summary.restockedThisWeek ?? 0} item`,
      icon: <PackagePlus className="h-4 w-4 text-emerald-600" />,
    },
    {
      label: "Low Stock items",
      value: `${summary.lowStockItems ?? 0} item`,
      icon: <PackageMinus className="h-4 w-4 text-amber-600" />,
    },
  ];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
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
        subText="Track inventory quantities, value, and low stock."
      />

      <div
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        data-tour="stock-kpis"
      >
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
                {card.icon}
              </span>
            </div>
            <p className="text-xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

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

      <StockItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refreshAll}
        editId={editId}
      />

      {bulkUploadOpen ? (
        <Suspense fallback={null}>
          <BulkUploadModal
            isOpen={bulkUploadOpen}
            onClose={() => setBulkUploadOpen(false)}
            onImported={refreshAll}
          />
        </Suspense>
      ) : null}

      <AdjustStockModal
        isOpen={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        onSuccess={refreshAll}
        itemId={adjustItem?.id ?? null}
        itemName={adjustItem?.name}
        defaultRate={Number(adjustItem?.defaultPrice || 0)}
      />
    </div>
  );
};

export default StockItem;
