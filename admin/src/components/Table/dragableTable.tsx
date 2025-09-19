import { useEffect, useState } from "react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableRow } from "./sortable-row";
import { DragOverlayRow } from "./drag-overlay";
import { PaginationType } from "@/types/commonTypes";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState(data);
  useEffect(() => {
    if (success && !fetching && !loading) {
      setProducts((prev) => {
        const existingIds = new Set(prev.map((item) => item[0]));
        const newData = data.filter((item) => !existingIds.has(item[0]));
        return [...prev, ...newData];
      });
    }
  }, [success, loading, fetching]);
  // const [activeId, setActiveId] = useState<string | null>(null);
  // const activeProduct = activeId
  //   ? products.find((product) => product.id === activeId) || null
  //   : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const getTaskPos = (id) => products.findIndex((task) => task[0] === id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setProducts((tasks) => {
      const originalPos = getTaskPos(active.id);
      const newPos = getTaskPos(over.id);
      console.log(originalPos, newPos, "original and new pos");
      if (originalPos === -1 || newPos === -1) return tasks;

      const updatedTasks = arrayMove(tasks, originalPos, newPos);
      console.log(tasks, "tasks");
      const reorderedTasks = updatedTasks.map((task, index) => ({
        ...task,
        order: index + 1,
      }));

      const data = reorderedTasks.map((each) => {
        return { id: each[0], order: each.order };
      });
      // updateOrder(body);
      action({ url, body: { orders: data } });

      return reorderedTasks;
    });
  }

  return (
    <div className="bg-white pt-[2rem] pb-[0.5rem] px-[1rem] rounded-lg">
      <div className="overflow-x-auto">
        <div className="border rounded-lg overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            // onDragStart={handleDragStart}
          >
            {console.log(products.length, "products")}
            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-left text-sm font-medium text-gray-500">
                    <th className="px-2 py-3 w-10 bg-[#f2f6fa]"></th>
                    {headers.map((header) => (
                      <th className="px-4 py-3 whitespace-nowrap bg-[#f2f6fa]">
                        <span className="text-[#111] font-[700] text-[0.875rem]">
                          {header}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <SortableContext
                  items={data.map((product) => product[0])}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="divide-y divide-gray-200">
                    {data.map((product, i) => (
                      <SortableRow
                        key={product[0]}
                        product={product}
                        index={i}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </div>
            {/* <DragOverlay>
              {activeId ? <DragOverlayRow product={activeProduct} /> : null}
            </DragOverlay> */}
          </DndContext>
        </div>
      </div>
      {/* Pagination */}
      {/* <div className="mt-[6px] flex justify-between ">
        <div>
          <p className="font-[500] text-[0.875rem] text-[#2F2B3D] bg-white px-[0.75rem] py-[0.5rem]">
            Show:{" "}
            <select
              name="pagination"
              id="pagination"
              value={pagination.limit}
              className="bg-white"
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
            </select>{" "}
            entries
          </p>
        </div>
        <div className="flex gap-[1rem] ">
          <button
            className={
              pagination.page === 1 ? "text-gray-400 cursor-not-allowed" : ""
            }
            disabled={pagination.page === 1}
            onClick={() =>
              handlePagination({ ...pagination, page: pagination.page - 1 })
            }
          >
            <FaAngleLeft size={24} />
          </button>
          <button
            className={
              pagination.page === pagination.totalPages
                ? "text-gray-400 cursor-not-allowed"
                : ""
            }
            disabled={pagination.page === pagination.totalPages}
            onClick={() =>
              handlePagination({ ...pagination, page: pagination.page + 1 })
            }
          >
            <FaAngleRight size={24} />
          </button>
        </div>
        <div className="flex gap-[0.875rem]">
          <p className="font-[500] text-[0.875rem] text-[#2F2B3D] bg-white px-[0.75rem] py-[0.5rem]">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <p className="font-[500] text-[0.875rem] text-[#2F2B3D] bg-white px-[0.75rem] py-[0.5rem]">
            Total Data: {pagination.total}
          </p>
        </div>
      </div> */}
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
    </div>
  );
}
