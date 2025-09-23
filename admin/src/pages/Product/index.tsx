import PageHeader from "@/components/PageHeader";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { useState, useMemo } from "react";
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
import Input from "@/components/Input";
import Select from "@/components/Select";
import { useListAllProductCategoryQuery } from "@/redux/services/productCategory";
export default function Product() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Product");

  // query state
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  //   for delete operations
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // fetch categories for filter dropdown
  const { data: categoriesData } = useListAllProductCategoryQuery({
    page: 1,
    limit: 100,
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
              className="object-cover w-[5.5rem] h-[4rem] sm:w-[7rem] sm:h-[5rem] md:w-[8rem] md:h-[6rem] rounded"
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <Input
            placeholder="Search items"
            className="w-full md:w-[30rem]"
            value={productSearchTerm}
            onChange={(e) => {
              setProductSearchTerm(e.target.value);
              // optional: reset to first page when searching
              handlePagination({ page: 1, limit: query.limit });
            }}
          />
          {/* <div className="min-w-0 sm:min-w-[220px] w-full sm:w-auto"> */}
          <select
            value={selectedCategory}
            className="px-6 py-2 sm:px-6 sm:py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px] "
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              // reset to first page when category changes
              handlePagination({ page: 1, limit: query.limit });
            }}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* </div> */}
        </div>
        <div className="w-full ">
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
        </div>
      </div>
      {!success ? (
        <Loader />
      ) : accessList.includes("view") ? (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
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
