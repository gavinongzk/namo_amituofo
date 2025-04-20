import * as z from "zod"

const customFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'boolean', 'phone', 'radio', 'postal']),
  value: z.union([z.string(), z.boolean()]).optional(),
  options: z.array(z.string()).optional(),
})

export const eventFormSchema = z.object({
  title: z.string().min(3, '标题至少需要3个字符 / Title must be at least 3 characters'),
  description: z.string().min(3, '描述至少需要3个字符 / Description must be at least 3 characters').max(400, '描述必须少于400个字符 / Description must be less than 400 characters'),
  location: z.string().min(3, '地点至少需要3个字符 / Location must be at least 3 characters').max(400, '地点必须少于400个字符 / Location must be less than 400 characters'),
  imageUrl: z.string().optional(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  categoryId: z.string(),
  maxSeats: z.number().int().positive(),
  maxRegistrationsPerUser: z.number().int().positive().optional(),
  customFields: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["boolean", "text", "phone", "radio", "postal"]),
    value: z.union([z.string(), z.boolean()]).optional(),
    options: z.array(z.string()).optional()
  })),
  country: z.string(),
})