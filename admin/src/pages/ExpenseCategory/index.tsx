import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DraggableTable from "@/components/Table/dragableTable";
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
import Table from "@/components/Table";

// type PurchaseCategoryRow = {
//   id: number;
//   title: string;
//   description: string;
// };

const ExpenseCategory: React.FC = () => {
  const translate = useTranslation();
  const navigate = useNavigate();
  const [deleteModelOpen, setDeleteModelOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
  });
  const {
    data: apiData,
    isSuccess: success,
    isFetching,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteApi] = useDeleteApiMutation();

  const rows: any[] = success ? (apiData?.data?.data ?? []) : [];

  const pagination: PaginationType = {
    page: apiData?.data?.page ?? query.page,
    limit: apiData?.data?.limit ?? query.limit,
    total: apiData?.data?.total ?? 0,
    totalPages: apiData?.data?.totalPages ?? 1,
  };

  const headers = [
    "Expense Category Title",
    "Expense Category Description",
    "Action",
  ];

  const handleNewExpenseCategory = (id: number | null) => {
    if (id === null) {
      navigate(`${EXPENSE_CATEGORY_ADD_ROUTE}`);
    } else {
      navigate(`${EXPENSE_CATEGORY_ADD_ROUTE}${id}`);
    }
  };
  // For DraggableTable, the first array element is the row identifier and is not rendered.
  const data = rows.map((row: any) => [
    row.name,
    row.description,
    <div key={row.id} className="flex items-center justify-center gap-[0.5rem]">
      <div className="relative group">
        <MdEditSquare
          size={18}
          className="text-[#0090DD] hover:text-blue-800 cursor-pointer"
          onClick={() => handleNewExpenseCategory(row.id)}
          title="Edit"
        />
        <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
          Edit Expense Category
        </span>
      </div>
      <DeleteModal
        open={deleteModelOpen}
        setOpen={setDeleteModelOpen}
        handleDeleteTrigger={() => handleDeleteTrigger(row.id)}
        handleConfirmDelete={handleDelete}
      />
    </div>,
  ]);

  return (
    <>
      <PageHeader
        hasAddButton={true}
        newButtonText={translate("Add New Expense Category")}
        handleNewButton={() => handleNewExpenseCategory(null)}
        handleReloadButton={() => refetch()}
        hasSubText
        subText="This module allows dynamically adding various types of categories related to expense entry."
      />
      <Table
        data={data}
        headers={headers}
        handlePagination={handlePagination}
        pagination={pagination}
      />
    </>
  );
};

export default ExpenseCategory;
