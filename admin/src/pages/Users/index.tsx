import { useEffect, useState } from "react";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import ListGridToggle from "@/components/ListGridToggle";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import Drawer from "@/components/Drawer";
import AddUserForm from "./AddUserForm";
import {
  useDeleteUserMutation,
  useGetAllUserQuery,
  useToggleUserActiveMutation,
} from "../../redux/services/authentication";
import { SquarePen } from "lucide-react";
import { handleError, handleResponse } from "../../utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { checkAccess } from "@/utils/accessHelper";
import useTranslation from "@/locale/useTranslation";
import DeleteModal from "@/components/DeleteModal";
import ToggleSwitch from "@/components/Switch";
import { USER_LIST_ROUTE } from "@/routes/routeNames";
import { PaginationType } from "@/types/commonTypes";
import Card1 from "@/components/GridView/card1";
import Spinner from "@/components/Spinner";

const tableHeaders = ["Username", "Role", "Gender", "Is Active", "Actions"];

export type ViewType = "list" | "grid";

function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export default function Users() {
  const translate = useTranslation();
  const navigate = useNavigate();

  const accessList = checkAccess("Users");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [query, setQuery] = useState({ page: 1, limit: 10, username: "" });

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteBoolean, setDeleteBoolean] = useState<boolean>(false);
  /** Optimistic active flags keyed by user id — keeps toggles snappy while the list refetches. */
  const [activeOverrides, setActiveOverrides] = useState<
    Record<number, boolean>
  >({});
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [viewType, setViewType] = useState<ViewType>("list");

  useEffect(() => {
    setQuery((prev) => ({ ...prev, page: 1, username: searchTerm }));
  }, [searchTerm]);

  const {
    data: allUsers,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetAllUserQuery(query);
  const [toggleUserActive] = useToggleUserActiveMutation();
  const [deleteUser] = useDeleteUserMutation();

  // Drop overrides once server data matches, so we don't fight the cache.
  useEffect(() => {
    if (!allUsers?.data?.data) return;
    setActiveOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const row of allUsers.data.data) {
        if (
          Object.prototype.hasOwnProperty.call(next, row.id) &&
          toBool(next[row.id]) === toBool(row.isActive)
        ) {
          delete next[row.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [allUsers]);

  const handleNewUser = (id: number | null) => {
    setEditId(id);
    setIsOpen(true);
  };

  const handleDeleteTrigger = (id: number, isDeleted: boolean) => {
    setDeleteId(id);
    setDeleteBoolean(isDeleted);
    setOpen(true);
  };

  const resolveActive = (id: number, serverValue: unknown) =>
    Object.prototype.hasOwnProperty.call(activeOverrides, id)
      ? activeOverrides[id]
      : toBool(serverValue);

  const handleToggle = async (id: number, value: boolean) => {
    const previous = resolveActive(
      id,
      allUsers?.data?.data?.find((u: { id: number }) => u.id === id)?.isActive,
    );
    setActiveOverrides((prev) => ({ ...prev, [id]: value }));
    setTogglingId(id);
    try {
      const response = await toggleUserActive({ id, isActive: value }).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      setActiveOverrides((prev) => ({ ...prev, [id]: previous }));
      handleError({ error });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    const body = { isDeleted: !deleteBoolean };
    try {
      const response = await deleteUser({ body, id: deleteId }).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          navigate(`${USER_LIST_ROUTE}`);
        },
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page: allUsers?.data?.total === 0 ? 0 : allUsers?.data?.page,
    limit: allUsers?.data?.limit ?? 10,
    total: allUsers?.data?.total ?? 0,
    totalPages: allUsers?.data?.totalPages ?? 0,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
  };

  const tableData =
    success && allUsers?.data?.data
      ? allUsers.data?.data.map(
          ({ id, username, roles, gender, isActive, isDeleted }) => {
            const active = resolveActive(id, isActive);
            return [
              <span key={`u-${id}`} className="text-sm font-semibold text-slate-800">
                {username}
              </span>,
              roles?.title ? roles.title : "—",
              <span key={`g-${id}`} className="capitalize text-slate-600">
                {gender}
              </span>,
              <div key={`a-${id}`} className="flex w-full items-center justify-center">
                {accessList.includes("toggle-isActive") ? (
                  <ToggleSwitch
                    isActive={active}
                    disabled={togglingId === id}
                    onToggle={(value) => handleToggle(id, value)}
                  />
                ) : (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      active
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                    }`}
                  >
                    {active ? "Active" : "Inactive"}
                  </span>
                )}
              </div>,
              <TableRowActions key={`act-${id}`}>
                {accessList.includes("edit") && (
                  <button
                    type="button"
                    onClick={() => handleNewUser(id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                    title="Edit user"
                  >
                    <SquarePen size={16} />
                  </button>
                )}
                {accessList.includes("delete") && (
                  <DeleteModal
                    compact
                    open={open}
                    setOpen={setOpen}
                    itemId={id}
                    activeId={deleteId}
                    handleDeleteTrigger={() =>
                      handleDeleteTrigger(id, isDeleted)
                    }
                    handleConfirmDelete={handleDelete}
                  />
                )}
              </TableRowActions>,
            ];
          },
        )
      : [];

  if (loading) {
    return <Spinner className="flex h-full items-center justify-center" />;
  }

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search users..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add User")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => {
          setSearchTerm("");
          setQuery((prev) => ({ ...prev, page: 1, username: "" }));
          if (!searchTerm) {
            void refetch();
          }
        }}
        subText="Manage staff accounts, roles, and access permissions."
        filters={
          <ListGridToggle viewType={viewType} onChange={setViewType} />
        }
      />

      {accessList.includes("view") ? (
        <div>
          {viewType === "list" ? (
            <Table
              headers={tableHeaders}
              data={tableData}
              isSN
              pagination={pagination}
              handlePagination={handlePagination}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {allUsers?.data?.data.map(
                ({
                  id,
                  firstName,
                  lastName,
                  gender,
                  imageUrl,
                  mobileNo,
                  email,
                  username,
                  roles,
                  isActive,
                }) => (
                  <Card1
                    key={id}
                    handleNewUser={(id) => handleNewUser(id)}
                    canEdit={accessList.includes("edit")}
                    imageUrl={imageUrl}
                    id={id}
                    firstName={firstName}
                    lastName={lastName}
                    gender={gender}
                    email={email}
                    mobileNo={mobileNo}
                    username={username}
                    roleTitle={roles?.title}
                    isActive={resolveActive(id, isActive)}
                  />
                ),
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view users.
        </div>
      )}

      <Drawer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        width="w-full lg:w-[50%] xl:w-[42rem]"
        contentClassName="p-0"
      >
        <AddUserForm editId={editId} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Drawer>
    </div>
  );
}
