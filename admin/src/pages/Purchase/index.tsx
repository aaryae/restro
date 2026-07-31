import React, { useMemo, useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import FinanceQuickDateChips from "@/components/FinanceQuickDateChips";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import { CurrencySign } from "@/constants";
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
import { UserRound, Eye } from "lucide-react";
import { buildQueryString } from "@/utils/generalHelper";
import { PURCHASE_URL } from "@/constants/apiUrlConstants";
import { useGetApiQuery, useDeleteApiMutation } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { ADToBS } from "bikram-sambat-js";
import { PurchaseFilterSchema, type PurchaseFilterInput } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { subDays } from "date-fns";
import { checkAccess } from "@/utils/accessHelper";

const Purchase: React.FC = () => {
  const navigate = useNavigate();
  const accessList = checkAccess("Purchase");
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteApi] = useDeleteApiMutation();
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null,
  );

  const { control, handleSubmit, reset, setValue } =
    useForm<PurchaseFilterInput>({
      resolver: zodResolver(PurchaseFilterSchema),
      defaultValues: {
        date: undefined as any,
        supplierName: "",
        status: "",
      },
    });
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const toLocalDateString = (value: Date | string) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalizeFilters = (raw: Record<string, any>) => {
    const next = { ...raw };
    if (next.date) {
      next.date = toLocalDateString(next.date);
    }
    return Object.fromEntries(
      Object.entries(next).filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      ),
    );
  };

  const handleDateChange = (value: Date) => {
    setValue("date", value, { shouldDirty: true, shouldValidate: true });
    setSelectedDateFilter(null);
  };

  const applyFilters = (raw: Record<string, any>) => {
    setFilters(normalizeFilters(raw));
    setSelectedDateFilter(null);
    handlePagination({ page: 1, limit: query.limit });
  };

  const handleClearFilters = () => {
    reset({
      date: undefined as any,
      supplierName: "",
      status: "",
    });
    setFilters({});
    setSelectedDateFilter(null);
    handlePagination({ page: 1, limit: query.limit });
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
      },
      {
        name: "supplierName",
        label: "Supplier Name",
        Component: FilterInput,
        control,
        icon: <UserRound className="h-4 w-4" />,
      },
      {
        name: "status",
        label: "Status",
        Component: FilterSelect,
        className: "w-full",
        handleChange: (v: string) =>
          setValue("status", v as any, { shouldDirty: true }),
        options: [
          { label: "Any", value: "" },
          { label: "Draft", value: "draft" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ],
        control,
      },
    ],
    [control],
  );

  const { Component } = PageFilterSample(
    filterFields,
    handleSubmit,
    applyFilters,
    handleClearFilters,
  );

  const serverUrl = useMemo(() => {
    const search: Record<string, any> = {};
    if (filters?.date) {
      search.date =
        typeof filters.date === "string"
          ? filters.date
          : toLocalDateString(filters.date);
    } else if (selectedDateFilter) {
      const today = new Date();
      const date =
        selectedDateFilter === "yesterday" ? subDays(today, 1) : today;
      search.date = toLocalDateString(date);
    }
    if (filters?.status) {
      search.status = String(filters.status).toLowerCase();
    }
    return buildQueryString("purchase/list", {
      page: query.page,
      limit: query.limit,
      search,
    });
  }, [filters, query.page, query.limit, selectedDateFilter]);

  const { data: apiData, refetch } = useGetApiQuery({ url: serverUrl });
  const { data: purchaseDetailResp } = useGetApiQuery(
    { url: selectedId ? `${PURCHASE_URL}${selectedId}` : "" },
    { skip: !openDrawer || !selectedId },
  );

  const accountUrl = useMemo(
    () => buildQueryString("account/list", { page: 1, limit: 50 }),
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
    (accessList.includes("view-one") ||
      accessList.includes("edit") ||
      accessList.includes("delete")) &&
      "Actions",
  ].filter(Boolean) as string[];

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

  const showActions =
    accessList.includes("view-one") ||
    accessList.includes("edit") ||
    accessList.includes("delete");

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

    const row = [
      index + 1 + (pagination.page - 1) * pagination.limit,
      dateAD,
      dateBS,
      <span className="block max-w-full truncate" title={particulars}>
        {particulars}
      </span>,
      categoryName,
      supplierName,
      <span className="font-semibold text-slate-800">
        {CurrencySign}
        {Number(amount).toFixed(2)}
      </span>,
      paymentTermsDisplay,
      statusDisplay,
      paymentSourceName,
    ];

    if (showActions) {
      row.push(
        <TableRowActions>
          {accessList.includes("view-one") && (
            <button
              type="button"
              onClick={() => handleViewPurchase(id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
              title="View purchase"
            >
              <Eye size={16} />
            </button>
          )}
          {accessList.includes("edit") && (
            <button
              type="button"
              onClick={() => handleNewUser(id)}
              title="Edit"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
            >
              <MdEditSquare size={16} />
            </button>
          )}
          {accessList.includes("delete") && (
            <DeleteModal
              compact
              open={open}
              setOpen={setOpen}
              itemId={id}
              activeId={deleteId}
              handleDeleteTrigger={() => handleDeleteTrigger(id)}
              handleConfirmDelete={handleDelete}
              title="Do you want to delete this purchase?"
              description="Completed purchases refund the payment account when deleted. You can restore from Settings → Recently Deleted (kept for 30 days)."
            />
          )}
        </TableRowActions>,
      );
    }

    return row;
  });

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        showSearch={false}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Purchase"
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
        subText="Manage supplier purchases, invoices, and payment status."
        filters={
          <FinanceQuickDateChips
            selected={selectedDateFilter}
            onSelect={(value) => {
              setSelectedDateFilter(value);
              setValue("date", undefined as any);
              setFilters({});
              handlePagination({ page: 1, limit: query.limit });
            }}
            onClear={() => {
              setSelectedDateFilter(null);
              handlePagination({ page: 1, limit: query.limit });
            }}
          />
        }
      />

      <PageFilterWrapper title="Purchase Filters">{Component}</PageFilterWrapper>

      {accessList.includes("view") ? (
      <Table
        headers={headers}
        data={data}
        pagination={pagination}
        handlePagination={(p) => handlePagination({ ...p, total })}
      />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view purchases.
        </div>
      )}

      {accessList.includes("view-one") && openDrawer ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setOpenDrawer(false);
              setSelectedId(null);
            }}
          />
          <div className="absolute right-0 top-0 h-full w-full overflow-y-auto border-l border-slate-200 bg-white shadow-xl sm:w-[480px]">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Purchase Details
              </h3>
              <button
                type="button"
                className="h-8 rounded-lg border border-slate-200 px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
                onClick={() => {
                  setOpenDrawer(false);
                  setSelectedId(null);
                }}
              >
                Close
              </button>
            </div>
            <div className="space-y-4 p-4">
              {!purchaseDetailResp ? (
                <div className="text-sm text-slate-500">Loading...</div>
              ) : (
                (() => {
                  const d: any = (purchaseDetailResp as any)?.data || {};
                  const items: any[] = d?.purchaseItems || d?.items || [];
                  const supplier = d?.supplier || d?.vendor || {};
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-slate-500">
                            Invoice Date
                          </div>
                          <div className="text-sm font-medium text-slate-800">
                            {(d?.invoiceDate || d?.date || "")
                              .toString()
                              .slice(0, 10) || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Supplier</div>
                          <div className="text-sm font-medium text-slate-800">
                            {supplier?.name ||
                              d?.supplierName ||
                              d?.vendorName ||
                              "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">
                            Invoice No.
                          </div>
                          <div className="text-sm font-medium text-slate-800">
                            {d?.invoiceNumber || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">
                            Payment Terms
                          </div>
                          <div className="text-sm font-medium text-slate-800">
                            {d?.paymentTerms || d?.paymentStatus || "-"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-semibold text-slate-700">
                          Items
                        </div>
                        <div className="overflow-hidden rounded-lg border border-slate-200">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="border-b border-slate-200 p-2">
                                  #
                                </th>
                                <th className="border-b border-slate-200 p-2">
                                  Particulars
                                </th>
                                <th className="border-b border-slate-200 p-2">
                                  Qty
                                </th>
                                <th className="border-b border-slate-200 p-2">
                                  Rate
                                </th>
                                <th className="border-b border-slate-200 p-2">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.length === 0 ? (
                                <tr>
                                  <td
                                    className="p-3 text-center text-slate-500"
                                    colSpan={5}
                                  >
                                    No items
                                  </td>
                                </tr>
                              ) : (
                                items.map((it: any, i: number) => (
                                  <tr key={i}>
                                    <td className="border-b border-slate-100 p-2 text-center">
                                      {i + 1}
                                    </td>
                                    <td className="border-b border-slate-100 p-2">
                                      {it.particulars || "-"}
                                    </td>
                                    <td className="border-b border-slate-100 p-2 text-right">
                                      {it.quantity ?? it.qty ?? 0}
                                    </td>
                                    <td className="border-b border-slate-100 p-2 text-right">
                                      {Number(it.rate ?? 0).toFixed(2)}
                                    </td>
                                    <td className="border-b border-slate-100 p-2 text-right">
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
                          <div className="text-xs text-slate-500">Status</div>
                          <div className="text-sm font-medium text-slate-800">
                            {d?.status || d?.purchaseStatus || "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">
                            Total Amount
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
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
      ) : null}
    </div>
  );
};

export default Purchase;
