import type { OrderFormType } from "../schema";

export const CREATE_ORDER_DRAFT_KEY = "nirvana-create-order-draft";
export const CREATE_ORDER_RESTORE_FLAG = "nirvana-create-order-restore-draft";

export type OrderItemDraft = {
  id: string;
  departmentId: number;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  specialInstructions?: string;
  status?: string;
  subtotal: number;
  addons?: {
    addonId: number;
    name: string;
    price: number;
    quantity: number;
  }[];
};

export type CreateOrderDraft = {
  orderType?: OrderFormType["orderType"];
  tableId?: string;
  takeAwayName?: string;
  orderNote?: string;
  orderItems?: OrderItemDraft[];
};

export function readCreateOrderDraft(): CreateOrderDraft | null {
  try {
    const raw = sessionStorage.getItem(CREATE_ORDER_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreateOrderDraft;
  } catch {
    return null;
  }
}

export function writeCreateOrderDraft(draft: CreateOrderDraft) {
  try {
    sessionStorage.setItem(CREATE_ORDER_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

export function clearCreateOrderDraft() {
  try {
    sessionStorage.removeItem(CREATE_ORDER_DRAFT_KEY);
    sessionStorage.removeItem(CREATE_ORDER_RESTORE_FLAG);
  } catch {
    // ignore
  }
}

export function consumeRestoreCreateOrderDraftFlag() {
  try {
    const shouldRestore =
      sessionStorage.getItem(CREATE_ORDER_RESTORE_FLAG) === "1";
    sessionStorage.removeItem(CREATE_ORDER_RESTORE_FLAG);
    return shouldRestore;
  } catch {
    return false;
  }
}
