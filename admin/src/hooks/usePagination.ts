import { PaginationType } from "@/types/commonTypes";
import { useCallback, useState } from "react";

export default function usePagination(initial: {
  page: number;
  limit: number;
  search?: Record<string, any>;
}) {
  const [query, setQuery] = useState({
    page: initial.page,
    limit: initial.limit,
    search: initial.search || {},
  });

  const handlePagination = useCallback(
    (pagination: Partial<PaginationType> & { total?: number }) => {
      setQuery((prev) => {
        const next = { ...prev, ...pagination };

        if (pagination.search !== undefined) {
          next.search = { ...prev.search, ...pagination.search };
          next.page = 1;
        }

        if (pagination.limit && pagination.total !== undefined) {
          const totalPages = Math.max(
            1,
            Math.ceil(pagination.total / next.limit),
          );
          next.page = Math.min(next.page, totalPages);
        } else if (pagination.limit) {
          next.page = 1;
        }

        return next;
      });
    },
    [],
  );

  return { query, handlePagination };
}
