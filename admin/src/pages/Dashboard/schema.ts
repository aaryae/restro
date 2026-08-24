import { z } from "zod";

export const PageFilterSchema = z.object({
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  hobby: z.array(z.string()).optional(),
  date: z
    .tuple([
      z.date().nullable(), // Start date
      z.date().nullable(), // End date
    ])
    .optional()
    .transform((dates) =>
      dates
        ? dates.map((date) => (date ? date.toISOString() : null))
        : undefined,
    ),
});

export type PageFilterType = z.infer<typeof PageFilterSchema>;
