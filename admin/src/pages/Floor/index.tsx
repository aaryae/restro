import DeleteModal from "@/components/DeleteModal";
import Drawer from "@/components/Drawer";
import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import { FLOOR_URL } from "@/constants/apiUrlConstants";
import usePagination from "@/hooks/usePagination";
import {
  useDeleteApiMutation,
  useGetApiQuery,
  usePatchApiMutation,
} from "@/redux/services/crudApi";
import { checkAccess } from "@/utils/accessHelper";
import { buildQueryString } from "@/utils/generalHelper";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useState } from "react";
import { Eye } from "lucide-react";
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
  const [patchApi] = usePatchApiMutation();
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [searchTerm, setSearchTerm] = useState("");

  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeletedId] = useState<number | null>(null);

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [drawerId, setOpenDrawerId] = useState<number | null>(null);

  const navigate = useNavigate();

  const url = buildQueryString(`${FLOOR_URL}list`, {
    page: query.page,
    limit: query.limit,
    search: { name: searchTerm },
  });

  const {
    data: allFloor,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteFloor] = useDeleteApiMutation();

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

  const handleFloorStatus = async (id: number, isActive: boolean) => {
    try {
      const res = await patchApi({
        url: `${FLOOR_URL}${id}`,
        body: { status: isActive ? "inactive" : "active" },
      }).unwrap();
      handleResponse({
        res,
        onSuccess: () => {
          refetch();
        },
      });
    } catch (error) {
      handleError({ error });
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
  ].filter(Boolean) as string[];

  const tableData =
    success && allFloor?.data?.data
      ? allFloor?.data?.data.map(
          ({ id, floorNo, name, isActive }: FloorResponseType) => [
            <span className="font-medium text-slate-700">{floorNo}</span>,
            <span className="text-sm font-semibold text-slate-800">{name}</span>,
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
              {accessList.includes("view") && (
                <button
                  type="button"
                  onClick={() => handleDrawerOpen(id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                  title="View floor"
                >
                  <Eye size={16} />
                </button>
              )}
              {accessList.includes("edit") && (
                <>
                  <button
                    type="button"
                    onClick={() => handleNewButton(id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                    title="Edit floor"
                  >
                    <MdEditSquare size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFloorStatus(id, isActive)}
                    className={`inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-[11px] font-medium transition ${
                      isActive
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                </>
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
        searchPlaceholder="Search floors..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText="Add Floor"
        handleNewButton={() => handleNewButton(null)}
        handleReloadButton={() => refetch()}
        subText="Define dining floors and control which ones are active."
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
          You do not have permission to view floors.
        </div>
      )}

      <Drawer
        isOpen={openDrawer}
        setIsOpen={setOpenDrawer}
        width="w-full lg:w-[30%]"
      >
        <ViewFloor id={drawerId} />
      </Drawer>
    </div>
  );
}
