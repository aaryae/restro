import type { SelectOption } from "@/components/Select";

export type TableSelectSource = {
  id: number | string;
  tableNo: string;
  status?: string;
  type?: string;
  floor?: {
    id?: number;
    name?: string;
    floorNo?: string;
    isActive?: boolean;
  } | null;
};

const TABLE_TYPE_LABELS: Record<string, string> = {
  regular: "Regular",
  vip: "VIP",
  indoor: "Indoor",
  outdoor: "Outdoor",
};

const TABLE_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  maintenance: "Unavailable",
};

function getFloorLabel(floor?: TableSelectSource["floor"]) {
  if (!floor) return "Unknown Floor";
  if (floor.name?.trim()) return floor.name.trim();
  if (floor.floorNo?.trim()) return `Floor ${floor.floorNo.trim()}`;
  return "Unknown Floor";
}

function getFloorSortKey(floor?: TableSelectSource["floor"]) {
  if (floor?.floorNo?.trim()) return floor.floorNo.trim();
  if (floor?.name?.trim()) return floor.name.trim();
  return "zzz";
}

function formatTableType(type?: string) {
  if (!type || type === "regular") return null;
  return TABLE_TYPE_LABELS[type] ?? type;
}

function formatTableStatus(status?: string) {
  if (!status) return null;
  return TABLE_STATUS_LABELS[status] ?? status;
}

export function getTableOptionLabel(table: TableSelectSource) {
  const floorLabel = getFloorLabel(table.floor);
  const parts = [table.tableNo];

  const typeLabel = formatTableType(table.type);
  if (typeLabel) parts.push(typeLabel);

  const statusLabel = formatTableStatus(table.status);
  if (statusLabel) parts.push(statusLabel);

  return `${floorLabel} · ${parts.join(" · ")}`;
}

export function getTableOptionShortLabel(table: TableSelectSource) {
  const parts = [table.tableNo];

  const typeLabel = formatTableType(table.type);
  if (typeLabel) parts.push(typeLabel);

  const statusLabel = formatTableStatus(table.status);
  if (statusLabel) parts.push(statusLabel);

  return parts.join(" · ");
}

type BuildTableSelectOptionsConfig = {
  excludeMaintenance?: boolean;
  includeEmptyOption?: boolean;
  emptyOptionLabel?: string;
  groupByFloor?: boolean;
};

export function buildTableSelectOptions(
  tables: TableSelectSource[] = [],
  {
    excludeMaintenance = true,
    includeEmptyOption = false,
    emptyOptionLabel = "Select table",
    groupByFloor = true,
  }: BuildTableSelectOptionsConfig = {},
) {
  const labelByValue = new Map<string, string>();

  const filtered = tables.filter((table) => {
    if (excludeMaintenance && table.status === "maintenance") return false;
    if (table.floor?.isActive === false) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const floorCompare = getFloorSortKey(a.floor).localeCompare(
      getFloorSortKey(b.floor),
      undefined,
      { numeric: true, sensitivity: "base" },
    );
    if (floorCompare !== 0) return floorCompare;
    return String(a.tableNo).localeCompare(String(b.tableNo), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  const options: SelectOption[] = [];

  if (includeEmptyOption) {
    options.push({ value: "", label: emptyOptionLabel });
  }

  if (groupByFloor) {
    const floorGroups = new Map<string, SelectOption>();

    sorted.forEach((table) => {
      const floorLabel = getFloorLabel(table.floor);
      const value = String(table.id);
      const label = getTableOptionShortLabel(table);

      labelByValue.set(value, getTableOptionLabel(table));

      if (!floorGroups.has(floorLabel)) {
        floorGroups.set(floorLabel, { label: floorLabel, options: [] });
      }

      floorGroups.get(floorLabel)?.options?.push({ value, label });
    });

    options.push(...floorGroups.values());
  } else {
    sorted.forEach((table) => {
      const value = String(table.id);
      const label = getTableOptionLabel(table);
      labelByValue.set(value, label);
      options.push({ value, label });
    });
  }

  const getTableLabel = (tableId?: string | number | null) => {
    if (tableId == null || tableId === "") return "-";
    return labelByValue.get(String(tableId)) ?? "-";
  };

  return { options, getTableLabel };
}
