import PageHeader from "@/components/PageHeader";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { PRODUCT_ADD_ROUTE } from "@/routes/routeNames";
import { useDeleteProductByIdMutation } from "@/redux/services/product";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import usePagination from "@/hooks/usePagination";
import { useGetApiQuery, useUpdateApiMutation } from "@/redux/services/crudApi";
import { PRODUCT_URL } from "@/constants/apiUrlConstants";
import { buildQueryString } from "@/utils/generalHelper";
import DraggableTable from "@/components/Table/dragableTable";
import Loader from "@/components/Loader";

export default function Product() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Product");

  // query state
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  //   for delete operations
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const url = buildQueryString(`${PRODUCT_URL}list`, query);

  const {
    data: allProduct,
    isSuccess: success,
    isLoading: loading,
    isFetching: fetching,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteProduct] = useDeleteProductByIdMutation();

  const [updateOrder] = useUpdateApiMutation();

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PRODUCT_ADD_ROUTE)
      : navigate(`${PRODUCT_ADD_ROUTE}${id}`);
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
      const response = await deleteProduct(deleteId).unwrap();
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
    page: allProduct?.data?.page,
    limit: allProduct?.data?.limit,
    total: allProduct?.data?.total,
    totalPages: allProduct?.data?.totalPages,
  };

  const tableHeaders = [
    "Product",
    "Price",
    // "Order",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  const tableData =
    success && allProduct?.data?.data
      ? allProduct?.data?.data.map(({ id, name, price, mediaArr }) => [
          id,
          <div className="flex items-center gap-[1rem]">
            <img
              src={`${IMAGE_BASE_URL}${mediaArr[0].imageUrl}`}
              alt="Product Image"
              className="w-[8rem] h-[6rem] object-cover"
              // crossOrigin="anonymous"
            />
            <p>{name}</p>
          </div>,
          `${CurrencySign} ${price}`,
          // order,
          <div
            key={id}
            className="flex items-center justify-start cursor-pointer gap-[0.5rem]"
          >
            {accessList.includes("edit") && (
              <MdEditSquare
                size={18}
                className="text-[#0090DD]"
                onClick={() => handleNewUser(id)}
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
        ])
      : [];
  return (
    <>
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Product")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate(
          "Add Comprehensive Product Information in Each Section",
        )}
      />
      {!success ? (
        <Loader />
      ) : accessList.includes("view") ? (
        <div>
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
        </div>
      ) : (
        <div>Has no Permission to View SEO</div>
      )}
    </>
  );
}
