import { z } from "zod";

export const ProductVariantSchema = z.object({
  name: z.string().min(1, "Name is Required"),
  description: z.string().optional().nullable(),
  quantity: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : v,
    z.coerce
      .number({ message: "Quantity must be a number" })
      .int()
      .positive("Quantity must be greater than 0"),
  ),
  price: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : v,
    z.coerce
      .number({ message: "Price must be a number" })
      .min(0, "Price cannot be negative"),
  ),
  productId: z.string().min(1, "Item is Required"),
  media: z.union([
    z.string().min(1, "Image Url is Required"),
    z.array(z.string().min(1, "Each Image Url must be a valid string")),
  ]),
});
