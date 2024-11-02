// components/shared/RegisterForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { IEvent } from '@/lib/database/models/event.model'
import { CreateOrderParams } from "@/types"
import { getOrderCountByEvent } from '@/lib/actions/order.actions'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { categoryCustomFields, CategoryName } from '@/constants'
import { CustomField } from "@/types"
import { useUser } from '@clerk/nextjs';
import { getCookie } from 'cookies-next';


const isValidName = (name: string) => {
  // Regex to match only standard letters, spaces, and common punctuation
  const nameRegex = /^[a-zA-Z\s\-.']+$/;
  return nameRegex.test(name);
};

const sanitizeName = (name: string) => {
  // Remove emojis and other non-standard characters
  return name.replace(/[^\p{L}\p{N}\s\-.']/gu, '');
};

const RegisterForm = ({ event }: { event: IEvent & { category: { name: CategoryName } } }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRegistrations, setCurrentRegistrations] = useState(0);
  const [message, setMessage] = useState('');
  const { user, isLoaded } = useUser();
  const [userCountry, setUserCountry] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderCount() {
      const count = await getOrderCountByEvent(event._id);
      setCurrentRegistrations(count ?? 0);
    }
    fetchOrderCount();
  }, [event._id]);

  useEffect(() => {
    const detectCountry = () => {
      if (isLoaded && user && user.publicMetadata.country) {
        setUserCountry(user.publicMetadata.country as string);
      } else {
        const cookieCountry = getCookie('userCountry');
        if (cookieCountry) {
          setUserCountry(cookieCountry as string);
        }
      }
    };

    detectCountry();
  }, [isLoaded, user]);

  const customFields = categoryCustomFields[event.category.name as CategoryName] || categoryCustomFields.default;

  const formSchema = z.object({
    groups: z.array(
      z.object(
        Object.fromEntries(
          customFields.map(field => [
            field.id,
            field.type === 'boolean'
              ? z.boolean()
              : field.type === 'phone'
                ? z.string()
                    .refine(
                      (value) => isValidPhoneNumber(value),
                      { message: "Invalid phone number" }
                    )
                : field.label.toLowerCase().includes('name')
                  ? z.string()
                      .min(1, { message: "This field is required" })
                      .refine(
                        (value) => isValidName(value),
                        { message: "Name can only contain letters, spaces, hyphens, apostrophes, and periods" }
                      )
                  : z.string().min(1, { message: "This field is required" })
          ])
        )
      )
    )
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: [Object.fromEntries(
        customFields.map(field => [
          field.id, 
          field.type === 'boolean' ? false : 
          field.type === 'phone' ? (userCountry === 'Singapore' ? '+65' : userCountry === 'Malaysia' ? '+60' : '') : 
          ''
        ])
      )]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups"
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("Form submitted with values:", values);
    setIsSubmitting(true);
    setMessage(''); // Clear any previous message
    try {
      const customFieldValues = values.groups.map((group, index) => ({
        groupId: `group_${index + 1}`,
        fields: Object.entries(group).map(([key, value]) => {
          const field = customFields.find(f => f.id === key) as CustomField;
          return {
            id: key,
            label: field?.label || key,
            type: field?.type,
            value: String(value),
            options: field?.options || [],
          };
        })
      }));

      const orderData: CreateOrderParams = {
        eventId: event._id,
        createdAt: new Date(),
        customFieldValues,
      };

      const response = await fetch('/api/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      router.push(`/orders/${data.order._id}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullyBooked = currentRegistrations >= event.maxSeats;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {message && <p className="text-red-500">{message}</p>}
        {isFullyBooked ? (
          <p className="text-red-500">This event is fully booked. 此活动已满员。</p>
        ) : (
          <>
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4">
                <h3 className="font-bold">Person {index + 1}</h3>
                {customFields.map((customField) => (
                  <FormField
                    key={customField.id}
                    control={form.control}
                    name={`groups.${index}.${customField.id}`}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{customField.label}</FormLabel>
                        <FormControl>
                          {customField.type === 'boolean' ? (
                            <Checkbox
                              checked={formField.value as boolean}
                              onCheckedChange={formField.onChange}
                            />
                          ) : customField.type === 'phone' ? (
                            <PhoneInput
                              value={formField.value as string}
                              onChange={(value) => formField.onChange(value || '')}
                              defaultCountry={userCountry === 'Singapore' ? 'SG' : userCountry === 'Malaysia' ? 'MY' : undefined}
                              countries={["SG", "MY"]}
                              international
                              countryCallingCodeEditable={false}
                              className="input-field"
                            />
                          ) : customField.type === 'radio' ? (
                            <div className="flex gap-4">
                              {('options' in customField) && customField.options?.map((option) => (
                                <label key={option.value} className="flex items-center">
                                  <input
                                    type="radio"
                                    value={option.value}
                                    checked={formField.value === option.value}
                                    onChange={() => formField.onChange(option.value)}
                                    className="mr-2"
                                  />
                                  {option.label}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <Input 
                              {...formField} 
                              value={String(formField.value)}
                              onChange={(e) => {
                                const sanitized = sanitizeName(e.target.value);
                                formField.onChange(sanitized);
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const text = e.clipboardData.getData('text');
                                const sanitized = sanitizeName(text);
                                formField.onChange(sanitized);
                              }}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                {index > 0 && (
                  <Button type="button" variant="destructive" onClick={() => remove(index)}>
                    Remove Person
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-4 mt-6">
              <Button
                type="button"
                onClick={() => append(Object.fromEntries(
                  customFields.map(field => [field.id, field.type === 'boolean' ? false : ''])
                ))}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Add Another Person 添加另一位
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Submitting... 提交中...' : 'Register 注册'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Form>
  )
}

export default RegisterForm