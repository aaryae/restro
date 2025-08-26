import DeleteModal from "@/components/DeleteModal";
import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import PageTitle from "@/components/PageTitle";
import Table from "@/components/Table";
import { DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { checkAccess } from "@/utils/accessHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import Spinner from "@/components/Spinner";
import { DEPARTMENT_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";
import { MdEditSquare } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import ViewDepartment from "./ViewDepartment";

interface DepartmentResponseType {
  id: number;
  name: string;
  description: string;
  slug: string;
  isActive: string;
  AvgPreparationTime: number;
  displayOrder: number;
  color: string;
}

export default function Department() {
  const accessList = checkAccess("Department");

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [drawerId, setOpenDrawerId] = useState<number | null>(null);

  const navigate = useNavigate();

  const {
    data: allDepartment,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url: `${DEPARTMENT_URL}list`, ...query });
  const [deleteBanner] = useDeleteApiMutation();

  const handleReload = () => {
    refetch();
  };

  const handleDrawerOpen = (id: number) => {
    setOpenDrawerId(id);
    setOpenDrawer(true);
  };

  const handleNewButton = (id: number | null) => {
    id === null
      ? navigate(DEPARTMENT_ADD_ROUTE)
      : navigate(`${DEPARTMENT_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletedId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteBanner(
        `${DEPARTMENT_URL}${deleteId}`,
      ).unwrap();
      handleResponse({
        res: response,
        onSuccess: () => {},
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page: allDepartment?.data?.page,
    limit: allDepartment?.data?.limit,
    total: allDepartment?.data?.total,
    totalPages: allDepartment?.data?.totalPages,
  };

  const tableHeaders = [
    "Name",
    "Average Preparation Time",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const tableData =
    success && allDepartment?.data?.data
      ? allDepartment?.data?.data.map(
          ({ id, name, AvgPreparationTime }: DepartmentResponseType) => [
            name,
            AvgPreparationTime,
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
      <PageTitle title="Department" />
      <PageHeader
        hasAddButton={true}
        newButtonText="Add New Department"
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
        <ViewDepartment id={drawerId} />
      </Drawer>
    </>
  );
}
