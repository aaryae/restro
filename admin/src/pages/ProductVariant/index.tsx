import MenuPageToolbar from "@/components/MenuPageToolbar";
import Table from "@/components/Table";
import TableRowActions from "@/components/Table/TableRowActions";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { PaginationType } from "@/types/commonTypes";
import { useNavigate } from "react-router-dom";
import { PRODUCT_VARIANT_ADD_ROUTE } from "@/routes/routeNames";
import {
  useDeleteProductVariantByIdMutation,
  useListAllProductVariantQuery,
} from "@/redux/services/productVariant";

export default function ProductVariant() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Product Variant");

  const [query, setQuery] = useState({ page: 1, limit: 10 });
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    data: allProductVariant,
    isSuccess: success,
    refetch,
  } = useListAllProductVariantQuery(query);
  const [deleteProductVariant] = useDeleteProductVariantByIdMutation();

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PRODUCT_VARIANT_ADD_ROUTE)
      : navigate(`${PRODUCT_VARIANT_ADD_ROUTE}${id}`);
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteProductVariant(deleteId).unwrap();
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
    page: allProductVariant?.data?.page,
    limit: allProductVariant?.data?.limit,
    total: allProductVariant?.data?.total,
    totalPages: allProductVariant?.data?.totalPages,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  const tableHeaders = [
    "Product",
    "Quantity",
    "Price",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const tableData =
    success && allProductVariant?.data?.data
      ? allProductVariant?.data?.data.map(({ id, name, quantity, price }) => [
          <span className="text-sm font-semibold text-slate-800">{name}</span>,
          quantity,
          price,
          <TableRowActions>
            {accessList.includes("edit") && (
              <button
                type="button"
                onClick={() => handleNewUser(id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                title="Edit variant"
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
        ])
      : [];

  return (
    <div className="min-w-0 max-w-full">
      <MenuPageToolbar
        showSearch={false}
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add Variant")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
        subText="Manage size and quantity variants linked to menu products."
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
          You do not have permission to view product variants.
        </div>
      )}
    </div>
  );
}
