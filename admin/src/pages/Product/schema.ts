import { z } from "zod";

export const VariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  description: z.string().optional(),
  price: z.coerce
    .number({ message: "Price must be a number" })
    .positive("Price must be greater than 0"),
  quantity: z.coerce
    .number({ message: "Quantity must be a number" })
    .int()
    .min(0, "Quantity cannot be negative")
    .optional(),
});

export const ProductSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().nullable(),
    departmentId: z.coerce.number().min(1, "Department is required"),
    productCategoryId: z.coerce.number().min(1, "Product Category is required"),
    mediaArr: z
      .array(z.string().min(1, "Each Image URL must be valid"))
      .optional()
      .default([]),
    addons: z
      .array(z.coerce.number())
      .optional()
      .default([]),
    hasVariant: z.boolean().default(false),
    // quantity: z.coerce
    //   .number({ message: "Quantity must be a number" })
    //   .int()
    //   .min(0, "Quantity cannot be negative")
    //   .optional(),
    price: z.coerce
      .number({ message: "Price must be a number" })
      .min(0, "Price cannot be negative")
      .optional(),
    variants: z.array(VariantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.hasVariant) {
      // if (data.quantity === undefined || data.quantity <= 0) {
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: "Quantity must be greater than 0 when variants are disabled",
      //     path: ["quantity"],
      //   });
      // }
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
      // if (data.quantity !== 0 && data.quantity !== undefined) {
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: "Quantity must be 0 when variants are enabled",
      //     path: ["quantity"],
      //   });
      // }
    }
  });
