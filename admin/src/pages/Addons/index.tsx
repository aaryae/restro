import PageHeader from "@/components/PageHeader";
import useTranslation from "@/locale/useTranslation";
import { checkAccess } from "@/utils/accessHelper";
import { useState } from "react";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { useNavigate } from "react-router-dom";
import { ADDONS_ADD_ROUTE } from "@/routes/routeNames";
import { CurrencySign, IMAGE_BASE_URL } from "@/constants";
import usePagination from "@/hooks/usePagination";
import {
  useDeleteApiMutation,
  useGetApiQuery,
  useUpdateApiMutation,
} from "@/redux/services/crudApi";
import { ADDON_URL } from "@/constants/apiUrlConstants";
import { buildQueryString } from "@/utils/generalHelper";
import Loader from "@/components/Loader";
import Input from "@/components/Input";
import DishPlaceHolder from "@/assets/product_placeholder.jpg";
import DraggableTable from "@/components/Table/dragableTable";

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
    search: {
      search: searchTerm,
    },
  });

  const { data, isSuccess, refetch, isLoading, isFetching } = useGetApiQuery({
    url,
  });
  const [deleteApi] = useDeleteApiMutation();
  const [updateOrder] = useUpdateApiMutation();

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
      handleResponse({
        res,
        onSuccess: () => {},
      });
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
    "Items",
    "Price",
    (accessList.includes("edit") || accessList.includes("delete")) && "Actions",
  ].filter(Boolean) as string[];

  const tableData =
    isSuccess && data?.data?.data
      ? data?.data?.data.map((item: any) => [
          item.id,
          <div className="flex items-center gap-[1rem] md:w-[8rem] w-[20rem]">
            <img
              src={
                item.imageUrl
                  ? item.imageUrl.startsWith("http")
                    ? item.imageUrl
                    : `${IMAGE_BASE_URL}${item.imageUrl}`
                  : item.mediaArr?.[0]?.imageUrl
                    ? `${IMAGE_BASE_URL}${item.mediaArr[0].imageUrl}`
                    : DishPlaceHolder
              }
              alt="Addon Image"
              className="object-cover w-[5.5rem] h-[4rem] sm:w-[7rem] sm:h-[5rem] md:w-[8rem] md:h-[6rem] rounded"
            />
            <p>{item.name}</p>
          </div>,
          `${CurrencySign} ${item.price}`,
          <div
            key={item.id}
            className="flex items-center justify-start gap-[0.5rem]"
          >
            {accessList.includes("edit") && (
              <div className="relative group">
                <MdEditSquare
                  size={18}
                  className="text-[#0090DD] hover:text-blue-800 cursor-pointer"
                  onClick={() => handleNewAddon(item.id)}
                  title="Edit"
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
                  Edit Addon
                </span>
              </div>
            )}
            {accessList.includes("delete") && (
              <div className="relative group">
                <DeleteModal
                  open={deleteModelOpen}
                  setOpen={setDeleteModelOpen}
                  handleDeleteTrigger={() => handleDeleteTrigger(item.id)}
                  handleConfirmDelete={handleDelete}
                />
                <span className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap z-50">
                  Delete Addon
                </span>
              </div>
            )}
          </div>,
        ])
      : [];

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <Input
            placeholder="Search addons"
            className="w-full md:w-[25rem]"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Optionally reset to first page when searching
              // handlePagination({ page: 1, limit: query.limit });
            }}
          />
        </div>
        <div className="w-full ">
          <PageHeader
            hasAddButton={accessList.includes("add")}
            newButtonText={translate("Add New Addon")}
            handleNewButton={() => handleNewAddon(null)}
            handleReloadButton={() => refetch()}
          />
        </div>
      </div>
      {!isSuccess ? (
        <Loader />
      ) : accessList.includes("view") ? (
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <DraggableTable
            headers={headers}
            data={tableData}
            pagination={pagination}
            handlePagination={handlePagination}
            action={updateOrder}
            url="addon/update-order"
            success={isSuccess}
            loading={isLoading}
            fetching={isFetching}
          />
        </div>
      ) : (
        <div>Has no Permission to View Addons</div>
      )}
    </>
  );
};

export default Addons;
