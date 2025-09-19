import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { CurrencySign } from "@/constants";
import { useNavigate } from "react-router-dom";
import { EXPENSE_ADD_ROUTE } from "@/routes/routeNames";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { EXPENSE_URL } from "@/constants/apiUrlConstants";
import { format } from "date-fns";
import { ADToBS } from "bikram-sambat-js";
import { handleError, handleResponse } from "@/utils/responseHandler";

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const url = buildQueryString(`${EXPENSE_URL}list`, {
    page: query.page,
    limit: query.limit,
  });

  const [deleteExpense] = useDeleteApiMutation();

  const { data: apiData, isSuccess: success } = useGetApiQuery({ url });

  const pagination: PaginationType = {
    page: apiData?.data?.page ?? query.page,
    limit: apiData?.data?.limit ?? query.limit,
    total: apiData?.data?.total ?? 0,
    totalPages: apiData?.data?.totalPages ?? 1,
  };

  const headers = [
    "Expense ID",
    "Date (AD)",
    "Date (BS)",
    "Remarks",
    "Category",
    "Amount",
    "Cash or Credit",
    "Payment Source ID",
    "Actions",
  ];

  const handleNewExpense = (id: number | null) => {
    if (id === null) {
      navigate(EXPENSE_ADD_ROUTE);
    } else {
      navigate(`${EXPENSE_ADD_ROUTE}${id}`);
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteExpense(
        `${EXPENSE_URL}${deleteId}`,
      ).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const data = success
    ? apiData?.data?.data?.map((expense) => [
        expense?.id,
        format(expense.createdAt, "yyyy-MM-dd"),
        ADToBS(expense.createdAt),
        expense?.remarks,
        expense?.category?.name,
        CurrencySign + expense?.amount,
        expense?.cash_or_credit,
        expense?.account?.name,
        <div
          className="flex items-center justify-center gap-3"
          key={`act-${expense?.id}`}
        >
          <MdEditSquare
            size={18}
            className="text-[#0090DD] hover:text-blue-800 hover:cursor-pointer"
            onClick={() => handleNewExpense(expense?.id)}
          />
          <DeleteModal
            open={open}
            setOpen={setOpen}
            handleDeleteTrigger={() => handleDeleteTrigger(expense?.id)}
            handleConfirmDelete={handleDelete}
          />
        </div>,
      ])
    : [];

  return (
    <>
      <PageTitle title="Expenses" />
      <PageHeader
        hasAddButton={true}
        newButtonText="Add Expense"
        handleNewButton={() => handleNewExpense(null)}
        handleReloadButton={() => {}}
        hasSubText={false}
      />

      <Table
        headers={headers}
        data={data}
        pagination={pagination}
        handlePagination={(p) =>
          handlePagination({ ...p, total: apiData?.data?.total ?? 0 })
        }
      />
    </>
  );
};

export default Expenses;
