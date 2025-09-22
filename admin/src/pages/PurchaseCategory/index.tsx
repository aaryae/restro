import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DraggableTable from "@/components/Table/dragableTable";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import useTranslation from "@/locale/useTranslation";
import { PURCHASE_CATEGORY_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";
import { MdEditSquare } from "react-icons/md";
import DeleteModal from "@/components/DeleteModal";
import { buildQueryString } from "@/utils/generalHelper";
import { useDeleteApiMutation, useGetApiQuery } from "@/redux/services/crudApi";
import { handleError, handleResponse } from "@/utils/responseHandler";
import { PURCHASE_CATEGORY_URL } from "@/constants/apiUrlConstants";
import Table from "@/components/Table";

// type PurchaseCategoryRow = {
//   id: number;
//   title: string;
//   description: string;
// };

const PurchaseCategory: React.FC = () => {
  const translate = useTranslation();
  const navigate = useNavigate();
  const [deleteModelOpen, setDeleteModelOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDeleteTrigger = (id: number) => {
    setDeleteId(id);
    setDeleteModelOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await deleteApi(
        `${PURCHASE_CATEGORY_URL}${deleteId}`,
      ).unwrap();
      handleResponse({
        res: {
          success: true,
          msg: res?.message || "Purchase category deleted successfully.",
        },
        onSuccess: () => refetch(),
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setDeleteModelOpen(false);
      setDeleteId(null);
    }
  };
  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const url = buildQueryString("purchase-category/list", {
    page: query.page,
    limit: query.limit,
  });
  const {
    data: apiData,
    isSuccess: success,
    isFetching,
    refetch,
  } = useGetApiQuery({ url });
  const [deleteApi] = useDeleteApiMutation();

  const rows: any[] = success ? (apiData?.data?.data ?? []) : [];

  const pagination: PaginationType = {
    page: apiData?.data?.total === 0 ? 0 : apiData?.data?.page,
    limit: apiData?.data?.limit,
    total: apiData?.data?.total,
    totalPages: apiData?.data?.totalPages,
  };

  const headers = [
    "Purchase Category Title",
    "Purchase Category Description",
    "Action",
  ];

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PURCHASE_CATEGORY_ADD_ROUTE)
      : navigate(`${PURCHASE_CATEGORY_ADD_ROUTE}${id}`);
  };
  // For DraggableTable, the first array element is the row identifier and is not rendered.
  const data = rows.map((r: any) => [
    r.name,
    r.description,
    <div key={r.id} className="flex items-center justify-center gap-[0.5rem]">
      <MdEditSquare
        size={18}
        className="text-[#0090DD] hover:text-blue-800 cursor-pointer"
        onClick={() => handleNewUser(r.id)}
        title="Edit"
      />
      <DeleteModal
        open={deleteModelOpen}
        setOpen={setDeleteModelOpen}
        handleDeleteTrigger={() => handleDeleteTrigger(r.id)}
        handleConfirmDelete={handleDelete}
      />
    </div>,
  ]);

  return (
    <>
      <PageHeader
        hasAddButton={true}
        newButtonText={translate("Add New Purchase Category")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => refetch()}
        hasSubText
        subText="This module allows dynamically adding various types of categories related to purchase entry."
      />
      <Table
        data={data}
        headers={headers}
        handlePagination={handlePagination}
        pagination={pagination}
      />
    </>
  );
};

export default PurchaseCategory;
