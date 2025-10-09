import PageHeader from "@/components/PageHeader";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { OPEN_ITEM_ADD_ROUTE } from "@/routes/routeNames";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import usePagination from "@/hooks/usePagination";
import {
  useDeleteApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { OPEN_ITEM_URL } from "@/constants/apiUrlConstants";
import { buildQueryString } from "@/utils/generalHelper";
import Loader from "@/components/Loader";
import Table from "@/components/Table";

// remove everything related to product and replace with open item

export default function OpenItem() {
  const translate = useTranslation();
  const navigate = useNavigate();
  const accessList = checkAccess("Open Item");

  // query state
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });

  //   for delete operations
  const [open, setOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const url = buildQueryString(`${OPEN_ITEM_URL}list`, query);

  const {
    data: allOpenItem,
    isSuccess: success,
    isLoading: loading,
    isFetching: fetching,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteOpenItem] = useDeleteApiMutation();

  const [updateOrder] = useUpdateApiMutation();

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(OPEN_ITEM_ADD_ROUTE)
      : navigate(`${OPEN_ITEM_ADD_ROUTE}${id}`);
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
      const response = await deleteOpenItem(
        `${OPEN_ITEM_URL}${deleteId}`,
      ).unwrap();
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
    page: allOpenItem?.data?.total === 0 ? 0 : allOpenItem?.data?.page,
    limit: allOpenItem?.data?.limit,
    total: allOpenItem?.data?.total,
    totalPages: allOpenItem?.data?.totalPages,
  };

  const tableHeaders = [
    "Item",
    "Price",
    // "Order",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ];

  console.log(allOpenItem?.data?.data, "yo sabai open item ho");

  const tableData =
    success && allOpenItem?.data?.data
      ? allOpenItem?.data?.data.map(({ id, name, price, mediaArr }) => [
          <div className="flex items-center gap-[1rem]">
            <img
              src={`${IMAGE_BASE_URL}${mediaArr[0]?.imageUrl}`}
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
            className="flex items-center justify-center cursor-pointer gap-[0.5rem]"
          >
            {accessList.includes("edit") && (
              <div className="relative group">
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD]"
                  onClick={() => handleNewUser(id)}
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                  Edit Open Item
                </span>
              </div>
            )}
            {accessList.includes("delete") && (
              <div className="relative group">
                <DeleteModal
                  open={open}
                  setOpen={setOpen}
                  handleDeleteTrigger={() => handleDeleteTrigger(id)}
                  handleConfirmDelete={handleDelete}
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap">
                  Delete Open Item
                </span>
              </div>
            )}
          </div>,
        ])
      : [];
  return (
    <>
      <PageHeader
        hasAddButton={accessList.includes("add")}
        newButtonText={translate("Add New Open Item")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={handleReload}
        hasSubText
        subText={translate(
          "Add Comprehensive Open Item Information in Each Section",
        )}
      />
      {!success ? (
        <Loader />
      ) : accessList.includes("view") ? (
        <Table
          isSN
          headers={tableHeaders}
          data={tableData}
          pagination={pagination}
          handlePagination={handlePagination}
        />
      ) : (
        <div>Has no Permission to View SEO</div>
      )}
    </>
  );
}
