import { z } from "zod";

export const SupplierFilterSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  pan_number: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  point_of_contact: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  contact_number: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
});

export const SupplierSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  pan_number: z.string().optional(),
  point_of_contact: z.string().optional(),
  contact_number: z.string().optional(),
});

export type SupplierFilterType = z.infer<typeof SupplierFilterSchema>;
