import React, { lazy, useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { EntityFormDialog } from "@/components/EntityForm";
import usePagination from "@/hooks/usePagination";
import { useFormModal } from "@/hooks/useFormModal";
import { PaginationType } from "@/types/commonTypes";
import { SquarePen } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { buildQueryString } from "@/utils/generalHelper";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { STOCK_GROUP_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";

const StockGroupModal = lazy(() => import("./StockGroupModal"));

const StockGroup: React.FC = () => {
  const accessList = checkAccess("Stock Group");
  const formModal = useFormModal();
  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await deleteApi(`${STOCK_GROUP_URL}${deleteId}`).unwrap();
      handleResponse({
        res: {
          success: true,
          msg: res?.message || "Stock group deleted successfully.",
        },
        onSuccess: () => refetch(),
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
      setDeleteId(null);
    }
  };

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const url = buildQueryString("stock-group/list", {
    page: query.page,
    limit: query.limit,
    search: { name: searchTerm },
  });
  const {
    data: apiData,
    isSuccess: success,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteApi] = useDeleteApiMutation();

  const rows: any[] = success ? (apiData?.data?.data ?? []) : [];

  const pagination: PaginationType = {
    page: apiData?.data?.total === 0 ? 0 : apiData?.data?.page,
    limit: apiData?.data?.limit,
    total: apiData?.data?.total,
    totalPages: apiData?.data?.totalPages,
  };

  const showActions =
    accessList.includes("edit") || accessList.includes("delete");

  const headers = ["Name", "Description", showActions && "Actions"].filter(
    Boolean,
  ) as string[];

  const data = rows.map((r: any) => {
    const cells = [
      <span className="text-sm font-semibold text-slate-800">{r.name}</span>,
      <span className="text-slate-600">{r.description || "—"}</span>,
    ];

    if (showActions) {
      cells.push(
        <TableRowActions>
          {accessList.includes("edit") && (
            <button
              type="button"
              onClick={() => formModal.openEdit(r.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
              title="Edit stock group"
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

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        title="Stock Groups"
        searchPlaceholder="Search stock groups..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Stock Group"
        handleNewButton={() => formModal.openAdd()}
        handleReloadButton={() => refetch()}
        subText="Group stock items (e.g. Drinks, Dairy, Produce)."
      />
      {accessList.includes("view") ? (
        <Table
          data={data}
          headers={headers}
          handlePagination={handlePagination}
          pagination={pagination}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view stock groups.
        </div>
      )}

      <EntityFormDialog
        open={formModal.open}
        onOpenChange={formModal.onOpenChange}
        title={formModal.isEdit ? "Edit Stock Group" : "Add Stock Group"}
        description="Name and optional description for this stock group."
        size="md"
      >
        <StockGroupModal
          key={formModal.editId ?? "new"}
          id={formModal.editId}
          isComponent
          closeModal={formModal.close}
          onSuccess={() => refetch()}
        />
      </EntityFormDialog>
    </div>
  );
};

export default StockGroup;
