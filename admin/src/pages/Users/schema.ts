import { z } from "zod";

/** Digits only — matches backend create-user rule (exactly 10). */
const MOBILE_NO_REGEX = /^\d{10}$/;
/** E.164-style country calling code, e.g. +977, +91, +1 */
const MOBILE_PREFIX_REGEX = /^\+[1-9]\d{0,3}$/;

export const MOBILE_PREFIX_OPTIONS = [
  { label: "+977 (Nepal)", value: "+977" },
  { label: "+91 (India)", value: "+91" },
  { label: "+1 (US/CA)", value: "+1" },
  { label: "+44 (UK)", value: "+44" },
  { label: "+61 (AU)", value: "+61" },
  { label: "+81 (Japan)", value: "+81" },
  { label: "+86 (China)", value: "+86" },
] as const;

export const UserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(
      /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/,
      "Use letters, numbers, and . _ - only",
    ),
  firstName: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  lastName: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  mobileNo: z.preprocess(
    (val) => String(val ?? "").replace(/\D/g, ""),
    z
      .string()
      .min(1, "Mobile number is required")
      .regex(MOBILE_NO_REGEX, "Enter a valid 10-digit mobile number"),
  ),
  roleId: z.string().min(1, "Role is Required").trim(),
  gender: z.string().min(1, "Gender is Required").trim(),
  mobilePrefix: z.preprocess(
    (val) => {
      const raw = String(val ?? "").trim().replace(/\s+/g, "");
      if (!raw) return "";
      return raw.startsWith("+") ? raw : `+${raw.replace(/^\+/, "")}`;
    },
    z
      .string()
      .min(1, "Mobile prefix is required")
      .regex(
        MOBILE_PREFIX_REGEX,
        "Use a valid country code like +977 or +91",
      ),
  ),
  password: z.string().trim().optional().default(""),
});

export type UserFormType = z.input<typeof UserSchema>;

export const EMPTY_USER_FORM: UserFormType = {
  username: "",
  firstName: "",
  lastName: "",
  mobileNo: "",
  mobilePrefix: "+977",
  roleId: "",
  gender: "",
  password: "",
};

export const SecuritySchema = z
  .object({
    newPassword: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters long")
      .max(32, "Password must not exceed 32 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
