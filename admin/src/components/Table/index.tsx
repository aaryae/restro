import useTranslation from "@/locale/useTranslation";
import { PaginationType } from "@/types/commonTypes";
import React from "react";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import styles from "./index.module.css";

interface TableProps {
  headers: string[] | any;
  data: any[][];
  pagination: PaginationType;
  isSN?: boolean;
  handlePagination: (pagination: PaginationType) => void;
}

function isActionsHeader(header: string, index: number, total: number) {
  return (
    index === total - 1 && String(header).toLowerCase().includes("action")
  );
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
    <div className="min-w-0 max-w-full">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-[13px] text-slate-700">
            <colgroup>
              {isSN && <col className="w-12" />}
              {headers.map((header: string, index: number) => (
                <col
                  key={index}
                  className={
                    isActionsHeader(header, index, headers.length)
                      ? "w-32"
                      : undefined
                  }
                />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                {isSN && (
                  <th className="w-12 px-3 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    S.N.
                  </th>
                )}
                {headers.map((header: string, index: number) => (
                  <th
                    key={index}
                    className={`px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:px-4 ${
                      isActionsHeader(header, index, headers.length)
                        ? "pr-6 text-center"
                        : "text-center"
                    }`}
                  >
                    {translate(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <tr
                    key={index}
                    className={`${styles.row} transition-colors hover:bg-primaryColor/[0.03]`}
                  >
                    {isSN && (
                      <td className="px-4 py-3.5 text-center text-slate-500">
                        {(pagination?.page - 1) * (pagination?.limit || 10) +
                          index +
                          1}
                      </td>
                    )}
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`px-3 py-3.5 align-middle break-words whitespace-normal md:px-4 ${
                          isActionsHeader(
                            headers[cellIndex],
                            cellIndex,
                            headers.length,
                          )
                            ? "pr-6 text-center"
                            : "text-center"
                        }`}
                      >
                        {React.isValidElement(cell) ? cell : `${cell}`}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isSN ? headers.length + 1 : headers.length}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    {translate("No data available")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-600">
              Show
              <select
                name="pagination"
                id="pagination"
                value={pagination.limit}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 outline-none transition focus:border-primaryColor/40 focus:ring-2 focus:ring-primaryColor/15"
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

            <div className="flex items-center gap-1.5">
              <button
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-white ${
                  pagination.page === 1 || pagination.total === 0
                    ? "cursor-not-allowed opacity-40"
                    : "hover:text-primaryColor"
                }`}
                disabled={pagination.page === 1 || pagination.total === 0}
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page - 1 })
                }
                aria-label="Previous Page"
              >
                <FaAngleLeft size={14} />
              </button>
              <span className="min-w-[88px] text-center text-[12px] font-medium text-slate-600">
                {pagination.page} / {Math.max(pagination.totalPages, 1)}
              </span>
              <button
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-white ${
                  pagination.page === pagination.totalPages ||
                  pagination.total === 0
                    ? "cursor-not-allowed opacity-40"
                    : "hover:text-primaryColor"
                }`}
                disabled={
                  pagination.page === pagination.totalPages ||
                  pagination.total === 0
                }
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page + 1 })
                }
                aria-label="Next Page"
              >
                <FaAngleRight size={14} />
              </button>
            </div>

            <div className="text-[12px] font-medium text-slate-500">
              Total{" "}
              <span className="rounded-md bg-white px-2 py-1 text-slate-700 border border-slate-200">
                {pagination.total}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
