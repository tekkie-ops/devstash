/** Items-per-page for /items/[type] and the items grid on /collections/[id]. */
export const ITEMS_PER_PAGE = 21;

/** Collections-per-page for the /collections listing. */
export const COLLECTIONS_PER_PAGE = 21;

/** Cap on the dashboard's Recent Collections section — no pagination to fall back on. */
export const DASHBOARD_COLLECTIONS_LIMIT = 6;

/** Cap on the dashboard's Recent items section — no pagination to fall back on. */
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

/** Parses a `?page=` search param into a valid 1-based page number, defaulting to 1. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function getTotalPages(totalCount: number, perPage: number): number {
  return Math.max(1, Math.ceil(totalCount / perPage));
}

export function getSkip(page: number, perPage: number): number {
  return (page - 1) * perPage;
}
