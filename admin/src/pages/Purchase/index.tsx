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
import { buildQueryString } from "@/utils/generalHelper";
import { PURCHASE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery, useDeleteApiMutation } from "@/redux/services/crudApi";

// Removed unused PurchaseRow mock type

const Purchase: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteApi] = useDeleteApiMutation();

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

  // Build server-side query with filters
  const serverUrl = useMemo(() => {
    const search: Record<string, any> = {};
    if (filters?.purchaseId) search.id = filters.purchaseId;
    if (filters?.dateAD)
      search.date = new Date(filters.dateAD).toISOString().slice(0, 10);
    if (filters?.particulars) search.particulars = filters.particulars;
    if (filters?.vendorId) search.vendorId = filters.vendorId;
    if (filters?.paidOrCredit) search.paymentStatus = filters.paidOrCredit;
    return buildQueryString("purchase/list", {
      page: query.page,
      limit: query.limit,
      search,
    });
  }, [filters, query.page, query.limit]);

  const { data: apiData, refetch } = useGetApiQuery({ url: serverUrl });

  const accountUrl = useMemo(
    () => buildQueryString("account/list", { page: 1, limit: 1000 }),
    [],
  );
  const { data: accountsResp } = useGetApiQuery({ url: accountUrl });
  const accountsMap = useMemo(() => {
    const map = new Map<number, string>();
    const rows: any[] =
      (accountsResp as any)?.data?.data || (accountsResp as any)?.data || [];
    rows.forEach((a: any) => {
      if (a?.id != null)
        map.set(Number(a.id), a?.name || a?.accountName || `#${a.id}`);
    });
    return map;
  }, [accountsResp]);

  const rows: any[] = useMemo(() => {
    const d = (apiData as any)?.data;
    if (!d) return [];
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    return [];
  }, [apiData]);

  const total: number = useMemo(() => {
    const d = (apiData as any)?.data;
    if (typeof d?.total === "number") return d.total;
    return rows.length;
  }, [apiData, rows.length]);

  const pagination: PaginationType = {
    page: query.page,
    limit: query.limit,
    total: total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };

  const headers = [
    "Purchase ID",
    "Date (AD)",
    "Date (BS)",
    "Particulars",
    "Category",
    "Supplier",
    "Amount",
    "Paid or Credit",
    "Payment Source",
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

  const handleDelete = async () => {
    if (!deleteId) return setOpen(false);
    try {
      await deleteApi(`${PURCHASE_URL}${deleteId}`).unwrap();
      setOpen(false);
      setDeleteId(null);
      refetch();
    } catch (e) {
      setOpen(false);
    }
  };

  const data = rows.map((r: any) => {
    const id = r?.id ?? r?.purchaseId ?? r?.purchase_id;
    const dateAD = (r?.invoiceDate || r?.date || r?.createdAt || "")
      .toString()
      .slice(0, 10);
    const dateBS = r?.dateBS || "-";
    const particulars = (() => {
      const items: any[] = r?.purchaseItems || r?.items || [];
      if (items.length > 0) {
        const first = items[0];
        return first?.particulars || r?.particulars || "-";
      }
      return r?.particulars || "-";
    })();
    const categoryName = (() => {
      const items: any[] = r?.purchaseItems || r?.items || [];
      const cat = items?.[0]?.category || r?.category || r?.purchaseCategory;
      return (
        cat?.name ||
        r?.categoryName ||
        (items?.[0]?.categoryId != null
          ? `#${items[0].categoryId}`
          : r?.categoryId
            ? `#${r.categoryId}`
            : "-")
      );
    })();
    const supplierName = (() => {
      const sup = r?.supplier || r?.vendor;
      return (
        sup?.name ||
        r?.supplierName ||
        r?.vendorName ||
        (r?.supplierId || r?.vendorId
          ? `#${r?.supplierId ?? r?.vendorId}`
          : "-")
      );
    })();
    const amount = r?.totalAmount ?? r?.total ?? r?.amount ?? 0;
    
    const rawPaymentTerms =
      r?.paymentTerms ??
      r?.paymentTerm ??
      r?.payment_terms ??
      r?.payment_status ??
      r?.paymentStatus ??
      r?.status ??
      "-";
    const paymentTermsDisplay =
      typeof rawPaymentTerms === "string" && rawPaymentTerms !== "-"
        ? `${rawPaymentTerms}`.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
        : "-";
    const paymentSourceName = (() => {
      const acc = r?.account || r?.paymentSource;
      const direct = acc?.name || r?.accountName || r?.paymentSourceName;
      if (direct) return direct;
      const accId = r?.accountId ?? r?.paymentSourceId;
      if (accId != null) {
        const name = accountsMap.get(Number(accId));
        if (name) return name;
        return `#${accId}`;
      }
      return "-";
    })();

    return [
      id,
      dateAD,
      dateBS,
      particulars,
      categoryName,
      supplierName,
      `${CurrencySign}${Number(amount).toFixed(2)}`,
      paymentTermsDisplay,
      paymentSourceName,
      <div className="flex items-center justify-center gap-3" key={`act-${id}`}>
        <MdEditSquare
          size={18}
          className="text-[#0090DD] hover:text-blue-800"
          onClick={() => handleNewUser(id)}
        />
        <DeleteModal
          open={open}
          setOpen={setOpen}
          handleDeleteTrigger={() => handleDeleteTrigger(id)}
          handleConfirmDelete={handleDelete}
        />
      </div>,
    ];
  });

  return (
    <>
      <PageTitle title="Purchase" />
      <PageHeader
        hasAddButton={true}
        newButtonText="Add New Purchase"
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
        hasSubText={false}
      />
      <PageFilterWrapper title="Purchase Filters">
        {Component}
      </PageFilterWrapper>
      <Table
        headers={headers}
        data={data}
        pagination={pagination}
        handlePagination={(p) => handlePagination({ ...p, total })}
      />
    </>
  );
};

export default Purchase;
