import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string().min(1, "Name is Required"),
  // alias: z.array(z.string().optional()),
  description: z.string().min(1, "Description is Required"),
  quantity: z.number({ message: "price must be a number" }).int().positive(),
  departmentId: z.coerce.number().min(1, "Department is Required"),
  price: z.union([
    z.string(),
    z.number({ message: "price must be a number" }).positive(),
  ]),
  productCategoryId: z.string().min(1, "Product Category is Required"),
  mediaArr: z.union([
    z.string().min(1, "Image Url is Required"),
    z.array(z.string().min(1, "Each Image Url must be a valid string")),
  ]),
});
