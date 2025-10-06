import Drawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import { MdEditSquare, MdNearMe } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { PaginationType } from "@/types/commonTypes";
import {
  useDeleteProductCategoryByIdMutation,
  useListAllProductCategoryQuery,
} from "@/redux/services/productCategory";
import { useNavigate } from "react-router-dom";
import { PRODUCT_CATEGORY_ADD_ROUTE } from "@/routes/routeNames";
import DraggableTable from "@/components/Table/dragableTable";
import { useUpdateApiMutation } from "@/redux/services/crudApi";

export default function ProductCategory() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Product Category");

  // query state
  const [query, setQuery] = useState({ page: 1, limit: 10 });

  //   for delete operations
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    data: allProductCategory,
    isSuccess: success,
    isLoading: loading,
    isFetching: fetching,
    refetch,
  } = useListAllProductCategoryQuery(query);
  const [deleteProductCategory] = useDeleteProductCategoryByIdMutation();
  const [updateOrder] = useUpdateApiMutation();
  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PRODUCT_CATEGORY_ADD_ROUTE)
      : navigate(`${PRODUCT_CATEGORY_ADD_ROUTE}${id}`);
  };

  const handleReload = () => {
    refetch();
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setOpen(true);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteProductCategory(deleteId).unwrap();
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
    page: allProductCategory?.data?.page,
    limit: allProductCategory?.data?.limit,
    total: allProductCategory?.data?.total,
    totalPages: allProductCategory?.data?.totalPages,
  };

  const handlePagination = (pagination: PaginationType) => {
    setQuery((prev) => ({
      ...prev,
      ...pagination,
    }));
    refetch();
  };

  const tableHeaders = [
    "Product Category",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const tableData =
    success && allProductCategory?.data?.data
      ? allProductCategory?.data?.data.map(({ id, name }) => [
          id,
          name,
          <div
            key={id}
            className="flex items-center justify-start cursor-pointer gap-[0.5rem]"
          >
            {accessList.includes("edit") && (
              <div className="relative group">
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD]"
                  onClick={() => handleNewUser(id)}
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                  Edit Product Category
                </span>
              </div>
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
        ])
      : [];

  return (
    <>
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Product Category")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate(
          "Add Comprehensive Product Category Information in Each Section",
        )}
      />
      {accessList.includes("view") ? (
        <div>
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
          {/* <Table
            isSN
            headers={tableHeaders}
            data={tableData}
            pagination={pagination}
            handlePagination={handlePagination}
          /> */}
        </div>
      ) : (
        <div>Has no Permission to View SEO</div>
      )}
    </>
  );
}
