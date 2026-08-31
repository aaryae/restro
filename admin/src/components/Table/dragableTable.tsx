import { useEffect, useState } from "react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableRow } from "./sortable-row";
import { PaginationType } from "@/types/commonTypes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./index.module.css";
import Select from "@/components/Select";

type DraggableTableProps = {
  headers: string[];
  data: any[][];
  action: any;
  pagination: PaginationType;
  handlePagination: (pagination: PaginationType) => void;
  success: boolean;
  fetching: boolean;
  loading: boolean;
  url: string;
};

function isActionsHeader(header: string, index: number, total: number) {
  return (
    index === total - 1 && String(header).toLowerCase().includes("action")
  );
}

function useMergedActionsLayout(headers: string[]) {
  return (
    headers.length === 2 &&
    isActionsHeader(headers[headers.length - 1], headers.length - 1, headers.length)
  );
}

export default function DraggableTable({
  headers,
  data,
  success,
  fetching,
  loading,
  url,
  action,
  pagination,
  handlePagination,
}: DraggableTableProps) {
  const [products, setProducts] = useState(data);
  const mergedActionsLayout = useMergedActionsLayout(headers);

  useEffect(() => {
    if (success && !fetching && !loading) {
      setProducts(data);
    }
  }, [data, success, loading, fetching]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const getTaskPos = (id: number | string) =>
    products.findIndex((task) => task[0] === id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setProducts((tasks) => {
      const originalPos = getTaskPos(active.id);
      const newPos = getTaskPos(over.id);
      if (originalPos === -1 || newPos === -1) return tasks;

      const updatedTasks = arrayMove(tasks, originalPos, newPos);
      const payload = updatedTasks.map((each) => ({
        id: each[0],
        order: updatedTasks.indexOf(each) + 1,
      }));
      action({ url, body: { orders: payload } });

      return updatedTasks;
    });
  }

  return (
    <div className={styles.shell}>
      <div className={styles.scroller}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className={styles.table}>
            <colgroup>
              <col className="w-10" />
              {mergedActionsLayout ? (
                <col />
              ) : (
                headers.map((header, index) => (
                  <col
                    key={header}
                    className={
                      isActionsHeader(header, index, headers.length)
                        ? "w-32"
                        : undefined
                    }
                  />
                ))
              )}
            </colgroup>
            <thead className={styles.head}>
              <tr>
                <th aria-label="Reorder" />
                {mergedActionsLayout ? (
                  <th colSpan={2}>
                    <div className="flex w-full max-w-2xl items-center justify-between gap-6">
                      <span>{headers[0]}</span>
                      <span className="min-w-[4.5rem] text-center">
                        {headers[1]}
                      </span>
                    </div>
                  </th>
                ) : (
                  headers.map((header, index) => (
                    <th
                      key={header}
                      className={
                        isActionsHeader(header, index, headers.length)
                          ? styles.center
                          : undefined
                      }
                    >
                      {header}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <SortableContext
              items={products.map((product) => product[0])}
              strategy={verticalListSortingStrategy}
            >
              <tbody className={styles.body}>
                {products.map((product) => (
                  <SortableRow
                    key={product[0]}
                    product={product}
                    mergedActionsLayout={mergedActionsLayout}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>

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
            disabled={pagination.page === 1}
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
            disabled={pagination.page === pagination.totalPages}
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
    </div>
  );
}
