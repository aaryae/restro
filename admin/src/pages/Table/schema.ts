import { z } from "zod";

export const TableSchema = z.object({
  tableNo: z.string().min(1, "Table No is Required"),
  floorId: z.coerce.number().min(1, "Floor is Required"),
  type: z.enum(["vip", "regular"], {
    required_error: "Table Type is Required",
  }),
  status: z.enum(["available", "maintenance"], {
    required_error: "Table Status is Required",
  }),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});
