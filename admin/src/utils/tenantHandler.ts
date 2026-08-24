const STORAGE_KEY = "tenantSlug";

/** Local-only: ?tenant=demo or ?tenant=brew, then remembered in localStorage. */
function captureTenantFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("tenant")?.trim().toLowerCase();
  if (fromQuery) {
    localStorage.setItem(STORAGE_KEY, fromQuery);
    return;
  }
  if (params.get("tenant") === "") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function getTenantSlug(): string | null {
  captureTenantFromUrl();
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export { getTenantSlug, captureTenantFromUrl };
