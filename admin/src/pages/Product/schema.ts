import { z } from "zod";

export const VariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  description: z.string().optional(),
  price: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : v,
    z.coerce
      .number({ message: "Price must be a number" })
      .positive("Price must be greater than 0"),
  ),
  quantity: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : v,
    z.coerce
      .number({ message: "Quantity must be a number" })
      .int()
      .min(0, "Quantity cannot be negative")
      .optional(),
  ),
});

export const ProductSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().nullish(),
    departmentId: z.coerce.number().min(1, "Department is required"),
    productCategoryId: z.coerce.number().min(1, "Item Category is required"),
    mediaArr: z
      .array(z.string().min(1, "Each Image URL must be valid"))
      .optional()
      .default([]),
    addons: z.array(z.coerce.number()).optional().default([]),
    hasVariant: z.boolean().default(false),
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
    variants: z.array(VariantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasVariant) {
      if (data.price === undefined || data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price must be greater than 0 when variants are disabled",
          path: ["price"],
        });
      }
      if (data.variants && data.variants.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Variants must be empty when variants are disabled",
          path: ["variants"],
        });
      }
    } else {
      if (!data.variants || data.variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one variant is required when variants are enabled",
          path: ["variants"],
        });
      }
      if (data.price !== 0 && data.price !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price must be 0 when variants are enabled",
          path: ["price"],
        });
      }
    }
  });
