import DeleteModal from "@/components/DeleteModal";
import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import { TABLE_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { checkAccess } from "@/utils/accessHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { FaEye } from "react-icons/fa";
import ViewTable from "./ViewTable";
import Spinner from "@/components/Spinner";
import { TABLE_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";
import { MdEditSquare } from "react-icons/md";

interface TableResponseType {
  id: number;
  tableNo: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  floor: {
    floorNo: string;
    name: string;
  };
}

export default function OrderTable() {
  const accessList = checkAccess("Table");

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [drawerId, setOpenDrawerId] = useState<number | null>(null);

  const navigate = useNavigate();

  const {
    data: allTable,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url: `${TABLE_URL}list`, ...query });
  const [deleteTable] = useDeleteApiMutation();

  const handleReload = () => {
    refetch();
  };

  const handleDrawerOpen = (id: number) => {
    setOpenDrawerId(id);
    setOpenDrawer(true);
  };

  const handleNewButton = (id: number | null) => {
    id === null
      ? navigate(TABLE_ADD_ROUTE)
      : navigate(`${TABLE_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletedId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteTable(`${TABLE_URL}${deleteId}`).unwrap();
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
    page: allTable?.data?.total === 0 ? 0 : allTable?.data?.page,
    limit: allTable?.data?.limit,
    total: allTable?.data?.total,
    totalPages: allTable?.data?.totalPages,
  };

  const tableHeaders = [
    "Table No",
    "Floor",
    "Status",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-orange-100 text-orange-800";
      case "reserved":
        return "bg-gray-100 text-gray-800";
      case "maintenance":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tableData =
    success && allTable?.data?.data
      ? allTable?.data?.data.map(
          ({ id, tableNo, status, floor }: TableResponseType) => [
            tableNo,
            floor.floorNo + "-" + floor?.name || "-",
            <span
              key={`status-${id}`}
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>,
            <div
              key={id}
              className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
            >
              {accessList.includes("view") && (
                <FaEye
                  size={18}
                  className="text-[#0090DD] cursor-pointer"
                  onClick={() => handleDrawerOpen(id)}
                />
              )}
              {accessList.includes("edit") && (
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD]"
                  onClick={() => handleNewButton(id)}
                />
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
          ],
        )
      : [];

  if (loading) {
    return <Spinner className="flex justify-center items-center h-full" />;
  }

  return (
    <>
      <PageTitle title="Table Management" />
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText="Add New Table"
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
        <ViewTable id={drawerId} />
      </Drawer>
    </>
  );
}
