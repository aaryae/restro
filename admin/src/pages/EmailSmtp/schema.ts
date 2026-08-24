import { z } from "zod";

export const EmailSmtpSchema = z.object({
  username: z.string().min(1, "Username is Required"),
  passkey: z.string().min(1, "Pass key is Required"),
  host: z.string().min(1, "Host is Required"),
  port: z.union([
    z.string().min(1, "Port is Required"),
    z
      .number()
      .refine((val) => val > 0, { message: "Port must be a positive number" }),
  ]),
  secure: z.boolean(),
});
