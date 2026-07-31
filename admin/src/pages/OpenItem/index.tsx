import MenuPageToolbar from "@/components/MenuPageToolbar";
import MenuItemCell from "@/components/MenuItemCell";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { lazy, Suspense, useState } from "react";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import TableRowActions from "@/components/Table/TableRowActions";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { OPEN_ITEM_ADD_ROUTE } from "@/routes/routeNames";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import usePagination from "@/hooks/usePagination";
import {
  useDeleteApiMutation,
  useGetApiQuery,
} from "@/redux/services/crudApi";
import { OPEN_ITEM_URL } from "@/constants/apiUrlConstants";
import { buildQueryString } from "@/utils/generalHelper";
import Loader from "@/components/Loader";

const Table = lazy(() => import("@/components/Table"));

export default function OpenItem() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Open Item");
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const url = buildQueryString(`${OPEN_ITEM_URL}list`, {
    page: query.page,
    limit: query.limit,
    search: { name: searchTerm },
  });

  const {
    data: allOpenItem,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteOpenItem] = useDeleteApiMutation();

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(OPEN_ITEM_ADD_ROUTE)
      : navigate(`${OPEN_ITEM_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteOpenItem(
        `${OPEN_ITEM_URL}${deleteId}`,
      ).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page: allOpenItem?.data?.total === 0 ? 0 : allOpenItem?.data?.page,
    limit: allOpenItem?.data?.limit,
    total: allOpenItem?.data?.total,
    totalPages: allOpenItem?.data?.totalPages,
  };

  const tableHeaders = [
    "Item",
    "Price",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const tableData =
    success && allOpenItem?.data?.data
      ? allOpenItem.data.data.map(
          ({
            id,
            name,
            price,
            mediaArr,
          }: {
            id: number;
            name: string;
            price: number;
            mediaArr?: { imageUrl?: string }[];
          }) => [
            <MenuItemCell
              name={name}
              imageUrl={
                mediaArr?.[0]?.imageUrl
                  ? `${IMAGE_BASE_URL}${mediaArr[0].imageUrl}`
                  : null
              }
            />,
            <span className="font-semibold text-slate-800">
              {CurrencySign} {price}
            </span>,
            <TableRowActions>
              {accessList.includes("edit") && (
                <button
                  type="button"
                  onClick={() => handleNewUser(id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                  title="Edit open item"
                >
                  <MdEditSquare size={16} />
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

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search open items..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add Open Item")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
        subText="Quick one-off items you can add directly to orders."
      />

      {!success ? (
        <Loader />
      ) : accessList.includes("view") ? (
        <Suspense fallback={<Loader />}>
          <Table
            isSN
            headers={tableHeaders}
            data={tableData}
            pagination={pagination}
            handlePagination={handlePagination}
          />
        </Suspense>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view open items.
        </div>
      )}
    </div>
  );
}
