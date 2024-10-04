import * as z from "zod"

const customFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'boolean', 'phone', 'radio']),
  value: z.union([z.string(), z.boolean()]).optional(),
  options: z.array(z.string()).optional(),
})

export const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(400, 'Description must be less than 400 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters').max(400, 'Location must be less than 400 characters'),
  imageUrl: z.string(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  categoryId: z.string(),
  maxSeats: z.number().int().positive(),
  customFields: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["boolean", "text", "phone", "radio"]),
    value: z.union([z.string(), z.boolean()]).optional(),
    options: z.array(z.string()).optional()
  })),
  registrationSuccessMessage: z.string().optional(),
  country: z.enum(['Singapore', 'Malaysia']),
})