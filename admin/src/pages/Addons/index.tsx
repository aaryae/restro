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
import { ADDONS_ADD_ROUTE } from "@/routes/routeNames";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import usePagination from "@/hooks/usePagination";
import {
  useDeleteApiMutation,
  useGetApiQuery,
} from "@/redux/services/crudApi";
import { ADDON_URL } from "@/constants/apiUrlConstants";
import { buildQueryString } from "@/utils/generalHelper";
import Loader from "@/components/Loader";

const Table = lazy(() => import("@/components/Table"));

const Addons = () => {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Addons");
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [deleteModelOpen, setDeleteModelOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const url = buildQueryString(`${ADDON_URL}`, {
    page: query.page,
    limit: query.limit,
    search: { search: searchTerm },
  });

  const { data, isSuccess, refetch, isLoading } = useGetApiQuery({ url });
  const [deleteApi] = useDeleteApiMutation();

  const handleNewAddon = (id: number | null) => {
    id === null
      ? navigate(ADDONS_ADD_ROUTE)
      : navigate(`${ADDONS_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await deleteApi(`${ADDON_URL}${deleteId}`).unwrap();
      handleResponse({ res, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
      setDeleteId(null);
    }
  };

  const pagination = {
    page: data?.data?.total === 0 ? 0 : data?.data?.page,
    limit: data?.data?.limit,
    total: data?.data?.total,
    totalPages: data?.data?.totalPages,
  };

  const headers = [
    "Addon",
    "Price",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const getAddonImage = (item: any) => {
    if (item.imageUrl) {
      return item.imageUrl.startsWith("http")
        ? item.imageUrl
        : `${IMAGE_BASE_URL}${item.imageUrl}`;
    }
    if (item.mediaArr?.[0]?.imageUrl) {
      return `${IMAGE_BASE_URL}${item.mediaArr[0].imageUrl}`;
    }
    return null;
  };

  const tableData =
    isSuccess && data?.data?.data
      ? data.data.data.map((item: any) => [
          <MenuItemCell name={item.name} imageUrl={getAddonImage(item)} />,
          <span className="font-semibold text-slate-800">
            {CurrencySign} {item.price}
          </span>,
          <TableRowActions>
            {accessList.includes("edit") && (
              <button
                type="button"
                onClick={() => handleNewAddon(item.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                title="Edit addon"
              >
                <MdEditSquare size={16} />
              </button>
            )}
            {accessList.includes("delete") && (
              <DeleteModal
                compact
                open={deleteModelOpen}
                setOpen={setDeleteModelOpen}
                  itemId={item.id}
                  activeId={deleteId}
                handleDeleteTrigger={() => handleDeleteTrigger(item.id)}
                handleConfirmDelete={handleDelete}
              />
            )}
          </TableRowActions>,
        ])
      : [];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search addons..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Addon")}
        handleNewButton={() => handleNewAddon(null)}
        handleReloadButton={() => refetch()}
        subText="Extras and add-ons that can be linked to menu items."
      />

      {isLoading ? (
        <Loader />
      ) : accessList.includes("view") ? (
        <Suspense fallback={<Loader />}>
          <Table
            isSN
            headers={headers}
            data={tableData}
            pagination={pagination}
            handlePagination={handlePagination}
          />
        </Suspense>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view addons.
        </div>
      )}
    </div>
  );
};

export default Addons;
