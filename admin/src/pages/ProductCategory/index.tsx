import MenuPageToolbar from "@/components/MenuPageToolbar";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { lazy, Suspense, useState } from "react";
import { SquarePen } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import TableRowActions from "@/components/Table/TableRowActions";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { PRODUCT_CATEGORY_ADD_ROUTE } from "@/routes/routeNames";
import { useDeleteProductCategoryByIdMutation } from "@/redux/services/productCategory";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery, useUpdateApiMutation } from "@/redux/services/crudApi";
import { buildQueryString } from "@/utils/generalHelper";
import Loader from "@/components/Loader";

const DraggableTable = lazy(() => import("@/components/Table/dragableTable"));

export default function ProductCategory() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Product Category");
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const url = buildQueryString("product-category/list", {
    page: query.page,
    limit: query.limit,
    search: { name: searchTerm },
  });

  const {
    data: allProductCategory,
    isSuccess: success,
    isLoading: loading,
    isFetching: fetching,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteProductCategory] = useDeleteProductCategoryByIdMutation();
  const [updateOrder] = useUpdateApiMutation();

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PRODUCT_CATEGORY_ADD_ROUTE)
      : navigate(`${PRODUCT_CATEGORY_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteProductCategory(deleteId).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page:
      allProductCategory?.data?.total === 0
        ? 0
        : allProductCategory?.data?.page,
    limit: allProductCategory?.data?.limit,
    total: allProductCategory?.data?.total,
    totalPages: allProductCategory?.data?.totalPages,
  };

  const tableHeaders = [
    "Category",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const tableData =
    success && allProductCategory?.data?.data
      ? allProductCategory.data.data.map(({ id, name }: { id: number; name: string }) => [
          id,
          <span className="text-sm font-semibold text-slate-800">{name}</span>,
          <TableRowActions>
            {accessList.includes("edit") && (
              <button
                type="button"
                onClick={() => handleNewUser(id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                title="Edit category"
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
        ])
      : [];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        searchPlaceholder="Search categories..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Category")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
        subText="Organize your menu items into categories."
      />

      {loading && !success ? (
        <Loader />
      ) : accessList.includes("view") ? (
        <Suspense fallback={<Loader />}>
          <DraggableTable
            headers={tableHeaders}
            data={tableData}
            loading={loading}
            fetching={fetching}
            url="product-category/update-order"
            action={updateOrder}
            success={success}
            pagination={pagination}
            handlePagination={handlePagination}
          />
        </Suspense>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view categories.
        </div>
      )}
    </div>
  );
}
