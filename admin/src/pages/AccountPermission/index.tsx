import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "@/components/PageTitle";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { PaginationType } from "@/types/commonTypes";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { ACCOUNT_ACCESS_ADD_ROUTE } from "@/routes/routeNames";

const AccountPermission = () => {
  const tableHeaders = [
    "S.No",
    "Account ID",
    "Account Name",
    "UserID",
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

  const handleNew = () => navigate(ACCOUNT_ACCESS_ADD_ROUTE);

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

  const data =
    success && items
      ? items.map((row: any, index: number) => {
          const userLabel = row?.user
            ? `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim() ||
              row.user.email
            : row?.userId;
          const accountLabel = row?.account?.name ?? row?.accountId;
          const accountId = row?.account?.id ?? row?.accountId;

          return [
            index + 1 + (pagination.page - 1) * pagination.limit,
            accountId,
            accountLabel,
            userLabel,
            row?.canView ? "Yes" : "No",
            row?.canEdit ? "Yes" : "No",
            row?.canDelete ? "Yes" : "No",
            <div
              key={row.id}
              className="flex items-center justify-center gap-3"
            >
              <div className="relative group">
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD] hover:text-blue-800 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    navigate(`/admin/account-permission/${row.id}`)
                  }
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                  Edit Permission
                </span>
              </div>
              <DeleteModal
                open={open}
                setOpen={setOpen}
                handleDeleteTrigger={() => handleDeleteTrigger(row.id)}
                handleConfirmDelete={handleDelete}
              />
            </div>,
          ];
        })
      : [];
  return (
    <>
      <PageTitle title="Account Permission" />
      <PageHeader
        hasAddButton={true}
        newButtonText="Add Account Permission"
        handleNewButton={handleNew}
        handleReloadButton={() => refetch()}
      />
      <Table
        headers={tableHeaders}
        data={data}
        pagination={pagination}
        handlePagination={handlePagination}
      />
    </>
  );
};

export default AccountPermission;
