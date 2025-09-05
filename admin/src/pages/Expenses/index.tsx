import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";

import { useMemo } from "react";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { CurrencySign } from "@/constants";
import { useNavigate } from "react-router-dom";
import { EXPENSE_ADD_ROUTE } from "@/routes/routeNames";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";

type ExpenseRow = {
  expenseId: number;
  dateAD: string;
  dateBS: string;
  particulars: string;
  categoryId: number; // FK
  amount: number;
  paidOrCredit: "Paid" | "Credit";
  paymentSourceId: number;
};

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  //This is mock data without API
  const allData: ExpenseRow[] = useMemo(
    () => [
      {
        expenseId: 1,
        dateAD: "2025-09-01",
        dateBS: "2082-05-16",
        particulars: "Electricity Bill",
        categoryId: 30,
        amount: 9500,
        paidOrCredit: "Paid",
        paymentSourceId: 4001,
      },
    ],
    [],
  );

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const start = (query.page - 1) * query.limit;
  const pageRows = allData.slice(start, start + query.limit);

  const pagination: PaginationType = {
    page: query.page,
    limit: query.limit,
    total: allData.length,
    totalPages: Math.max(1, Math.ceil(allData.length / query.limit)),
  };

  const headers = [
    "Expense ID",
    "Date (AD)",
    "Date (BS)",
    "Particulars",
    "Category ID",
    "Amount",
    "Paid or Credit",
    "Payment Source ID",
    "Actions",
  ];

  const handleNewExpense = (id: number | null) => {
    id === null
      ? navigate(EXPENSE_ADD_ROUTE)
      : navigate(`${EXPENSE_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = () => {
    // Since this page currently uses mock data, just close the modal.
    // Wire this up to API similar to Revenue when backend is ready.
    console.log("Delete expense id:", deleteId);
    setOpen(false);
  };

  const data = pageRows.map((r) => [
    r.expenseId,
    r.dateAD,
    r.dateBS,
    r.particulars,
    r.categoryId,
    CurrencySign + r.amount,
    r.paidOrCredit,
    r.paymentSourceId,
    <div
      className="flex items-center justify-center gap-3"
      key={`act-${r.expenseId}`}
    >
      <MdEditSquare
        size={18}
        className="text-[#0090DD] hover:text-blue-800"
        onClick={() => handleNewExpense(r.expenseId)}
      />
      <DeleteModal
        open={open}
        setOpen={setOpen}
        handleDeleteTrigger={() => handleDeleteTrigger(r.expenseId)}
        handleConfirmDelete={handleDelete}
      />
    </div>,
  ]);

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
          handlePagination({ ...p, total: allData.length })
        }
      />
    </>
  );
};

export default Expenses;
