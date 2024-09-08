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

const RegisterForm = ({ event }: { event: IEvent }) => {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRegistrations, setCurrentRegistrations] = useState(0);

  useEffect(() => {
    async function fetchOrderCount() {
      const count = await getOrderCountByEvent(event._id);
      setCurrentRegistrations(count ?? 0); // Ensure count is a number
    }
    fetchOrderCount();
  }, [event._id]);

  const formSchema = z.object({
    ...Object.fromEntries(
      (event.customFields ?? []).map(field => [
        field.id,
        field.type === 'boolean'
          ? z.boolean()
          : z.string().min(1, { message: "This field is required" })
      ])
    )
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      (event.customFields ?? []).map(field => [field.id, field.type === 'boolean' ? false : ''])
    ),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const customFieldValues = Object.entries(values).map(([key, value]) => {
        const field = event.customFields?.find(f => f.id === key);
        return {
          id: key,
          label: field?.label || key,
          type: field?.type as 'boolean' | 'text', // Ensure type is either 'boolean' or 'text'
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
          <p className="text-red-500">This event is fully booked.</p>
        ) : (
          <>
            {event.customFields?.map((field) => (
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
              {isSubmitting ? 'Submitting...' : 'Register'}
            </Button>
          </>
        )}
      </form>
    </Form>
  )
}

export default RegisterForm