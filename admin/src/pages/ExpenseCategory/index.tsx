import React, { useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import useTranslation from "@/locale/useTranslation";
import { EXPENSE_CATEGORY_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { buildQueryString } from "@/utils/generalHelper";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { EXPENSE_CATEGORY_URL } from "@/constants/apiUrlConstants";

const ExpenseCategory: React.FC = () => {
  const translate = useTranslation();
  const navigate = useNavigate();
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
        `${EXPENSE_CATEGORY_URL}${deleteId}`,
      ).unwrap();
      handleResponse({
        res,
        onSuccess: () => refetch(),
      });
    } catch (error: any) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
      setDeleteId(null);
    }
  };

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const url = buildQueryString(`${EXPENSE_CATEGORY_URL}list`, {
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

  const headers = ["Title", "Description", "Actions"];

  const handleNewExpenseCategory = (id: number | null) => {
    if (id === null) {
      navigate(`${EXPENSE_CATEGORY_ADD_ROUTE}`);
    } else {
      navigate(`${EXPENSE_CATEGORY_ADD_ROUTE}${id}`);
    }
  };

  const data = rows.map((row: any) => [
    <span className="text-sm font-semibold text-slate-800">{row.name}</span>,
    <span className="text-slate-600">{row.description || "—"}</span>,
    <TableRowActions>
      <button
        type="button"
        onClick={() => handleNewExpenseCategory(row.id)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
        title="Edit expense category"
      >
        <MdEditSquare size={16} />
      </button>
      <DeleteModal
        compact
        open={deleteModelOpen}
        setOpen={setDeleteModelOpen}
                  itemId={row.id}
                  activeId={deleteId}
        handleDeleteTrigger={() => handleDeleteTrigger(row.id)}
        handleConfirmDelete={handleDelete}
      />
    </TableRowActions>,
  ]);

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search expense categories..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton
        newButtonText={translate("Add Expense Category")}
        handleNewButton={() => handleNewExpenseCategory(null)}
        handleReloadButton={() => refetch()}
        subText="Organize expense entries into categories."
      />
      <Table
        data={data}
        headers={headers}
        handlePagination={handlePagination}
        pagination={pagination}
      />
    </div>
  );
};

export default ExpenseCategory;
