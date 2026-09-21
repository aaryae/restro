/** Default page size for paginated admin tables. */
export const PAGE_LIMIT = 10;

/**
 * Max rows for dropdowns / floor-plan style lists that load in one request.
 * Keep this modest on shared hosting — avoid 100–500+ list fetches.
 */
export const LIST_LIMIT = 25;

/**
 * POS pickers (tables, floors, payment accounts) need a higher ceiling so
 * venues with many tables/accounts aren't silently truncated.
 */
export const POS_LIST_LIMIT = 200;
