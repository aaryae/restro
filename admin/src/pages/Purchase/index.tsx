import React, { useMemo, useState } from "react";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { CurrencySign } from "@/constants";
import PageHeader from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { PURCHASE_ADD_ROUTE } from "@/routes/routeNames";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";

type PurchaseRow = {
  purchaseId: number;
  dateAD: string;
  dateBS: string;
  particulars: string;
  categoryId: number; // FK
  vendorId: number; // FK
  amount: number;
  paidOrCredit: "Paid" | "Credit";
  paymentSourceId: number;
};

const Purchase: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // Demo Mock data; replace with API integration later
  const allData: PurchaseRow[] = useMemo(
    () => [
      {
        purchaseId: 1,
        dateAD: "2025-09-01",
        dateBS: "2082-05-16",
        particulars: "Raw Vegetables",
        categoryId: 10,
        vendorId: 501,
        amount: 12500,
        paidOrCredit: "Paid",
        paymentSourceId: 3001,
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
    "Purchase ID",
    "Date of Purchase (AD)",
    "Date of Purchase (BS)",
    "Particulars",
    "Category ID",
    "Vendor ID",
    "Amount",
    "Paid or Credit",
    "Payment Source ID",
    "Actions",
  ];

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PURCHASE_ADD_ROUTE)
      : navigate(`${PURCHASE_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = () => {
    // Mock delete: close modal. Hook up API when backend is ready.
    console.log("Delete purchase id:", deleteId);
    setOpen(false);
  };

  const data = pageRows.map((r) => [
    r.purchaseId,
    r.dateAD,
    r.dateBS,
    r.particulars,
    r.categoryId,
    r.vendorId,
    CurrencySign + r.amount,
    r.paidOrCredit,
    r.paymentSourceId,
    <div
      className="flex items-center justify-center gap-3"
      key={`act-${r.purchaseId}`}
    >
      <MdEditSquare
        size={18}
        className="text-[#0090DD] hover:text-blue-800"
        onClick={() => handleNewUser(r.purchaseId)}
      />
      <DeleteModal
        open={open}
        setOpen={setOpen}
        handleDeleteTrigger={() => handleDeleteTrigger(r.purchaseId)}
        handleConfirmDelete={handleDelete}
      />
    </div>,
  ]);

  return (
    <>
      <PageTitle title="Purchase" />
      <PageHeader
        hasAddButton={true}
        newButtonText="Add New Purchase"
        handleNewButton={() => handleNewUser(null)}
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

export default Purchase;
