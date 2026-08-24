import { z } from "zod";

// A regex pattern for validating a basic email format
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password validation pattern (at least 8 characters, one number, one special character, one uppercase letter)
const passwordRegex =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

export const UserSchema = z.object({
  username: z.string().trim().min(1, "Username is Required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is Required")
    .regex(emailRegex, "Please enter a valid email address"),
  firstName: z.string().trim().min(1, "First Name is Required"),
  lastName: z.string().trim().min(1, "Last Name is Required"),
  mobileNo: z.string().trim().min(1, "Mobile Number is Required"),
  roleId: z.union([
    z.string().trim().min(1, "Role is Required"), // Accept non-empty strings
    z.number().positive("Role ID must be a positive number"), // Accept positive numbers
  ]),
  gender: z.string().trim().min(1, "Gender is Required"),
  mobilePrefix: z.string().trim().min(1, "Mobile Prefix is Required"),
});

// You can add the password confirmation schema if necessary for the "security" tab:
export const SecuritySchema = z.object({
  newPassword: z.string().trim(),
  // .min(8, "New Password must be at least 8 characters long")
  // .regex(
  //   passwordRegex,
  //   "Password must include at least one uppercase letter, one number, and one special character",
  // )
  confirmPassword: z.string().trim(),
  // confirmPassword: z
  //   .string()
  //   .min(1, "Confirm Password is Required")
  //   .refine((val, ctx) => val === ctx.parent.newPassword, {
  //     message: "New Password and Confirm Password must match",
  //   }),
});
