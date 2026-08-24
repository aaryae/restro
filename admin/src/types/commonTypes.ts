export interface PaginationQueryParams {
  page: number;
  limit: number;
  title?: string;
}

export interface PaginationType {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search?: Record<string, any>;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  specialInstructions: string;
}

export interface Table {
  id: number;
  floor: { id: number; floorNo: string };
  tableNo: string;
  name: string | null;
  type: "indoor" | "outdoor" | "vip" | "regular";
  capacity: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  currentSessionId: string | null;
  sessionStartTime: string | null;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: "dineIn" | "takeaway" | "delivery";
  tableId: string | null;
  tableName: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress?: string;
  orderItems: OrderItem[];
  totalAmount: number;
  status: "preparing" | "ready" | "completed";
  orderNote: string;
  estimatedTime: number;
  createdAt: string;
  updatedAt: string;
}
