import DeleteModal from "@/components/DeleteModal";
import Drawer from "@/components/Drawer";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { TABLE_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { checkAccess } from "@/utils/accessHelper";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { Eye, SquarePen } from "lucide-react";
import ViewTable from "./ViewTable";
import Spinner from "@/components/Spinner";
import { TABLE_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";

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
  const [searchTerm, setSearchTerm] = useState("");

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [drawerId, setOpenDrawerId] = useState<number | null>(null);

  const navigate = useNavigate();

  const url = buildQueryString(`${TABLE_URL}list`, {
    page: query.page,
    limit: query.limit,
    search: { tableNo: searchTerm },
  });

  const {
    data: allTable,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteTable] = useDeleteApiMutation();

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
  ].filter(Boolean) as string[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
      case "occupied":
        return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
      case "reserved":
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
      case "maintenance":
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
      default:
        return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    }
  };

  const tableData =
    success && allTable?.data?.data
      ? allTable?.data?.data.map(
          ({ id, tableNo, status, floor }: TableResponseType) => [
            <span className="text-sm font-semibold text-slate-800">
              {tableNo}
            </span>,
            floor.floorNo + "-" + floor?.name || "-",
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${getStatusColor(status)}`}
            >
              {status}
            </span>,
            <TableRowActions>
              {accessList.includes("view") && (
                <button
                  type="button"
                  onClick={() => handleDrawerOpen(id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                  title="View table"
                >
                  <Eye size={16} />
                </button>
              )}
              {accessList.includes("edit") && (
                <button
                  type="button"
                  onClick={() => handleNewButton(id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                  title="Edit table"
                >
                  <SquarePen />
                </button>
              )}
              {accessList.includes("delete") && (
                <DeleteModal
                  compact
                  open={open}
                  setOpen={setOpen}
                  itemId={id}
                  activeId={deleteId}
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
        searchPlaceholder="Search by table number..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Table"
        handleNewButton={() => handleNewButton(null)}
        handleReloadButton={() => refetch()}
        subText="Configure tables per floor and track availability status."
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
          You do not have permission to view tables.
        </div>
      )}

      <Drawer
        isOpen={openDrawer}
        setIsOpen={setOpenDrawer}
        width="w-full lg:w-[30%]"
      >
        <ViewTable id={drawerId} />
      </Drawer>
    </div>
  );
}
