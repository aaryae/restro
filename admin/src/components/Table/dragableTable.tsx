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
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
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
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-w-full overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full border-collapse text-[13px] text-slate-700">
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
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="px-2 py-3.5" aria-label="Reorder" />
                {mergedActionsLayout ? (
                  <th colSpan={2} className="px-4 py-3.5 text-left">
                    <div className="flex w-full max-w-2xl items-center justify-between gap-6">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {headers[0]}
                      </span>
                      <span className="min-w-[4.5rem] text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {headers[1]}
                      </span>
                    </div>
                  </th>
                ) : (
                  headers.map((header, index) => (
                    <th
                      key={header}
                      className={`px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${
                        isActionsHeader(header, index, headers.length)
                          ? "pr-6 text-center"
                          : "text-left"
                      }`}
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
              <tbody className={styles.tableBody}>
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

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-600">
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

        <div className="flex items-center gap-1.5">
          <button
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 ${
              pagination.page === 1 ? "cursor-not-allowed opacity-40" : ""
            }`}
            disabled={pagination.page === 1}
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
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 ${
              pagination.page === pagination.totalPages
                ? "cursor-not-allowed opacity-40"
                : ""
            }`}
            disabled={pagination.page === pagination.totalPages}
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
          <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700">
            {pagination.total}
          </span>
        </div>
      </div>
    </div>
  );
}
