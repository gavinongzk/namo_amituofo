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
  customFields: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["boolean", "text", "phone", "radio", "postal"]),
    value: z.union([z.string(), z.boolean()]).optional(),
    options: z.array(z.string()).optional()
  })),
  country: z.string(),
  isDraft: z.boolean().optional()
})

// Helper function to create dynamic field validation
const createFieldValidation = (field: { type: string, label: string }) => {
  if (field.type === 'boolean') {
    return z.boolean();
  } else if (field.type === 'phone') {
    return z.string().min(1, { message: "此栏位为必填 / This field is required" });
  } else if (field.type === 'postal') {
    return z.string(); // Postal code validation is handled separately
  } else if (field.label.toLowerCase().includes('name')) {
    return z.string()
      .min(1, { message: "此栏位为必填 / This field is required" })
      .refine(
        (value) => /^[\p{L}\p{N}\s\-.'()\[\]{}]+$/u.test(value),
        { message: "名字只能包含字母、空格、连字符、撇号和句号 / Name can only contain letters, spaces, hyphens, apostrophes, and periods" }
      );
  } else {
    return z.string().min(1, { message: "此栏位为必填 / This field is required" });
  }
};

// Function to create the registration form schema
export const createRegistrationFormSchema = (customFields: Array<{ id: string, type: string, label: string }>) => {
  const groupSchema = z.object(
    Object.fromEntries(
      customFields.map(field => [
        field.id,
        createFieldValidation(field)
      ])
    )
  );

  return z.object({
    groups: z.array(groupSchema),
    pdpaConsent: z.boolean().refine(val => val === true, {
      message: '请阅读并同意隐私政策 / Please read and agree to the Privacy Policy'
    })
  });
};