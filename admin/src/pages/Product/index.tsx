import MenuPageToolbar from "@/components/MenuPageToolbar";
import MenuItemCell from "@/components/MenuItemCell";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { lazy, Suspense, useState, useMemo } from "react";
import { SquarePen, Upload } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import TableRowActions from "@/components/Table/TableRowActions";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { PRODUCT_ADD_ROUTE } from "@/routes/routeNames";
import { useDeleteProductByIdMutation, useUpdateProductByIdMutation } from "@/redux/services/product";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import { LIST_LIMIT } from "@/constants/listLimits";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery, useUpdateApiMutation } from "@/redux/services/crudApi";
import { PRODUCT_URL } from "@/constants/apiUrlConstants";
import { buildQueryString } from "@/utils/generalHelper";
import Loader from "@/components/Loader";
import { useListAllProductCategoryQuery } from "@/redux/services/productCategory";
import Select from "@/components/Select";
import ToggleSwitch from "@/components/Switch";

const DraggableTable = lazy(() => import("@/components/Table/dragableTable"));
const BulkUploadModal = lazy(() => import("./BulkUploadModal"));

export default function Product() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Product");
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const canImport = accessList.includes("add") || accessList.includes("import");

  const { data: categoriesData } = useListAllProductCategoryQuery({
    page: 1,
    limit: LIST_LIMIT,
  });

  const categoryOptions = useMemo(() => {
    const list = categoriesData?.data?.data || [];
    const opts = list.map((c: { id: number; name: string }) => ({
      label: c.name,
      value: String(c.id),
    }));
    return [{ label: translate("All Categories"), value: "" }, ...opts];
  }, [categoriesData, translate]);

  const url = buildQueryString(`${PRODUCT_URL}list`, {
    page: query.page,
    limit: query.limit,
    search: {
      name: productSearchTerm,
      category: selectedCategory,
    },
  });

  const {
    data: allProduct,
    isSuccess: success,
    isLoading: loading,
    isFetching: fetching,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteProduct] = useDeleteProductByIdMutation();
  const [updateOrder] = useUpdateApiMutation();
  const [updateProductById] = useUpdateProductByIdMutation();

  const handleToggleTopSelling = async (item: any, next: boolean) => {
    try {
      await updateProductById({
        id: item.id,
        body: {
          isTopSelling: next,
          topSellingOrder: next ? Number(item.topSellingOrder || 0) : 0,
        },
      }).unwrap();
      refetch();
    } catch (error) {
      handleError({ error });
    }
  };

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PRODUCT_ADD_ROUTE)
      : navigate(`${PRODUCT_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteProduct(deleteId).unwrap();
      handleResponse({ res: response, onSuccess: () => {} });
    } catch (error) {
      handleError({ error });
    } finally {
      setOpen(false);
    }
  };

  const pagination = {
    page: allProduct?.data?.total === 0 ? 0 : allProduct?.data?.page,
    limit: allProduct?.data?.limit,
    total: allProduct?.data?.total,
    totalPages: allProduct?.data?.totalPages,
  };

  const tableHeaders = [
    "Items",
    "Price",
    "Top Selling",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const tableData =
    success && allProduct?.data?.data
      ? allProduct.data.data.map((item: any) => [
          item.id,
          <MenuItemCell
            name={item.name}
            imageUrl={
              item.mediaArr?.[0]?.imageUrl
                ? `${IMAGE_BASE_URL}${item.mediaArr[0].imageUrl}`
                : null
            }
            badge={
              item.addons?.length || item.addonIds?.length ? (
                <span className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {(item.addons?.length || 0) + (item.addonIds?.length || 0)}{" "}
                  addons
                </span>
              ) : null
            }
          />,
          <span className="font-semibold text-slate-800">
            {CurrencySign} {item.price}
          </span>,
          <ToggleSwitch
            isActive={Boolean(item.isTopSelling)}
            disabled={!accessList.includes("edit")}
            onToggle={(next) => handleToggleTopSelling(item, next)}
          />,
          <TableRowActions>
            {accessList.includes("edit") && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNewUser(item.id);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                title="Edit item"
              >
                <SquarePen size={16} />
              </button>
            )}
            {accessList.includes("delete") && (
              <DeleteModal
                compact
                open={open}
                setOpen={setOpen}
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
        searchPlaceholder="Search items..."
        searchValue={productSearchTerm}
        onSearchChange={setProductSearchTerm}
        filters={
          <Select
            value={selectedCategory}
            options={categoryOptions}
            onValueChange={(next) => {
              setSelectedCategory(next);
              handlePagination({ page: 1, limit: query.limit });
            }}
            className="w-full sm:w-auto sm:min-w-[160px]"
            triggerClassName="h-10 py-2.5"
          />
        }
        extraActions={
          canImport ? (
            <button
              type="button"
              data-tour="menu-bulk-upload"
              onClick={() => setBulkUploadOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--serve-border)] bg-[var(--serve-surface-2)] px-3 text-[13px] font-medium text-[var(--serve-fg)] transition hover:border-[color-mix(in_srgb,var(--serve-accent)_24%,var(--serve-border))] hover:bg-[var(--serve-surface)]"
            >
              <Upload size={15} strokeWidth={2.25} />
              {translate("Bulk Upload")}
            </button>
          ) : null
        }
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Items")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
      />

      {bulkUploadOpen ? (
        <Suspense fallback={null}>
          <BulkUploadModal
            isOpen={bulkUploadOpen}
            onClose={() => setBulkUploadOpen(false)}
            onImported={() => refetch()}
          />
        </Suspense>
      ) : null}

      {!success ? (
        <Loader />
      ) : accessList.includes("view") ? (
        <Suspense fallback={<Loader />}>
          <DraggableTable
            headers={tableHeaders}
            data={tableData}
            success={success}
            loading={loading}
            fetching={fetching}
            url="product/update-order"
            action={updateOrder}
            pagination={pagination}
            handlePagination={handlePagination}
          />
        </Suspense>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-slate-500">
          You do not have permission to view items.
        </div>
      )}
    </div>
  );
}
