import { z } from "zod";

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
  mobileNo: z.string().min(1, "Mobile Number is Required").trim(),
  roleId: z.string().min(1, "Role is Required").trim(),
  gender: z.string().min(1, "Gender is Required").trim(),
  mobilePrefix: z.string().min(1, "Mobile Prefix is Required").trim(),
  password: z.string().trim().optional().default(""),
});

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
