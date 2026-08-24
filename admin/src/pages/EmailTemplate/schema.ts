import { z } from "zod";

export const EmailTemplateSchema = z.object({
  templateName: z.string().min(1, "Template Name is Required"),
  templateKey: z.string().min(1, "Template Key is Required"),
  variables: z.union([
    z.string().min(1, "Port is Required"),
    z.array(z.string()).optional(),
  ]),
  subject: z.string().min(1, "Subject is Required"),
  body: z.string().min(1, "Body is Required"),
});
