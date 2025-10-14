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
import { UserRound } from "lucide-react";
import { buildQueryString } from "@/utils/generalHelper";
import { PURCHASE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery, useDeleteApiMutation } from "@/redux/services/crudApi";
import { FaEye } from "react-icons/fa";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { ADToBS } from "bikram-sambat-js";
import { PurchaseFilterSchema, type PurchaseFilterInput } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";

const Purchase: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteApi] = useDeleteApiMutation();
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Filters (client-side for now)
  const { control, handleSubmit, reset, setValue, getValues } =
    useForm<PurchaseFilterInput>({
      resolver: zodResolver(PurchaseFilterSchema),
      defaultValues: {
        date: undefined as any,
        supplierName: "",
        status: "",
      },
    });
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleDateChange = (value: Date) => {
    setValue("date", value);
  };

  const handleViewPurchase = (id: number) => {
    setSelectedId(id);
    setOpenDrawer(true);
  };

  const filterFields = useMemo(
    () => [
      {
        name: "date",
        label: "Date",
        Component: DateInput,
        control,
        handleChange: handleDateChange,
        value: getValues("date"),
      },
      {
        name: "supplierName",
        label: "Supplier Name",
        Component: FilterInput,
        control,
        icon: <UserRound className="w-4 h-4" />,
      },
      {
        name: "status",
        label: "Status",
        Component: FilterSelect,
        className: "w-full",
        handleChange: (v: string) => setValue("status", v as any),
        options: [
          { label: "Any", value: "" },
          { label: "Draft", value: "draft" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
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
    if (filters?.date) {
      const iso = new Date(filters.date).toISOString().slice(0, 10);
      search.date = iso;
    }
    if (filters?.status) {
      const s = String(filters.status).toLowerCase();
      search.status = s;
    }
    return buildQueryString("purchase/list", {
      page: query.page,
      limit: query.limit,
      search,
    });
  }, [filters, query.page, query.limit]);

  const { data: apiData, refetch } = useGetApiQuery({ url: serverUrl });
  // Fetch single purchase when drawer is open
  const { data: purchaseDetailResp } = useGetApiQuery(
    { url: selectedId ? `${PURCHASE_URL}${selectedId}` : "" },
    { skip: !openDrawer || !selectedId },
  );

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

  const supplierFilteredRows: any[] = useMemo(() => {
    const term = String(filters?.supplierName || "")
      .trim()
      .toLowerCase();
    if (!term) return rows;
    return rows.filter((r: any) => {
      const sup = r?.supplier || r?.vendor || {};
      const name = sup?.name || r?.supplierName || r?.vendorName || null;
      if (name) return String(name).toLowerCase().includes(term);
      const id = r?.supplierId ?? r?.vendorId;
      return id != null && String(id).toLowerCase().includes(term);
    });
  }, [rows, filters?.supplierName]);

  const total: number = useMemo(() => {
    const d = (apiData as any)?.data;
    const hasSupplierFilter = Boolean(
      String(filters?.supplierName || "").trim().length > 0,
    );
    if (hasSupplierFilter) return supplierFilteredRows.length;
    if (typeof d?.total === "number") return d.total;
    return rows.length;
  }, [
    apiData,
    rows.length,
    supplierFilteredRows.length,
    filters?.supplierName,
  ]);

  const pagination: PaginationType = {
    page: apiData?.data?.total === 0 ? 0 : apiData?.data?.page,
    limit: apiData?.data?.limit,
    total: apiData?.data?.total,
    totalPages: apiData?.data?.totalPages,
  };

  const headers = [
    "S.N",
    "Date (AD)",
    "Date (BS)",
    "Particulars",
    "Category",
    "Supplier",
    "Amount",
    "Paid or Credit",
    "Status",
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
      const response = await deleteApi(`${PURCHASE_URL}${deleteId}`).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          setOpen(false);
          setDeleteId(null);
          refetch();
        },
      });
    } catch (error) {
      handleError({ error });
      setOpen(false);
    }
  };

  const data = supplierFilteredRows.map((r: any, index: number) => {
    const id = r?.id ?? r?.purchaseId ?? r?.purchase_id;
    const dateAD = (r?.invoiceDate || r?.date || r?.createdAt || "")
      .toString()
      .slice(0, 10);
    const dateBS = ADToBS(r?.createdAt);
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
      "-";
    const paymentTermsDisplay =
      typeof rawPaymentTerms === "string" && rawPaymentTerms !== "-"
        ? `${rawPaymentTerms}`
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase())
        : "-";
    const rawStatus = r?.status ?? r?.purchaseStatus ?? r?.state ?? "-";
    const statusDisplay =
      typeof rawStatus === "string" && rawStatus !== "-"
        ? `${rawStatus}`.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
        : "-";
    const isCompleted =
      typeof rawStatus === "string" &&
      ["completed", "complete"].includes(rawStatus.toLowerCase());
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
      index + 1 + (pagination.page - 1) * pagination.limit,
      dateAD,
      dateBS,
      particulars,
      categoryName,
      supplierName,
      `${CurrencySign}${Number(amount).toFixed(2)}`,
      paymentTermsDisplay,
      statusDisplay,
      paymentSourceName,
      <div className="flex items-center justify-center gap-3" key={`act-${id}`}>
        <div className="relative group">
          <FaEye
            size={18}
            className="text-[#0090DD] cursor-pointer"
            onClick={() => handleViewPurchase(id)}
          />
          <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
            View Purchase
          </span>
        </div>

        <button
          type="button"
          onClick={() => !isCompleted && handleNewUser(id)}
          title={isCompleted ? "Completed purchases cannot be edited" : "Edit"}
          disabled={isCompleted}
          className={`${isCompleted ? "opacity-50 cursor-not-allowed" : "hover:text-blue-800"}`}
          aria-disabled={isCompleted}
        >
          <div className="relative group">
            <MdEditSquare size={18} className="text-[#0090DD]" />
            <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
              Edit Purchase
            </span>
          </div>
        </button>
        <div className="relative group">
          <DeleteModal
            open={open}
            setOpen={setOpen}
            handleDeleteTrigger={() => handleDeleteTrigger(id)}
            handleConfirmDelete={handleDelete}
          />
          <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
            Delete Purchase
          </span>
        </div>
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

      {/* Drawer */}
      {openDrawer && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setOpenDrawer(false);
              setSelectedId(null);
            }}
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-xl border-l border-gray-200 overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Purchase Details</h3>
              <button
                className="px-3 py-1 rounded border hover:bg-gray-50"
                onClick={() => {
                  setOpenDrawer(false);
                  setSelectedId(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-4">
              {!purchaseDetailResp ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                (() => {
                  const d: any = (purchaseDetailResp as any)?.data || {};
                  const items: any[] = d?.purchaseItems || d?.items || [];
                  const supplier = d?.supplier || d?.vendor || {};
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">
                            Invoice Date
                          </div>
                          <div className="text-sm font-medium">
                            {(d?.invoiceDate || d?.date || "")
                              .toString()
                              .slice(0, 10) || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Supplier</div>
                          <div className="text-sm font-medium">
                            {supplier?.name ||
                              d?.supplierName ||
                              d?.vendorName ||
                              "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Invoice No.
                          </div>
                          <div className="text-sm font-medium">
                            {d?.invoiceNumber || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Payment Terms
                          </div>
                          <div className="text-sm font-medium">
                            {d?.paymentTerms || d?.paymentStatus || "-"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold mb-2">Items</div>
                        <div className="rounded border border-gray-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-2 border">#</th>
                                <th className="p-2 border">Particulars</th>
                                <th className="p-2 border">Qty</th>
                                <th className="p-2 border">Rate</th>
                                <th className="p-2 border">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.length === 0 ? (
                                <tr>
                                  <td
                                    className="p-3 text-center text-gray-500"
                                    colSpan={5}
                                  >
                                    No items
                                  </td>
                                </tr>
                              ) : (
                                items.map((it: any, i: number) => (
                                  <tr key={i}>
                                    <td className="p-2 border text-center">
                                      {i + 1}
                                    </td>
                                    <td className="p-2 border">
                                      {it.particulars || "-"}
                                    </td>
                                    <td className="p-2 border text-right">
                                      {it.quantity ?? it.qty ?? 0}
                                    </td>
                                    <td className="p-2 border text-right">
                                      {Number(it.rate ?? 0).toFixed(2)}
                                    </td>
                                    <td className="p-2 border text-right">
                                      {Number(
                                        (it.quantity ?? it.qty ?? 0) *
                                          (it.rate ?? 0),
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Status</div>
                          <div className="text-sm font-medium">
                            {d?.status || d?.purchaseStatus || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Total Amount
                          </div>
                          <div className="text-sm font-semibold">
                            {CurrencySign}
                            {Number(d?.totalAmount ?? d?.total ?? 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Purchase;
