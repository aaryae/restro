import { z } from "zod";

export const FloorSchema = z.object({
  floorNo: z.string().min(1, "Floor No is Required"),
  name: z.string().min(1, "Name is Required"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});
