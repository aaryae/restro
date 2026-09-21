import React, { lazy, useState, useMemo } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { EntityFormDialog } from "@/components/EntityForm";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import { useFormModal } from "@/hooks/useFormModal";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { SquarePen } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { checkAccess } from "@/utils/accessHelper";

const AddEditAccountPermission = lazy(
  () => import("./AddEditAccountPermission"),
);

const AccountPermission = () => {
  const accessList = checkAccess("Account Permission");
  const formModal = useFormModal();
  const tableHeaders = [
    "Account ID",
    "Account Name",
    "User",
    "Can View",
    "Can Edit",
    "Can Delete",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

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

  const handleNew = (id: number | null = null) => {
    if (id === null) formModal.openAdd();
    else formModal.openEdit(id);
  };

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

  const showActions =
    accessList.includes("edit") || accessList.includes("delete");

  const data =
    success && items
      ? items.map((row: any) => {
          const userLabel = row?.user
            ? `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim() ||
              row.user.email
            : row?.userId;
          const accountLabel = row?.account?.name ?? row?.accountId;
          const accountId = row?.account?.id ?? row?.accountId;

          const cells = [
            accountId,
            <span className="text-sm font-medium text-slate-800">
              {accountLabel}
            </span>,
            userLabel,
            boolBadge(Boolean(row?.canView)),
            boolBadge(Boolean(row?.canEdit)),
            boolBadge(Boolean(row?.canDelete)),
          ];

          if (showActions) {
            cells.push(
              <TableRowActions>
                {accessList.includes("edit") && (
                  <button
                    type="button"
                    onClick={() => handleNew(row.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                    title="Edit permission"
                  >
                    <SquarePen size={16} />
                  </button>
                )}
                {accessList.includes("delete") && (
                  <DeleteModal
                    compact
                    open={open}
                    setOpen={setOpen}
                    itemId={row.id}
                    activeId={deleteId}
                    handleDeleteTrigger={() => handleDeleteTrigger(row.id)}
                    handleConfirmDelete={handleDelete}
                  />
                )}
              </TableRowActions>,
            );
          }

          return cells;
        })
      : [];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        title="Account Permissions"
        showSearch={false}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Permission"
        handleNewButton={() => handleNew(null)}
        handleReloadButton={() => refetch()}
        subText="Control which users can view, edit, or delete each cash and bank account."
      />
      {accessList.includes("view") ? (
        <Table
          isSN
          headers={tableHeaders}
          data={data}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view account permissions.
        </div>
      )}

      <EntityFormDialog
        open={formModal.open}
        onOpenChange={formModal.onOpenChange}
        title={
          formModal.isEdit
            ? "Edit Account Permission"
            : "Add Account Permission"
        }
        description="Choose user, account, and access rights."
        size="lg"
      >
        <AddEditAccountPermission
          key={formModal.editId ?? "new"}
          id={formModal.editId}
          isComponent
          closeModal={formModal.close}
          onSuccess={() => refetch()}
        />
      </EntityFormDialog>
    </div>
  );
};

export default AccountPermission;
