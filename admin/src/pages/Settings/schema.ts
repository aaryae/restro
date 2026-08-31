import { z } from "zod";

export const SettingSchema = z.object({
  brand_name: z.string().min(1, "Brand Name is Required"),
  email: z.string().min(1, "Email is Required"),
  primary_phone: z.string().min(1, "Primary Phone is Required"),
  secondary_phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  fav_icon: z.string().min(1, "Fav Icon is Required"),
  brandingImage: z.string().min(1, "Branding Image is Required"),
  brandingFooterImage: z.string().optional().nullable(),
  address: z.string().min(1, "Address is Required"),
  // Kept optional so existing DB values are not wiped if still returned by the API.
  footer_desc: z.string().optional().nullable(),
  google_analytics: z.string().optional().nullable(),
  mapUrl: z.string().optional().nullable(),
  primaryColor: z
    .string()
    .optional()
    .nullable()
    .refine(
      (value) =>
        value === null ||
        value === undefined ||
        /^#[0-9A-Fa-f]{6}$/.test(value),
      {
        message: "Invalid hex color format",
      },
    ),
  pan_vat_number: z.string().optional().nullable(),
  openingBalance: z.coerce.number().optional().nullable(),
});
