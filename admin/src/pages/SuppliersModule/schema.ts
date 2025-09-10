import { z } from "zod";

export const SupplierFilterSchema = z.object({
  name: z.string().optional(),
  supplier_code: z.string().optional(),
  address: z.string().optional(),
  contact_number: z.string().optional(),
  email: z.string().optional(),
  pan_vat_number: z.string().optional(),
  contact_person: z.string().optional(),
});

export const SupplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  supplier_code: z
    .string()
    .min(2, "Supplier code must be at least 2 characters")
    .regex(/^[A-Za-z][A-Za-z0-9]*$/, "Supplier code must start with a letter and contain only alphanumeric characters")
    .optional(),
  address: z.string().min(2, "Address must be at least 2 characters").optional(),
  contact_number: z
    .string()
    .min(10, "Contact number must be at least 10 characters")
    .max(20, "Contact number cannot exceed 20 characters")
    .optional(),
  email: z.string().email("Email must be a valid email address").optional(),
  pan_vat_number: z.string().optional(),
  contact_person: z.string().min(2, "Contact person must be at least 2 characters").optional(),
});

export type SupplierFilterType = z.infer<typeof SupplierFilterSchema>;
