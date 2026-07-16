import { z } from "zod";

export const OpenItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  quantity: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : v,
    z.coerce
      .number({ message: "Quantity must be a number" })
      .int()
      .min(1, "Quantity must be at least 1"),
  ),
  price: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : v,
    z.coerce
      .number({ message: "Price must be a number" })
      .min(0, "Price cannot be negative")
      .optional(),
  ),
  departmentId: z.coerce
    .number({ message: "Department is required" })
    .min(1, "Please select a department"),
  stockStatus: z
    .enum(["in_stock", "out_of_stock", "low_stock"])
    .default("in_stock"),
  mediaArr: z
    .array(z.string().min(1, "Each Image URL must be valid"))
    .optional(),
});
