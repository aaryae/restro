import { z } from "zod";

export const AddonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : v,
    z.coerce
      .number({ message: "Price must be a number" })
      .positive("Price must be greater than 0"),
  ),
  imageUrl: z.string().trim().min(1, "Image is required"),
  mediaArr: z
    .array(z.string().min(1, "Each Image URL must be valid"))
    .optional()
    .default([]),
  recipes: z
    .array(
      z.object({
        stockItemId: z.string().min(1, "Select an inventory item"),
        measuringUnitId: z.string().min(1, "Select a unit"),
        quantity: z.preprocess(
          (v) =>
            v === "" || v === null || v === undefined || Number.isNaN(v)
              ? undefined
              : v,
          z.coerce
            .number({ message: "Quantity must be a number" })
            .positive("Quantity must be greater than 0"),
        ),
      }),
    )
    .optional()
    .default([]),
});

export type AddonType = z.infer<typeof AddonSchema>;
