import React, { useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import DraggableTable from "@/components/Table/dragableTable";
import usePagination from "@/hooks/usePagination";
import { PaginationType } from "@/types/commonTypes";
import useTranslation from "@/locale/useTranslation";
import { PURCHASE_CATEGORY_ADD_ROUTE } from "@/routes/routeNames";
import { useNavigate } from "react-router-dom";

type PurchaseCategoryRow = {
  id: number;
  title: string;
  description: string;
};

const PurchaseCategory: React.FC = () => {
  const translate = useTranslation();
  const navigate = useNavigate();
  // Demo data; replace with API integration later
  const allData: PurchaseCategoryRow[] = useMemo(
    () => [
      {
        id: 1,
        title: "Fruits and Vegetables",
        description:
          "Category related to fruits and vegetables used to create drinks or meals.",
      },
      {
        id: 2,
        title: "Coffee Beans",
        description:
          "Category related to coffee beans for beverages and related products.",
      },
      {
        id: 3,
        title: "Bakery Items",
        description:
          "Category for breads, pastries, and other bakery supplies.",
      },
      {
        id: 4,
        title: "Cigarettes and Hukka",
        description: "Category for cigarette and hukka related purchases.",
      },
      {
        id: 5,
        title: "Soft Drinks",
        description: "Category for non-alcoholic beverages and mixers.",
      },
      {
        id: 6,
        title: "Hard Drinks",
        description: "Category for alcoholic beverages.",
      },
      {
        id: 7,
        title: "Coffee Related other Items",
        description:
          "Category for syrups, filters, and other coffee accessories.",
      },
    ],
    [],
  );

  const { query, handlePagination } = usePagination({ page: 1, limit: 10 });
  const start = (query.page - 1) * query.limit;
  const pageRows = allData.slice(start, start + query.limit);

  const pagination: PaginationType = {
    page: query.page,
    limit: query.limit,
    total: allData.length,
    totalPages: Math.max(1, Math.ceil(allData.length / query.limit)),
  };

  const headers = [
    "ID",
    "Purchase Category Title",
    "Purchase Category Description",
  ];

  const handleNewUser = (id: number | null) => {
    id === null
      ? navigate(PURCHASE_CATEGORY_ADD_ROUTE)
      : navigate(`${PURCHASE_CATEGORY_ADD_ROUTE}${id}`);
  };
  // For DraggableTable, the first array element is used as the row identifier and is not rendered.
  // Duplicate the ID as the next element so it appears in the first visible column.
  const data = pageRows.map((r) => [r.id, r.id, r.title, r.description]);

  return (
    <>
      <PageHeader
        hasAddButton={true}
        newButtonText={translate("Add New Purchase Category")}
        handleNewButton={() => handleNewUser(null)}
        handleReloadButton={() => {}}
        hasSubText
        subText="This module allows dynamically adding various types of categories related to purchase entry."
      />
      <DraggableTable
        headers={headers}
        data={data}
        loading={false}
        fetching={false}
        success={true}
        url="purchase-category/update-order"
        action={() => {}}
        pagination={pagination}
        handlePagination={(p) =>
          handlePagination({ ...p, total: allData.length })
        }
      />
    </>
  );
};

export default PurchaseCategory;
