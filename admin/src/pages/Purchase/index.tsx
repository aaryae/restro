import React, { useMemo } from "react";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { CurrencySign } from "@/constants";
import PageHeader from "@/components/PageHeader";

type PurchaseRow = {
  purchaseId: number;
  dateAD: string;
  dateBS: string;
  particulars: string;
  categoryId: number; // FK
  vendorId: number; // FK
  amount: number;
  paidOrCredit: "Paid" | "Credit";
  paymentSourceId: number; // FK
};

const Purchase: React.FC = () => {
  // Demo Mock data; replace with API integration later
  const allData: PurchaseRow[] = useMemo(
    () => [
      {
        purchaseId: 1001,
        dateAD: "2025-09-01",
        dateBS: "2082-05-16",
        particulars: "Raw Vegetables",
        categoryId: 10,
        vendorId: 501,
        amount: 12500,
        paidOrCredit: "Paid",
        paymentSourceId: 3001,
      },
      {
        purchaseId: 1002,
        dateAD: "2025-09-01",
        dateBS: "2082-05-16",
        particulars: "Spices",
        categoryId: 10,
        vendorId: 502,
        amount: 7800,
        paidOrCredit: "Credit",
        paymentSourceId: 3002,
      },
      {
        purchaseId: 1003,
        dateAD: "2025-08-31",
        dateBS: "2082-05-15",
        particulars: "Cleaning Supplies",
        categoryId: 20,
        vendorId: 520,
        amount: 4200,
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
  ];

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
  ]);

  return (
    <>
      <PageTitle title="Purchase" />
      <PageHeader
      
        hasAddButton={true}
        newButtonText="Add New Purchase"
        handleNewButton={() => {}}
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
