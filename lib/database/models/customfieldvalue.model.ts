import * as z from "zod";

export const CustomFieldValueSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'boolean', 'phone']),
  value: z.string().optional(),
});

export const CustomFieldGroupSchema = z.object({
  groupId: z.string(),
  fields: z.array(CustomFieldValueSchema),
});

