import React, { useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import useTranslation from "@/locale/useTranslation";
import { PURCHASE_CATEGORY_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";
import { SquarePen } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { buildQueryString } from "@/utils/generalHelper";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { PURCHASE_CATEGORY_URL } from "@/constants/apiUrlConstants";
import { checkAccess } from "@/utils/accessHelper";

const PurchaseCategory: React.FC = () => {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Purchase Category");
  const [deleteModelOpen, setDeleteModelOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await deleteApi(
        `${PURCHASE_CATEGORY_URL}${deleteId}`,
      ).unwrap();
      handleResponse({
        res: {
          success: true,
          msg: res?.message || "Purchase category deleted successfully.",
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
  const url = buildQueryString("purchase-category/list", {
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

  const headers = [
    "Title",
    "Description",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PURCHASE_CATEGORY_ADD_ROUTE)
      : navigate(`${PURCHASE_CATEGORY_ADD_ROUTE}${id}`);
  };

  const showActions =
    accessList.includes("edit") || accessList.includes("delete");

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
              onClick={() => handleNewUser(r.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
              title="Edit purchase category"
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
        searchPlaceholder="Search purchase categories..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add Purchase Category")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
        subText="Organize purchase entries into categories."
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
          You do not have permission to view purchase categories.
        </div>
      )}
    </div>
  );
};

export default PurchaseCategory;
