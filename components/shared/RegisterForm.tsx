// components/shared/RegisterForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { IEvent } from '@/lib/database/models/event.model'
import { useUser } from '@clerk/nextjs'
import { CreateOrderParams } from "@/types"
import { getOrderCountByEvent } from '@/lib/actions/order.actions'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { categoryCustomFields, CategoryName } from '@/constants'

const RegisterForm = ({ event }: { event: IEvent & { category: { name: CategoryName } } }) => {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRegistrations, setCurrentRegistrations] = useState(0);

  useEffect(() => {
    async function fetchOrderCount() {
      const count = await getOrderCountByEvent(event._id);
      setCurrentRegistrations(count ?? 0);
    }
    fetchOrderCount();
  }, [event._id]);

  const customFields = categoryCustomFields[event.category.name] || [];

  const formSchema = z.object({
    ...Object.fromEntries(
      customFields.map(field => [
        field.id,
        field.type === 'boolean'
          ? z.boolean()
          : field.type === 'phone'
            ? z.string().regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" })
            : z.string().min(1, { message: "This field is required" })
      ])
    )
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      customFields.map(field => [field.id, field.type === 'boolean' ? false : ''])
    ),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const customFieldValues = Object.entries(values).map(([key, value]) => {
        const field = customFields.find(f => f.id === key);
        return {
          id: key,
          label: field?.label || key,
          type: field?.type as 'boolean' | 'text' | 'phone',
          value: String(value),
        };
      });

      const order: CreateOrderParams = {
        eventId: event._id,
        buyerId: user?.id || '',
        createdAt: new Date(),
        customFieldValues,
      };

      const response = await fetch('/api/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const newOrder = await response.json();

      router.push(`/events/${event._id}/thank-you?orderId=${newOrder.order._id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFullyBooked = currentRegistrations >= event.maxSeats;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {isFullyBooked ? (
          <p className="text-red-500">This event is fully booked. 此活动已满员。</p>
        ) : (
          <>
            {customFields.map((field) => (
              <FormField
                key={field.id}
                control={form.control}
                name={field.id}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      {field.type === 'boolean' ? (
                        <Checkbox
                          checked={formField.value as boolean}
                          onCheckedChange={formField.onChange}
                        />
                      ) : field.type === 'phone' ? (
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting... 提交中...' : 'Register 注册'}
            </Button>
          </>
        )}
      </form>
    </Form>
  )
}

export default RegisterForm