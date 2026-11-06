import { BACKEND_BASE_URL } from "@/constants";
import { getTenantSlug } from "@/utils/tenantHandler";

type GuestResponse<T> = {
  success: boolean;
  status?: number;
  msg?: string;
  message?: string;
  data?: T;
};

function apiRoot() {
  return String(BACKEND_BASE_URL || "/api/v1/").replace(/\/?$/, "/");
}

async function guestFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<GuestResponse<T>> {
  const headers = new Headers(init?.headers || {});
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }

  const tenantSlug = getTenantSlug();
  if (tenantSlug) headers.set("x-tenant-slug", tenantSlug);

  const res = await fetch(`${apiRoot()}${path.replace(/^\//, "")}`, {
    ...init,
    headers,
  });

  let body: GuestResponse<T> = { success: false };
  try {
    body = await res.json();
  } catch {
    body = {
      success: false,
      msg: "Could not read the server response.",
    };
  }

  if (!res.ok) {
    return {
      ...body,
      success: false,
      status: res.status,
      msg: body.msg || body.message || `Request failed (${res.status})`,
    };
  }

  return body;
}

export type GuestCafe = {
  name: string;
  slug: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  primaryColor: string | null;
  welcome?: string | null;
  hours?: string | null;
  infoNote?: string | null;
  menuFontSize?: "md" | "lg" | "xl" | null;
  wifi?: { ssid: string; password: string } | null;
};

export type GuestVariant = {
  id: number;
  name: string;
  price: number;
  description?: string | null;
};

export type GuestMenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  available: boolean;
  isTopSelling: boolean;
  variants: GuestVariant[];
};

export type GuestSection = {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  items: GuestMenuItem[];
};

export type GuestMenuPayload = {
  cafe: GuestCafe;
  table: {
    id: number;
    tableNo: string;
    status?: string;
    sessionId?: string | null;
  } | null;
  sections: GuestSection[];
};

export type GuestBillAddon = {
  id: number;
  name: string;
  quantity: number;
  subtotal: number;
};

export type GuestBillItem = {
  id: number;
  name: string;
  quantity: number;
  itemTotal: number;
  addons: GuestBillAddon[];
};

export type GuestBillOrder = {
  id: number;
  items: GuestBillItem[];
};

export type GuestBillPayload = {
  cafe: GuestCafe;
  table: { id: number; tableNo: string };
  orders: GuestBillOrder[];
  hasOpenOrders: boolean;
  billRequested: boolean;
  payableTotal: number;
};

export function fetchGuestMenu(token?: string | null) {
  const qs = token ? `?token=${encodeURIComponent(token)}` : "";
  return guestFetch<GuestMenuPayload>(`guest/menu${qs}`);
}

export function fetchGuestBill(token: string) {
  return guestFetch<GuestBillPayload>(
    `guest/bill?token=${encodeURIComponent(token)}`,
  );
}

export function requestGuestBill(token: string) {
  return guestFetch<{ cooldownSeconds?: number }>(`guest/call-bill`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
