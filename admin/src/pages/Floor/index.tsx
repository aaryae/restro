import DeleteModal from "@/components/DeleteModal";
import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import { FLOOR_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { checkAccess } from "@/utils/accessHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { FaEye } from "react-icons/fa";
import ViewFloor from "./ViewFloor";
import Spinner from "@/components/Spinner";
import { FLOOR_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";
import { MdEditSquare } from "react-icons/md";

interface FloorResponseType {
  id: number;
  floorNo: string;
  name: string;
  description: string;
  isActive: boolean;
}

export default function Floor() {
  const accessList = checkAccess("Floor");

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [drawerId, setOpenDrawerId] = useState<number | null>(null);

  const navigate = useNavigate();

  const {
    data: allFloor,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url: `${FLOOR_URL}list`, ...query });
  const [deleteFloor] = useDeleteApiMutation();

  const handleReload = () => {
    refetch();
  };

  const handleDrawerOpen = (id: number) => {
    setOpenDrawerId(id);
    setOpenDrawer(true);
  };

  const handleNewButton = (id: number | null) => {
    id === null
      ? navigate(FLOOR_ADD_ROUTE)
      : navigate(`${FLOOR_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletedId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteFloor(`${FLOOR_URL}${deleteId}`).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {
          refetch();
        },
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page: allFloor?.data?.total === 0 ? 0 : allFloor?.data?.page,
    limit: allFloor?.data?.limit,
    total: allFloor?.data?.total,
    totalPages: allFloor?.data?.totalPages,
  };

  const tableHeaders = [
    "Floor No",
    "Name",
    "Status",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean);

  const tableData =
    success && allFloor?.data?.data
      ? allFloor?.data?.data.map(
          ({ id, floorNo, name, isActive }: FloorResponseType) => [
            floorNo,
            name,
            <span
              key={`status-${id}`}
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>,
            <div
              key={id}
              className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
            >
              {accessList.includes("view") && (
                <div className="relative group">
                  <FaEye
                    size={18}
                    className="text-[#0090DD] cursor-pointer hover:text-blue-800 hover:opacity-80 transition-opacity"
                    onClick={() => handleDrawerOpen(id)}
                  />
                  <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                    View Floor
                  </span>
                </div>
              )}
              {accessList.includes("edit") && (
                <div className="relative group">
                  <MdEditSquare
                    size={18}
                    className="text-[#0090DD] cursor-pointer hover:text-blue-800 hover:opacity-80 transition-opacity"
                    onClick={() => handleNewButton(id)}
                  />
                  <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                    Edit Floor
                  </span>
                </div>
              )}
              {accessList.includes("delete") && (
                <div className="relative group">
                  <DeleteModal
                    open={open}
                    setOpen={setOpen}
                    handleDeleteTrigger={() => handleDeleteTrigger(id)}
                    handleConfirmDelete={handleDelete}
                  />
                  <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                    Delete Floor
                  </span>
                </div>
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
      <PageTitle title="Floor Management" />
      <PageHeader
        hasAddButton={true}
        newButtonText="Add New Floor"
        handleNewButton={() => handleNewButton(null)}
        handleReloadButton={handleReload}
        hasSubText={false}
      />
      {accessList.includes("view") ? (
        <Table
          isSN
          headers={tableHeaders}
          data={tableData}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      ) : (
        <p>You don't have Permission to view this table</p>
      )}
      <Drawer
        isOpen={openDrawer}
        setIsOpen={setOpenDrawer}
        width="w-full lg:w-[30%]"
      >
        <ViewFloor id={drawerId} />
      </Drawer>
    </>
  );
}
