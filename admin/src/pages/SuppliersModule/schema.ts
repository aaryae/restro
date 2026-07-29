import { z } from "zod";

export const SupplierFilterSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  contact_number: z.string().optional().or(z.literal("")),
});
export type SupplierFilterInput = z.infer<typeof SupplierFilterSchema>;

export const SupplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  supplier_code: z
    .string()
    .min(2, "Supplier code must be at least 2 characters")
    .regex(
      /^[A-Za-z][A-Za-z0-9]*$/,
      "Supplier code must start with a letter and contain only alphanumeric characters",
    )
    .optional(),
  address: z.string().optional().nullable(),
  contact_number: z.preprocess((val) => {
    if (val === "" || val === undefined) return null;
    return val;
  }, z
    .string()
    .regex(/^\d+$/, "Contact number must contain only digits")
    .min(10, "Contact number must be at least 10 digits")
    .max(10, "Contact number cannot exceed 10 digits")
    .nullable()
    .optional()),
  email: z.preprocess((val) => {
    if (val === "" || val === undefined) return null;
    return val;
  }, z.string().email("Email must be a valid email address").nullable().optional()),
  pan_vat_number: z.string().optional().nullable(),
  contact_person: z.string().optional().nullable(),
});
