import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
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

  // for query
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  // for delete operation
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteBoolean, setDeleteBoolean] = useState<boolean>(false);

  const [viewType, setViewType] = useState<ViewType>("list");

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

  const handleReload = () => {
    refetch();
  };

  const toggleViewType = (type: ViewType) => {
    setViewType(type);
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
    refetch();
  };

  const tableData =
    success && allUsers?.data?.data
      ? allUsers.data?.data.map(
          ({ id, username, roles, gender, isActive, isDeleted }) => [
            username,
            roles?.title ? roles.title : "",
            gender,
            <div key={id} className="flex justify-center">
              <ToggleSwitch
                isActive={isActive}
                onToggle={(value) => handleToggle(id, value)}
              />
            </div>,
            <div
              key={id}
              className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
            >
              {accessList.includes("edit") && (
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD]"
                  onClick={() => handleNewUser(id)}
                />
              )}

              {accessList.includes("delete") && (
                <DeleteModal
                  open={open}
                  setOpen={setOpen}
                  handleDeleteTrigger={() => handleDeleteTrigger(id, isDeleted)}
                  handleConfirmDelete={handleDelete}
                />
              )}
            </div>,
          ],
        )
      : [];

  if (loading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <>
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New User")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={handleReload}
        hasViewType
        viewType={viewType}
        toggleViewType={toggleViewType}
        hasSubText
        subText={translate(
          "Add Comprehensive Client Information in Each Section",
        )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-between gap-x-[1.125rem] gap-y-[2.25rem]">
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
        <div>Has No permissions to View Table</div>
      )}
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-full lg:w-[50%]">
        <AddUserForm editId={editId} isOpen={isOpen} setIsOpen={setIsOpen} />
      </Drawer>
    </>
  );
}
