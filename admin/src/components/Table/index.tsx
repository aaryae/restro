import useTranslation from "@/locale/useTranslation";
import { PaginationType } from "@/types/commonTypes";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./index.module.css";
import Select from "@/components/Select";

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

/** Money/count columns use tabular figures but stay left-aligned with other text columns. */
const NUMERIC_HINTS = [
  "amount",
  "total",
  "price",
  "qty",
  "quantity",
  "rate",
  "balance",
  "discount",
  "tax",
  "paid",
  "due",
  "count",
];

/** Serial number columns stay centered for scanability. */
function isSerialHeader(header: string) {
  const text = String(header || "")
    .toLowerCase()
    .replace(/\./g, "")
    .trim();
  return text === "sn" || text === "s n";
}

/** Toggle / status columns stay centered under their header. */
function isStatusHeader(header: string) {
  const text = String(header || "")
    .toLowerCase()
    .replace(/\./g, "")
    .trim();
  return (
    text === "is active" ||
    text === "active" ||
    text === "status" ||
    text.includes("is active")
  );
}

function isNumericHeader(header: string) {
  const text = String(header || "").toLowerCase();
  return NUMERIC_HINTS.some((hint) => text.includes(hint));
}

const Table: React.FC<TableProps> = ({
  headers,
  data,
  pagination,
  isSN,
  handlePagination,
}) => {
  const translate = useTranslation();

  const columnClass = (header: string, index: number) => {
    if (isActionsHeader(header, index, headers.length)) return styles.center;
    if (isSerialHeader(header)) return `${styles.center} ${styles.num}`;
    if (isStatusHeader(header)) return styles.center;
    if (isNumericHeader(header)) return styles.num;
    return undefined;
  };

  return (
    <div className="min-w-0 max-w-full">
      <div className={styles.shell}>
        <div className={styles.scroller}>
          <table className={styles.table}>
            <colgroup>
              {isSN && <col style={{ width: "3.5rem" }} />}
              {headers.map((header: string, index: number) => (
                <col
                  key={index}
                  style={
                    isActionsHeader(header, index, headers.length)
                      ? { width: "8rem" }
                      : undefined
                  }
                />
              ))}
            </colgroup>
            <thead className={styles.head}>
              <tr>
                {isSN && <th className={styles.center}>S.N.</th>}
                {headers.map((header: string, index: number) => (
                  <th key={index} className={columnClass(header, index)}>
                    {translate(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={styles.body}>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <tr key={index}>
                    {isSN && (
                      <td
                        className={`${styles.center} ${styles.num}`}
                        style={{ color: "var(--serve-muted)" }}
                      >
                        {(pagination?.page - 1) * (pagination?.limit || 10) +
                          index +
                          1}
                      </td>
                    )}
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={columnClass(headers[cellIndex], cellIndex)}
                      >
                        {cell == null || cell === false
                          ? null
                          : React.isValidElement(cell)
                            ? cell
                            : `${cell}`}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isSN ? headers.length + 1 : headers.length}
                    className={styles.empty}
                  >
                    {translate("No data available")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className={styles.footer}>
            <label className={styles.footerLabel}>
              Show
              <Select
                value={pagination.limit}
                options={[10, 25, 50, 100].map((each) => ({
                  value: each,
                  label: String(each),
                }))}
                onValueChange={(next) =>
                  handlePagination &&
                  handlePagination({
                    ...pagination,
                    limit: Number(next),
                  })
                }
                className="w-[72px]"
                triggerClassName="h-8 px-2.5 text-[12px]"
                contentClassName="min-w-[72px]"
              />
              entries
            </label>

            <div className={styles.pager}>
              <button
                type="button"
                className={styles.pagerBtn}
                disabled={pagination.page === 1 || pagination.total === 0}
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page - 1 })
                }
                aria-label="Previous Page"
              >
                <ChevronLeft />
              </button>
              <span className={styles.pagerCount}>
                {pagination.page} / {Math.max(pagination.totalPages, 1)}
              </span>
              <button
                type="button"
                className={styles.pagerBtn}
                disabled={
                  pagination.page === pagination.totalPages ||
                  pagination.total === 0
                }
                onClick={() =>
                  handlePagination({ ...pagination, page: pagination.page + 1 })
                }
                aria-label="Next Page"
              >
                <ChevronRight />
              </button>
            </div>

            <div className={styles.total}>
              Total
              <span className={styles.totalValue}>{pagination.total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
