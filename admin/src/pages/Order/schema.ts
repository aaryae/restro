import { z } from "zod";

export const OrderFilterSchema = z.object({
  email: z.string().optional(),
  mobileNo: z.string().optional(),
  orderDate: z.date().optional(),
  deliveryTime: z.date().optional(),
  paymentStatus: z.string().optional(),
  status: z.string().optional(),
});

export const OrderSchema = z
  .object({
    orderType: z.enum(["dineIn", "takeaway", "delivery"]),
    tableId: z.string().optional(),
    customerId: z.string().optional(),
    takeAwayName: z.string().max(255).optional(),
    customerPhone: z.string().optional(),
    customerEmail: z
      .string()
      .email("Invalid email")
      .optional()
      .or(z.literal("")),
    deliveryAddress: z.string().optional(),
    orderNote: z.string().optional(),
    estimatedTime: z
      .number()
      .min(0, "Estimated time must be positive")
      .optional(),
    orderItems: z.array(
      z.object({
        productId: z.coerce.number().optional(),
        openItemId: z.coerce.number().optional(),
        productPrice: z.coerce.number(),
        quantity: z.number().min(1),
        departmentId: z.coerce.number(),
        specialInstructions: z.string().optional(),
        addons: z
          .array(
            z.object({
              addonId: z.coerce.number(),
              quantity: z.coerce.number().min(1),
              specialInstructions: z.string().optional(),
            }),
          )
          .optional(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.orderType === "dineIn" && !String(data.tableId || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a table",
        path: ["tableId"],
      });
    }
    if (
      data.orderType === "takeaway" &&
      !String(data.takeAwayName || "").trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Take away name is required for takeaway orders",
        path: ["takeAwayName"],
      });
    }
  });

export type OrderFilterType = z.infer<typeof OrderFilterSchema>;

// Cash payment validation: amountTendered is required and must be >= totalAmount
// Usage: CashPaymentSchema(totalAmount).parse({ amountTendered })
export const CashPaymentSchema = (totalAmount: number) =>
  z.object({
    amountTendered: z
      .union([z.number(), z.string().min(1, "Amount is required")])
      .transform((v) => (typeof v === "string" ? Number(v) : v))
      .refine((n) => Number.isFinite(n), "Amount is required")
      .refine(
        (n) => n >= totalAmount,
        `Amount must be at least ${totalAmount}`,
      ),
  });

export type CashPaymentInput = z.infer<ReturnType<typeof CashPaymentSchema>>;
