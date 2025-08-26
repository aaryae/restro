import { z } from "zod";

export const OrderFilterSchema = z.object({
  email: z.string().optional(),
  mobileNo: z.string().optional(),
  orderDate: z.date().optional(),
  deliveryTime: z.date().optional(),
  paymentStatus: z.string().optional(),
  status: z.string().optional(),
});

export const OrderSchema = z.object({
  orderType: z.enum(["dineIn", "takeaway", "delivery"]),
  tableId: z.string().optional(),
  customerId: z.string().optional(),
  // customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  deliveryAddress: z.string().optional(),
  orderNote: z.string().optional(),
  estimatedTime: z
    .number()
    .min(0, "Estimated time must be positive")
    .optional(),
  orderItems: z
    .array(
      z.object({
        // id: z.string(),
        productId: z.coerce.number(),
        productPrice: z.coerce.number(),
        quantity: z.number().min(1),
        specialInstructions: z.string().optional(),
      }),
    )
    .min(1, "At least one order item is required"),
});

export type OrderFilterType = z.infer<typeof OrderFilterSchema>;
