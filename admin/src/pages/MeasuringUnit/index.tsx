import React, { useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { SquarePen } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { buildQueryString } from "@/utils/generalHelper";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { MEASURING_UNIT_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";
import MeasuringUnitModal from "./MeasuringUnitModal";

const MeasuringUnit: React.FC = () => {
  const accessList = checkAccess("Measuring Unit");
  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await deleteApi(`${MEASURING_UNIT_URL}${deleteId}`).unwrap();
      handleResponse({
        res: {
          success: true,
          msg: res?.message || "Measuring unit deleted successfully.",
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
  const url = buildQueryString("measuring-unit/list", {
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

  const headers = [
    "Name",
    "Symbol",
    "Description",
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

  const data = rows.map((r: any) => {
    const cells = [
      <span className="text-sm font-semibold text-slate-800">{r.name}</span>,
      <span className="text-slate-600">{r.symbol}</span>,
      <span className="max-w-md text-sm text-slate-500">
        {r.description || "—"}
      </span>,
    ];

    if (showActions) {
      cells.push(
        <TableRowActions>
          {accessList.includes("edit") && (
            <button
              type="button"
              onClick={() => openEdit(r.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
              title="Edit measuring unit"
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
        searchPlaceholder="Search measuring units..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Measuring Unit"
        handleNewButton={openCreate}
        handleReloadButton={() => refetch()}
        subText="Restaurant defaults (kg, ltr, pcs, …) are ready. Add custom units when you need them."
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
          You do not have permission to view measuring units.
        </div>
      )}

      <MeasuringUnitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
        editId={editId}
      />
    </div>
  );
};

export default MeasuringUnit;
