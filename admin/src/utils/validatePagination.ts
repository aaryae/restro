import { PaginationType } from "@/types/commonTypes";

export default function validatePagination(
  pagination: PaginationType,
  handlePagination: (pagination: PaginationType) => void,
) {
  if (pagination.page > pagination.totalPages)
    handlePagination({ ...pagination, page: pagination.totalPages });
}
