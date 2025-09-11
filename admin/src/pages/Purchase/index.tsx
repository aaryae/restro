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
import PageFilterWrapper from "@/components/PageFilterWrapper";
import PageFilterSample from "@/components/PageFilterSample";
import { FilterInput } from "@/components/Input/filterInput";
import { FilterSelect } from "@/components/Select/FilterSelect";
import DateInput from "@/components/DateInput";
import { useForm } from "react-hook-form";
import { FileText, IdCard, UserRound } from "lucide-react";

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

  // Filters (client-side for now)
  const { control, handleSubmit, reset, setValue, getValues } = useForm({});
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleDateChange = (value: Date) => {
    setValue("dateAD", value);
  };

  const filterFields = useMemo(
    () => [
      {
        name: "purchaseId",
        label: "Purchase ID",
        Component: FilterInput,
        control,
        icon: <IdCard className="w-4 h-4" />,
      },
      {
        name: "dateAD",
        label: "Date (AD)",
        Component: DateInput,
        control,
        handleChange: handleDateChange,
        value: getValues("dateAD"),
      },
      {
        name: "particulars",
        label: "Particulars",
        Component: FilterInput,
        control,
        icon: <FileText className="w-4 h-4" />,
      },
      {
        name: "vendorId",
        label: "Vendor ID",
        Component: FilterInput,
        control,
        icon: <UserRound className="w-4 h-4" />,
      },
      {
        name: "paidOrCredit",
        label: "Paid or Credit",
        Component: FilterSelect,
        className: "w-full",
        options: [
          { label: "Any", value: "" },
          { label: "Paid", value: "Paid" },
          { label: "Credit", value: "Credit" },
        ],
        control,
      },
    ],
    [control, getValues],
  );

  const { Component } = PageFilterSample(
    filterFields,
    handleSubmit,
    (query: Record<string, any>) => setFilters(query),
    reset,
  );

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  // Apply client-side filters
  const filteredData = useMemo(() => {
    return allData.filter((r) => {
      const idOk = filters.purchaseId
        ? String(r.purchaseId).includes(String(filters.purchaseId))
        : true;
      const dateOk = filters.dateAD
        ? new Date(r.dateAD).toDateString() === new Date(filters.dateAD).toDateString()
        : true;
      const partOk = filters.particulars
        ? r.particulars.toLowerCase().includes(String(filters.particulars).toLowerCase())
        : true;
      const vendorOk = filters.vendorId
        ? String(r.vendorId).includes(String(filters.vendorId))
        : true;
      const paidOk = filters.paidOrCredit ? r.paidOrCredit === filters.paidOrCredit : true;
      return idOk && dateOk && partOk && vendorOk && paidOk;
    });
  }, [allData, filters]);

  const start = (query.page - 1) * query.limit;
  const pageRows = filteredData.slice(start, start + query.limit);

  const pagination: PaginationType = {
    page: query.page,
    limit: query.limit,
    total: filteredData.length,
    totalPages: Math.max(1, Math.ceil(filteredData.length / query.limit)),
  };

  const headers = [
    "Purchase ID",
    "Date (AD)",
    "Date (BS)",
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
      <PageFilterWrapper title="Purchase Filters">{Component}</PageFilterWrapper>
      <Table
        headers={headers}
        data={data}
        pagination={pagination}
        handlePagination={(p) =>
          handlePagination({ ...p, total: filteredData.length })
        }
      />
    </>
  );
};

export default Purchase;
