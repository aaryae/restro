import { useEffect, useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import ListGridToggle from "@/components/ListGridToggle";
import Drawer from "@/components/Drawer";
import {
  useDeleteRoleMutation,
  useGetRoleQuery,
} from "../../redux/services/role";
import { MdEditSquare } from "react-icons/md";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import moment from "moment";
import AddRoleForm from "./AddRoleForm";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useNavigate } from "react-router-dom";
import EditRoles from "./EditRoles";
import { checkAccess } from "@/utils/accessHelper";
import useTranslation from "@/locale/useTranslation";
import DeleteModal from "@/components/DeleteModal";
import { PaginationType } from "@/types/commonTypes";
import { ROLE_LIST_ROUTE } from "@/routes/routeNames";
import type { ViewType } from "../Users";
import Spinner from "@/components/Spinner";

const tableHeaders = ["Role", "Updated At", "Is Active", "Actions"];

export default function Roles() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Roles");
  const [searchTerm, setSearchTerm] = useState("");

  const [query, setQuery] = useState({ page: 1, limit: 10, title: "" });
  const [viewType, setViewType] = useState<ViewType>("list");

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [drawerType, setDrawerType] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    setQuery((prev) => ({ ...prev, page: 1, title: searchTerm }));
  }, [searchTerm]);

  const {
    data: allRoles,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetRoleQuery(query);
  const [deleteRole] = useDeleteRoleMutation();

  const handleNewRole = () => {
    setDrawerType("add");
    setIsOpen(true);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleEditRole = (id: number) => {
    setEditId(id);
    setDrawerType("edit");
    setIsOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteRole(deleteId).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          navigate(ROLE_LIST_ROUTE);
        },
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page: allRoles?.data?.total === 0 ? 0 : allRoles?.data?.page,
    limit: allRoles?.data?.limit,
    total: allRoles?.data?.total,
    totalPages: allRoles?.data?.totalPages,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
  };

  const tableData =
    success && allRoles?.data?.data
      ? allRoles.data.data.map(({ id, title, updatedAt, isActive }) => [
          <span className="text-sm font-semibold text-slate-800">{title}</span>,
          updatedAt ? moment(updatedAt).format("DD MMM, YYYY") : "—",
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              isActive
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>,
          <TableRowActions>
            {accessList.includes("edit") && (
              <button
                type="button"
                onClick={() => handleEditRole(id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                title="Edit role"
              >
                <MdEditSquare size={16} />
              </button>
            )}
            {accessList.includes("delete") && (
              <DeleteModal
                compact
                open={open}
                setOpen={setOpen}
                handleDeleteTrigger={() => handleDeleteTrigger(id)}
                handleConfirmDelete={handleDelete}
              />
            )}
          </TableRowActions>,
        ])
      : [];

  if (loading) {
    return <Spinner className="flex h-full items-center justify-center" />;
  }

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search roles..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add Role")}
        handleNewButton={handleNewRole}
        handleReloadButton={() => refetch()}
        subText="Define roles and control what each user group can access."
        filters={
          <ListGridToggle viewType={viewType} onChange={setViewType} />
        }
      />

      {accessList.includes("view") ? (
        <div>
          {viewType === "list" ? (
            <Table
              isSN
              headers={tableHeaders}
              data={tableData}
              pagination={pagination}
              handlePagination={handlePagination}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allRoles.data.data.map(({ id, title, updatedAt, isActive }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleEditRole(id)}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <h2 className="text-sm font-semibold text-primaryColor">
                    {title}
                  </h2>
                  <p className="mt-2 text-[12px] text-slate-500">
                    Updated {moment(updatedAt).format("DD MMM, YYYY")}
                  </p>
                  <span
                    className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view roles.
        </div>
      )}

      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-[100%] md:w-[50%]">
        {drawerType === "add" ? (
          <AddRoleForm isOpen={isOpen} setIsOpen={setIsOpen} />
        ) : (
          <EditRoles id={editId} setIsOpen={setIsOpen} />
        )}
      </Drawer>
    </div>
  );
}
