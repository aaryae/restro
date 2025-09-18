import useTranslation from "@/locale/useTranslation";
import { PaginationType } from "@/types/commonTypes";
import React from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import styles from "./index.module.css";

interface TableProps {
  headers: string[] | any; // Table header titles
  data: any[][]; // Array of table data
  pagination: PaginationType;
  isSN?: boolean;
  handlePagination: (pagination: PaginationType) => void;
}

const Table: React.FC<TableProps> = ({
  headers,
  data,
  pagination,
  isSN,
  handlePagination,
}) => {
  const translate = useTranslation();
  return (
    <div>
      {/* Card Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Table (horizontal scroll only for table) */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800">
            <thead className="bg-primaryColor">
              <tr>
                {isSN && (
                  <th className="px-6 py-4 text-center text-white font-medium text-[1rem] whitespace-nowrap">
                    S.N.
                  </th>
                )}
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-6 py-4 text-center text-white font-medium text-[1rem] whitespace-nowrap"
                  >
                    {translate(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`${styles.tableBody}`}>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <tr
                    key={index}
                    className={`${styles.row} hover:bg-gray-50 transition-colors`}
                  >
                    {isSN && (
                      <td className="px-6 py-3 text-center">{index + 1}</td>
                    )}
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-3 text-center">
                        {React.isValidElement(cell) ? cell : `${cell}`}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isSN ? headers.length + 1 : headers.length}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {translate("No data available")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {pagination && (
          <div className="sticky bottom-0 sm:static flex sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-white">
            <div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                Show:
                <select
                  name="pagination"
                  id="pagination"
                  value={pagination.limit}
                  className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) =>
                    handlePagination &&
                    handlePagination({
                      ...pagination,
                      limit: Number(e.target.value),
                    })
                  }
                >
                  {[10, 25, 50, 100].map((each) => (
                    <option key={each} value={each}>
                      {each}
                    </option>
                  ))}
                </select>
                entries
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-md border text-gray-700 hover:bg-gray-100 transition ${
                  pagination.page === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={pagination.page === 1}
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page - 1 })
                }
                aria-label="Previous Page"
              >
                <FaAngleLeft size={18} />
              </button>
              <button
                className={`p-2 rounded-md border text-gray-700 hover:bg-gray-100 transition ${
                  pagination.page === pagination.totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page + 1 })
                }
                aria-label="Next Page"
              >
                <FaAngleRight size={18} />
              </button>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-gray-700">
                Total: {pagination.total}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Table;
