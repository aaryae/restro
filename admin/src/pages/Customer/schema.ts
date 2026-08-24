import { z } from "zod";

export const CustomerFilterSchema = z.object({
  firstName: z.string().optional(),
  email: z.string().optional(),
  userType: z.string().optional(),
  createdAt: z.date().optional(),
});

export const CustomerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      return val;
    },
    z.string().email("Email must be a valid email address").optional(),
  ),
  mobileNo: z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return undefined;
      return String(val).replace(/\D/g, "");
    },
    z
      .string({ required_error: "Mobile number is required" })
      .min(1, "Mobile number is required")
      .regex(/^\d+$/, "Mobile number must contain only digits")
      .min(10, "Mobile number must be at least 10 digits")
      .max(15, "Mobile number cannot exceed 15 digits"),
  ),
  createdAt: z.date().optional(),
});

export type CustomerFilterType = z.infer<typeof CustomerFilterSchema>;
