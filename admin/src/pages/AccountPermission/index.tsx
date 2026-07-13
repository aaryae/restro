import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { ACCOUNT_PERMISSION_ADD_ROUTE } from "@/routes/routeNames";

const AccountPermission = () => {
  const tableHeaders = [
    "Account ID",
    "Account Name",
    "User",
    "Can View",
    "Can Edit",
    "Can Delete",
    "Actions",
  ];

  const navigate = useNavigate();
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const url = buildQueryString("account-permission/list", {
    page: query.page,
    limit: query.limit,
  });

  const {
    data: allData,
    isSuccess: success,
    refetch,
  } = useGetApiQuery({ url });
  const [deletePermission] = useDeleteApiMutation();

  const pagination: PaginationType = {
    page: allData?.data?.total === 0 ? 0 : allData?.data?.page,
    limit: allData?.data?.limit ?? query.limit,
    total: allData?.data?.total ?? 0,
    totalPages: allData?.data?.totalPages ?? 0,
  };

  const items: any[] = useMemo(() => {
    const data: any = (allData as any)?.data ?? allData;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [allData]);

  const handleNew = () => navigate(ACCOUNT_PERMISSION_ADD_ROUTE);

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deletePermission(
        `account-permission/${deleteId}`,
      ).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => refetch(),
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const boolBadge = (value: boolean) => (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        value
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );

  const data =
    success && items
      ? items.map((row: any) => {
          const userLabel = row?.user
            ? `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim() ||
              row.user.email
            : row?.userId;
          const accountLabel = row?.account?.name ?? row?.accountId;
          const accountId = row?.account?.id ?? row?.accountId;

          return [
            accountId,
            <span className="text-sm font-medium text-slate-800">
              {accountLabel}
            </span>,
            userLabel,
            boolBadge(Boolean(row?.canView)),
            boolBadge(Boolean(row?.canEdit)),
            boolBadge(Boolean(row?.canDelete)),
            <TableRowActions>
              <button
                type="button"
                onClick={() => navigate(`/admin/account-permission/${row.id}`)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                title="Edit permission"
              >
                <MdEditSquare size={16} />
              </button>
              <DeleteModal
                compact
                open={open}
                setOpen={setOpen}
                  itemId={row.id}
                  activeId={deleteId}
                handleDeleteTrigger={() => handleDeleteTrigger(row.id)}
                handleConfirmDelete={handleDelete}
              />
            </TableRowActions>,
          ];
        })
      : [];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        showSearch={false}
        hasAddButton
        newButtonText="Add Permission"
        handleNewButton={handleNew}
        handleReloadButton={() => refetch()}
        subText="Control which users can view, edit, or delete each cash and bank account."
      />
      <Table
        isSN
        headers={tableHeaders}
        data={data}
        pagination={pagination}
        handlePagination={handlePagination}
      />
    </div>
  );
};

export default AccountPermission;
