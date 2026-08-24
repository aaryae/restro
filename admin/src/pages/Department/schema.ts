import { z } from "zod";

export const DepartmentSchema = z.object({
  name: z.string().min(1, "Name is Required"),
  description: z.string().optional().nullable(),
  AvgPreparationTime: z.number().min(1, "Minimum time must be at least 1."),
});
