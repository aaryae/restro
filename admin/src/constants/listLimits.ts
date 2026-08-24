/** Default page size for paginated admin tables. */
export const PAGE_LIMIT = 10;

/**
 * Max rows for dropdowns / floor-plan style lists that load in one request.
 * Keep this modest on shared hosting — avoid 100–500+ list fetches.
 */
export const LIST_LIMIT = 25;
