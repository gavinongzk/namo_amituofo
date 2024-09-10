import * as z from "zod"

const customFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'boolean', 'phone']), // Added 'phone' type
  value: z.string().optional(), // Add this line
})

export const phoneValidation = z.string().refine((value) => {
  const singaporePhoneRegex = /^[0-9]{8}$/;
  const malaysiaPhoneRegex = /^[0-9]{10,11}$/;
  return singaporePhoneRegex.test(value) || malaysiaPhoneRegex.test(value);
}, {
  message: "Phone number must be 8 digits long for Singapore or 10-11 digits long for Malaysia",
});

export const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(400, 'Description must be less than 400 characters'),
  location: z.string().min(3, 'Location must be at least 3 characters').max(400, 'Location must be less than 400 characters'),
  imageUrl: z.string(),
  startDateTime: z.date(),
  endDateTime: z.date(),
  categoryId: z.string(),
  customFields: z.array(customFieldSchema).optional(),
  maxSeats: z.number().min(1, 'Maximum seats must be at least 1'),
  registrationSuccessMessage: z.string().optional(),
})