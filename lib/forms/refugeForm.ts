import * as z from 'zod'

export const refugeFormSchema = z.object({
  chineseName: z.string().min(1, '中文姓名是必填项 / Chinese Name is required'),
  englishName: z.string().min(1, '英文姓名是必填项 / English Name is required'),
  age: z
    .string()
    .min(1, '年龄是必填项 / Age is required')
    .regex(/^\d+$/, '年龄必须是数字 / Age must be a number'),
  dob: z.string().min(1, '出生日期是必填项 / Date of Birth is required'),
  gender: z.string().min(1, '性别是必填项 / Gender is required'),
  contactNumber: z.string().min(1, '联系号码是必填项 / Contact Number is required'),
  address: z.string().min(1, '地址是必填项 / Address is required'),
})

export type RefugeFormData = z.infer<typeof refugeFormSchema>
export type RefugeFieldKey = keyof RefugeFormData
export type RefugeFormValues = Partial<Record<RefugeFieldKey, string>>

export const refugeFieldOrder: RefugeFieldKey[] = [
  'chineseName',
  'englishName',
  'age',
  'dob',
  'gender',
  'contactNumber',
  'address',
]

export function firstMissingRefugeField(values: RefugeFormValues): RefugeFieldKey | null {
  for (const k of refugeFieldOrder) {
    if (!values[k] || !String(values[k]).trim()) return k
  }
  return null
}

export function refugeQuestionForField(field: RefugeFieldKey): string {
  switch (field) {
    case 'chineseName':
      return '请告诉我您的中文姓名。 / What is your Chinese name?'
    case 'englishName':
      return '请告诉我您的英文姓名。 / What is your English name?'
    case 'age':
      return '请问您今年几岁？ / What is your age?'
    case 'dob':
      return '请告诉我您的出生日期（例如 1990-01-30）。 / What is your date of birth (e.g. 1990-01-30)?'
    case 'gender':
      return '请问性别是男众还是女众？ / Gender: male or female?'
    case 'contactNumber':
      return '请告诉我您的联系号码（含国家码，例如 +65...）。 / What is your contact number (with country code, e.g. +65...)?'
    case 'address':
      return '请告诉我您的地址。 / What is your address?'
  }
}


