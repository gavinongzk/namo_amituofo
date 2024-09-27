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
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { categoryCustomFields, CategoryName } from '@/constants'

const RegisterForm = ({ event }: { event: IEvent & { category: { name: CategoryName } } }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRegistrations, setCurrentRegistrations] = useState(0);
  const [groupCount, setGroupCount] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchOrderCount() {
      const count = await getOrderCountByEvent(event._id);
      setCurrentRegistrations(count ?? 0);
    }
    fetchOrderCount();
  }, [event._id]);

  const customFields = categoryCustomFields[event.category.name] || [];

  const formSchema = z.object({
    groups: z.array(
      z.object(
        Object.fromEntries(
          customFields.map(field => [
            field.id,
            field.type === 'boolean'
              ? z.boolean()
              : field.type === 'phone'
                ? z.string().regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" })
                : z.string().min(1, { message: "This field is required" })
          ])
        )
      )
    ).refine(groups => groups[0] && groups[0].phone, {
      message: "Phone number for the first person is required",
      path: ['groups', 0, 'phone'],
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: [Object.fromEntries(
        customFields.map(field => [field.id, field.type === 'boolean' ? false : ''])
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
          const field = customFields.find(f => f.id === key);
          return {
            id: key,
            label: field?.label || key,
            type: field?.type as 'boolean' | 'text' | 'phone',
            value: String(value),
          };
        })
      }));

      const orderData: CreateOrderParams = {
        eventId: event._id,
        createdAt: new Date(),
        customFieldValues,
      };

      console.log("Sending order data:", orderData);

      const response = await fetch('/api/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(`Failed to create order: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.order && data.order._id) {
        router.push(`/events/${event._id}/thank-you?orderId=${data.order._id}`);
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage(`Failed to submit registration: ${(error as Error).message}`);
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
                              defaultCountry="SG"
                              countries={["SG", "MY"]}
                              international
                              countryCallingCodeEditable={false}
                              className="input-field"
                            />
                          ) : (
                            <Input {...formField} value={String(formField.value)} />
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