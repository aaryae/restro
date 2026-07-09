import DeleteModal from "@/components/DeleteModal";
import Drawer from "@/components/Drawer";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { DEPARTMENT_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { checkAccess } from "@/utils/accessHelper";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { Eye } from "lucide-react";
import Spinner from "@/components/Spinner";
import { DEPARTMENT_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";
import { MdEditSquare } from "react-icons/md";
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
  const [searchTerm, setSearchTerm] = useState("");

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [drawerId, setOpenDrawerId] = useState<number | null>(null);

  const navigate = useNavigate();

  const url = buildQueryString(`${DEPARTMENT_URL}list`, {
    page: query.page,
    limit: query.limit,
    search: { name: searchTerm },
  });

  const {
    data: allDepartment,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteBanner] = useDeleteApiMutation();

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
    page: allDepartment?.data?.total === 0 ? 0 : allDepartment?.data?.page,
    limit: allDepartment?.data?.limit,
    total: allDepartment?.data?.total,
    totalPages: allDepartment?.data?.totalPages,
  };

  const tableHeaders = [
    "Name",
    "Avg. Prep Time",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const tableData =
    success && allDepartment?.data?.data
      ? allDepartment?.data?.data.map(
          ({ id, name, AvgPreparationTime }: DepartmentResponseType) => [
            <span className="text-sm font-semibold text-slate-800">{name}</span>,
            <span className="text-slate-600">
              {AvgPreparationTime != null ? `${AvgPreparationTime} min` : "—"}
            </span>,
            <TableRowActions>
              {accessList.includes("view") && (
                <button
                  type="button"
                  onClick={() => handleDrawerOpen(id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                  title="View department"
                >
                  <Eye size={16} />
                </button>
              )}
              {accessList.includes("edit") && (
                <button
                  type="button"
                  onClick={() => handleNewButton(id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                  title="Edit department"
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
          ],
        )
      : [];

  if (loading) {
    return <Spinner className="flex h-full items-center justify-center" />;
  }

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search departments..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Department"
        handleNewButton={() => handleNewButton(null)}
        handleReloadButton={() => refetch()}
        subText="Kitchen and bar departments used for KOT routing and prep times."
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
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view departments.
        </div>
      )}

      <Drawer
        isOpen={openDrawer}
        setIsOpen={setOpenDrawer}
        width="w-full lg:w-[30%]"
      >
        <ViewDepartment id={drawerId} />
      </Drawer>
    </div>
  );
}
