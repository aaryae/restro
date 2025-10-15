import { z } from "zod";

export const AddonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce
    .number({ message: "Price must be a number" })
    .positive("Price must be greater than 0"),
  mediaArr: z
    .array(z.string().min(1, "Each Image URL must be valid"))
    .optional()
    .default([]),
});

export type AddonType = z.infer<typeof AddonSchema>;
