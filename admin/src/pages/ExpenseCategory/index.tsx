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
    "ID",
    "Expense Category Title",
    "Expense Category Description",
    "Action",
  ];

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(`${EXPENSE_CATEGORY_ADD_ROUTE}`)
      : navigate(`${EXPENSE_CATEGORY_ADD_ROUTE}${id}`);
  };
  // For DraggableTable, the first array element is the row identifier and is not rendered.
  const data = rows.map((row: any) => [
    row.id,
    row.id,
    row.name,
    row.description,
    <div key={row.id} className="flex items-center justify-center gap-[0.5rem]">
      <MdEditSquare
        size={18}
        className="text-[#0090DD] hover:text-blue-800 cursor-pointer"
        onClick={() => handleNewUser(row.id)}
        title="Edit"
      />
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
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
        hasSubText
        subText="This module allows dynamically adding various types of categories related to expense entry."
      />
      <DraggableTable
        headers={headers}
        data={data}
        loading={isFetching}
        fetching={isFetching}
        success={success}
        url="expense-category/update-order"
        action={() => {}}
        pagination={pagination}
        handlePagination={(p) =>
          handlePagination({ ...p, total: pagination.total })
        }
      />
    </>
  );
};

export default ExpenseCategory;
