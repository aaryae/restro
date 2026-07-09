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
  useUpdateUserMutation,
} from "../../redux/services/authentication";
import { MdEditSquare } from "react-icons/md";
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
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const handleNewUser = (id: number | null) => {
    setEditId(id);
    setIsOpen(true);
  };

  const handleDeleteTrigger = (id: number, isDeleted: boolean) => {
    setDeleteId(id);
    setDeleteBoolean(isDeleted);
    setOpen(true);
  };

  const handleToggle = async (id: number, value: boolean) => {
    const body = { isActive: value };
    try {
      const response = await updateUser({ id, body }).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
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
          ({ id, username, roles, gender, isActive, isDeleted }) => [
            <span className="text-sm font-semibold text-slate-800">
              {username}
            </span>,
            roles?.title ? roles.title : "—",
            <span className="capitalize text-slate-600">{gender}</span>,
            <div key={id} className="flex justify-center">
              <ToggleSwitch
                isActive={isActive}
                onToggle={(value) => handleToggle(id, value)}
              />
            </div>,
            <TableRowActions>
              {accessList.includes("edit") && (
                <button
                  type="button"
                  onClick={() => handleNewUser(id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                  title="Edit user"
                >
                  <MdEditSquare size={16} />
                </button>
              )}
              {accessList.includes("delete") && (
                <DeleteModal
                  compact
                  open={open}
                  setOpen={setOpen}
                  handleDeleteTrigger={() =>
                    handleDeleteTrigger(id, isDeleted)
                  }
                  handleConfirmDelete={handleDelete}
                />
              )}
            </TableRowActions>,
          ],
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
        handleReloadButton={() => refetch()}
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allUsers?.data?.data.map(
                ({
                  id,
                  firstName,
                  lastName,
                  gender,
                  imageUrl,
                  mobileNo,
                  email,
                }) => (
                  <Card1
                    key={id}
                    handleNewUser={(id) => handleNewUser(id)}
                    imageUrl={imageUrl}
                    id={id}
                    firstName={firstName}
                    lastName={lastName}
                    gender={gender}
                    email={email}
                    mobileNo={mobileNo}
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

      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-full lg:w-[50%]">
        <AddUserForm editId={editId} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Drawer>
    </div>
  );
}
