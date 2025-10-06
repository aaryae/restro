import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import Drawer from "@/components/Drawer";
import {
  useDeleteRoleMutation,
  useGetRoleQuery,
} from "../../redux/services/role";
import { MdEditSquare } from "react-icons/md";
import Table from "@/components/Table";
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
import { ViewType } from "../Users";
import { FaCircleCheck } from "react-icons/fa6";
import { FaCircleXmark } from "react-icons/fa6";
import Spinner from "@/components/Spinner";

export default function Roles() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Roles");

  // for query
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  const [viewType, setViewType] = useState<ViewType>("list");

  // Defining States
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [drawerType, setDrawerType] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);

  // For Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  // Api Initialization
  const {
    data: allRoles,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetRoleQuery(query);
  const [deleteRole] = useDeleteRoleMutation();

  // Functions
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
  const handleReload = () => {
    refetch();
  };

  const toggleViewType = (type: ViewType) => {
    setViewType(type);
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
    page: allRoles?.data?.page ?? 1,
    limit: allRoles?.data?.limit ?? 10,
    total: allRoles?.data?.total ?? 0,
    totalPages: allRoles?.data?.totalPages ?? 0,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  // Content of the table
  const tableData =
    success && allRoles?.data?.data
      ? allRoles.data.data.map(({ id, title, updatedAt, isActive }) => [
          title,
          updatedAt ? moment(updatedAt).format("DD MMM, YYYY") : "",
          isActive ? (
            <span className="flex justify-center">
              {isActive ? (
                <FaCircleCheck className="text-[#0090dd]" />
              ) : (
                <FaCircleXmark className="text-red-500" />
              )}
            </span>
          ) : (
            ""
          ),
          <div
            key={id}
            className="flex items-center justify-center gap-[0.5rem]"
          >
            {accessList.includes("edit") && (
              <div className="relative group">
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD] cursor-pointer hover:text-blue-800 hover:opacity-80 transition-opacity"
                  onClick={() => handleEditRole(id)}
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                  Edit Role
                </span>
              </div>
            )}
            {accessList.includes("delete") && (
              <DeleteModal
                open={open}
                setOpen={setOpen}
                handleDeleteTrigger={() => handleDeleteTrigger(id)}
                handleConfirmDelete={handleDelete}
              />
            )}
          </div>,
        ])
      : [];

  if (loading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }
  return (
    <>
      <PageHeader
        hasViewType
        viewType={viewType}
        toggleViewType={toggleViewType}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Role")}
        handleNewButton={handleNewRole}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate(
          "Include Detailed Role Information in Each Section.",
        )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-between gap-x-[1.125rem] gap-y-[2.25rem]">
              {allRoles.data.data.map(({ id, title, updatedAt, isActive }) => (
                <button
                  key={id}
                  className="text-start space-y-[1rem] p-[0.75rem] bg-white min-w-[20rem] rounded-[0.75rem] cursor-pointer"
                >
                  <h2 className="font-[700] text-[#0091dd]">{title}</h2>
                  <p>
                    Updated at: &nbsp;{" "}
                    {moment(updatedAt).format("DD-MMM, YYYY")}
                  </p>
                  <p className="flex items-center gap-[2rem]">
                    {" "}
                    Active :{" "}
                    {isActive ? (
                      <FaCircleCheck className="text-[#0090dd]" />
                    ) : (
                      <FaCircleXmark className="text-red-500" />
                    )}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>Has No permissions to View Table</div>
      )}
      <Drawer isOpen={isOpen} setIsOpen={setIsOpen} width="w-[100%] md:w-[50%]">
        {drawerType === "add" ? (
          <AddRoleForm isOpen={isOpen} setIsOpen={setIsOpen} />
        ) : (
          <EditRoles id={editId} setIsOpen={setIsOpen} />
        )}
      </Drawer>
    </>
  );
}

const tableHeaders = ["Role", "Updated At", "Is Active", "Actions"];
